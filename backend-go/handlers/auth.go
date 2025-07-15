package handlers

import (
	"bytes"
	"encoding/json"
	"io"
	"argumentum-backend/models"
	"argumentum-backend/utils"
	"context"
	"crypto/rand"
	"encoding/hex"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/supabase-community/supabase-go"
)

type AuthHandler struct {
	supabase *supabase.Client
}

func NewAuthHandler() *AuthHandler {
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")

	if supabaseURL == "" {
		supabaseURL = "https://mefgswdpeellvaggvttc.supabase.co"
	}

	client, err := supabase.NewClient(supabaseURL, supabaseKey, nil)
	if err != nil {
		log.Printf("Error creating Supabase client: %v", err)
	}

	return &AuthHandler{
		supabase: client,
	}
}

// --- Aux Function: DoSupabaseREST ---
func (h *AuthHandler) doSupabaseREST(ctx context.Context, method, path string, payload interface{}, result interface{}) error {
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")
	if supabaseURL == "" {
		supabaseURL = "https://mefgswdpeellvaggvttc.supabase.co"
	}

	url := supabaseURL + path

	var body io.Reader
	if payload != nil {
		buf, err := json.Marshal(payload)
		if err != nil {
			return err
		}
		body = bytes.NewBuffer(buf)
	}

	req, err := http.NewRequestWithContext(ctx, method, url, body)
	if err != nil {
		return err
	}

	req.Header.Set("apikey", supabaseKey)
	req.Header.Set("Authorization", "Bearer "+supabaseKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return &models.ApiError{
			Status:  resp.StatusCode,
			Message: string(respBytes),
		}
	}

	if result != nil {
		return json.Unmarshal(respBytes, result)
	}
	return nil
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Error: "Dados inválidos: " + err.Error(),
		})
		return
	}

	ctx := context.Background()
	payload := map[string]interface{}{
		"email":    req.Email,
		"password": req.Password,
	}
	var authResp struct {
		Session interface{} `json:"session"`
		User    struct {
			ID    string `json:"id"`
			Email string `json:"email"`
		} `json:"user"`
	}
	err := h.doSupabaseREST(ctx, "POST", "/auth/v1/token?grant_type=password", payload, &authResp)
	if err != nil || authResp.User.ID == "" {
		log.Printf("Login error: %v", err)
		c.JSON(http.StatusUnauthorized, models.ApiResponse{
			Error: "Email ou senha incorretos",
		})
		return
	}

	userID := authResp.User.ID

	user, err := h.getUserProfile(userID)
	if err != nil {
		log.Printf("Error getting user profile: %v", err)
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Error: "Erro ao buscar perfil do usuário",
		})
		return
	}

	token, err := utils.GenerateJWT(user.ID)
	if err != nil {
		log.Printf("Error generating JWT: %v", err)
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Error: "Erro interno do servidor",
		})
		return
	}

	refreshToken := h.generateRefreshToken()

	authResponse := models.AuthResponse{
		User:         *user,
		Token:        token,
		RefreshToken: refreshToken,
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Data: authResponse,
	})
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Error: "Dados inválidos: " + err.Error(),
		})
		return
	}

	if !req.TermsAccepted {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Error: "É necessário aceitar os termos de uso",
		})
		return
	}

	ctx := context.Background()
	payload := map[string]interface{}{
		"email":    req.Email,
		"password": req.Password,
		"data": map[string]interface{}{
			"full_name":         req.FullName,
			"terms_accepted":    req.TermsAccepted,
			"terms_accepted_at": time.Now().Format(time.RFC3339),
		},
	}
	var signupResp struct {
		User struct {
			ID    string `json:"id"`
			Email string `json:"email"`
		} `json:"user"`
	}
	err := h.doSupabaseREST(ctx, "POST", "/auth/v1/signup", payload, &signupResp)
	if err != nil || signupResp.User.ID == "" {
		log.Printf("Registration error: %v", err)
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Error: "Erro ao criar conta: " + err.Error(),
		})
		return
	}

	user, err := h.getUserProfile(signupResp.User.ID)
	if err != nil || user == nil {
		log.Printf("Error getting user profile after registration: %v", err)
		user = &models.User{
			ID:      signupResp.User.ID,
			Email:   req.Email,
			Name:    req.FullName,
			IsAdmin: false,
		}
	}

	token, err := utils.GenerateJWT(user.ID)
	if err != nil {
		log.Printf("Error generating JWT: %v", err)
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Error: "Erro interno do servidor",
		})
		return
	}

	refreshToken := h.generateRefreshToken()

	authResponse := models.AuthResponse{
		User:         *user,
		Token:        token,
		RefreshToken: refreshToken,
	}

	c.JSON(http.StatusCreated, models.ApiResponse{
		Data: authResponse,
	})
}

func (h *AuthHandler) Logout(c *gin.Context) {
	c.JSON(http.StatusOK, models.ApiResponse{
		Message: "Logout realizado com sucesso",
	})
}

func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var req models.RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Error: "Token de refresh inválido",
		})
		return
	}

	if len(req.RefreshToken) < 10 {
		c.JSON(http.StatusUnauthorized, models.ApiResponse{
			Error: "Token de refresh inválido",
		})
		return
	}

	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, models.ApiResponse{
			Error: "Usuário não autenticado",
		})
		return
	}

	user, err := h.getUserProfile(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Error: "Erro ao buscar perfil do usuário",
		})
		return
	}

	token, err := utils.GenerateJWT(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Error: "Erro interno do servidor",
		})
		return
	}

	refreshToken := h.generateRefreshToken()

	authResponse := models.AuthResponse{
		User:         *user,
		Token:        token,
		RefreshToken: refreshToken,
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Data: authResponse,
	})
}

func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var req models.ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Error: "Email inválido",
		})
		return
	}

	ctx := context.Background()
	payload := map[string]interface{}{
		"email": req.Email,
	}
	var resp interface{}
	err := h.doSupabaseREST(ctx, "POST", "/auth/v1/recover", payload, &resp)
	if err != nil {
		log.Printf("Error sending reset password email: %v", err)
		c.JSON(http.StatusOK, models.ApiResponse{
			Message: "Se o email existir, você receberá instruções para redefinir sua senha",
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Message: "Se o email existir, você receberá instruções para redefinir sua senha",
	})
}

// --- Buscar perfil ---

func (h *AuthHandler) getUserProfile(userID string) (*models.User, error) {
	ctx := context.Background()
	var profiles []struct {
		ID      string `json:"id"`
		Email   string `json:"email"`
		Name    string `json:"name"`
		IsAdmin bool   `json:"is_admin"`
	}
	query := map[string]string{"id": "eq." + userID}
	queryString := "?"
	for k, v := range query {
		queryString += k + "=" + v + "&"
	}
	url := "/rest/v1/profiles" + queryString[:len(queryString)-1]
	err := h.doSupabaseREST(ctx, "GET", url, nil, &profiles)
	if err != nil {
		return nil, err
	}
	if len(profiles) == 0 {
		return nil, nil
	}
	profile := profiles[0]
	return &models.User{
		ID:      profile.ID,
		Email:   profile.Email,
		Name:    profile.Name,
		IsAdmin: profile.IsAdmin,
	}, nil
}

func (h *AuthHandler) generateRefreshToken() string {
	bytes := make([]byte, 32)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}
