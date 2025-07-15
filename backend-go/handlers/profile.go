package handlers

import (
	"bytes"
	"encoding/json"
	"io"
	"argumentum-backend/models"
	"context"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/supabase-community/supabase-go"
)

type ProfileHandler struct {
	supabase *supabase.Client
}

func NewProfileHandler() *ProfileHandler {
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")
	
	if supabaseURL == "" {
		supabaseURL = "https://mefgswdpeellvaggvttc.supabase.co"
	}
	
	client, err := supabase.NewClient(supabaseURL, supabaseKey, &supabase.ClientOptions{})
	if err != nil {
		client = nil
	}

	return &ProfileHandler{
		supabase: client,
	}
}

// --- Aux Function: doSupabaseREST ---
func (h *ProfileHandler) doSupabaseREST(ctx context.Context, method, path string, payload interface{}, result interface{}) error {
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

func (h *ProfileHandler) GetProfile(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, models.ApiResponse{
			Error: "Usuário não autenticado",
		})
		return
	}

	var profiles []struct {
		ID      string `json:"id"`
		Email   string `json:"email"`
		Name    string `json:"name"`
		IsAdmin bool   `json:"is_admin"`
	}

	ctx := context.Background()
	query := map[string]string{"id": "eq." + userID}
	queryString := "?"
	for k, v := range query {
		queryString += k + "=" + v + "&"
	}
	url := "/rest/v1/profiles" + queryString[:len(queryString)-1]
	if h.supabase != nil {
		err := h.doSupabaseREST(ctx, "GET", url, nil, &profiles)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.ApiResponse{
				Error: "Erro ao buscar perfil",
			})
			return
		}
	}

	if len(profiles) == 0 {
		c.JSON(http.StatusNotFound, models.ApiResponse{
			Error: "Perfil não encontrado",
		})
		return
	}

	profile := profiles[0]
	user := models.User{
		ID:      profile.ID,
		Email:   profile.Email,
		Name:    profile.Name,
		IsAdmin: profile.IsAdmin,
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Data: user,
	})
}

func (h *ProfileHandler) UpdateProfile(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, models.ApiResponse{
		Error: "Endpoint not implemented yet",
	})
}
