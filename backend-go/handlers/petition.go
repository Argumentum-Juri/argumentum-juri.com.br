package handlers

import (
	"argumentum-backend/models"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/supabase-community/supabase-go"
)

type PetitionHandler struct {
	supabase *supabase.Client
}

func NewPetitionHandler() *PetitionHandler {
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")
	
	if supabaseURL == "" {
		supabaseURL = "https://mefgswdpeellvaggvttc.supabase.co"
	}
	
	client, err := supabase.NewClient(supabaseURL, supabaseKey, &supabase.ClientOptions{})
	if err != nil {
		client = nil
	}

	return &PetitionHandler{
		supabase: client,
	}
}

func (h *PetitionHandler) GetPetitions(c *gin.Context) {
	// For now, return empty array
	c.JSON(http.StatusOK, models.ApiResponse{
		Data: []interface{}{},
	})
}

func (h *PetitionHandler) CreatePetition(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, models.ApiResponse{
		Error: "Endpoint not implemented yet",
	})
}

func (h *PetitionHandler) GetPetitionByID(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, models.ApiResponse{
		Error: "Endpoint not implemented yet",
	})
}

func (h *PetitionHandler) UpdatePetition(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, models.ApiResponse{
		Error: "Endpoint not implemented yet",
	})
}

func (h *PetitionHandler) DeletePetition(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, models.ApiResponse{
		Error: "Endpoint not implemented yet",
	})
}

func (h *PetitionHandler) GetTeams(c *gin.Context) {
	c.JSON(http.StatusOK, models.ApiResponse{
		Data: []interface{}{},
	})
}

func (h *PetitionHandler) CreateTeam(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, models.ApiResponse{
		Error: "Endpoint not implemented yet",
	})
}

func (h *PetitionHandler) GetTeamByID(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, models.ApiResponse{
		Error: "Endpoint not implemented yet",
	})
}

func (h *PetitionHandler) UpdateTeam(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, models.ApiResponse{
		Error: "Endpoint not implemented yet",
	})
}

func (h *PetitionHandler) DeleteTeam(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, models.ApiResponse{
		Error: "Endpoint not implemented yet",
	})
}

func (h *PetitionHandler) GetTeamTokenBalance(c *gin.Context) {
	if h.supabase == nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Error: "Erro interno do servidor",
		})
		return
	}

	// Obter ID da equipe dos parâmetros
	teamID := c.Param("id")
	if teamID == "" {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Error: "ID da equipe é obrigatório",
		})
		return
	}

	// Obter ID do usuário do contexto (definido pelo middleware de autenticação)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ApiResponse{
			Error: "Usuário não autenticado",
		})
		return
	}

	userIDStr, ok := userID.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Error: "Erro interno: ID do usuário inválido",
		})
		return
	}

	// Verificar se o usuário é membro da equipe
	var membershipResult []map[string]interface{}
	_, err := h.supabase.From("team_members").
		Select("id").
		Eq("team_id", teamID).
		Eq("user_id", userIDStr).
		ExecuteTo(&membershipResult)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Error: "Erro ao verificar associação à equipe",
		})
		return
	}

	if len(membershipResult) == 0 {
		c.JSON(http.StatusForbidden, models.ApiResponse{
			Error: "Sem permissão para acessar esta equipe",
		})
		return
	}

	// Buscar o proprietário da equipe
	var ownerResult []map[string]interface{}
	_, err = h.supabase.From("team_members").
		Select("user_id").
		Eq("team_id", teamID).
		Eq("role", "owner").
		ExecuteTo(&ownerResult)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Error: "Erro ao buscar proprietário da equipe",
		})
		return
	}

	if len(ownerResult) == 0 {
		c.JSON(http.StatusNotFound, models.ApiResponse{
			Error: "Proprietário da equipe não encontrado",
		})
		return
	}

	ownerID := ownerResult[0]["user_id"].(string)

	// Buscar saldo de tokens do proprietário
	var tokenResult []map[string]interface{}
	_, err = h.supabase.From("user_tokens").
		Select("tokens").
		Eq("user_id", ownerID).
		ExecuteTo(&tokenResult)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Error: "Erro ao buscar saldo de tokens",
		})
		return
	}

	// Se não há registro de tokens, retornar 0
	tokens := 0
	if len(tokenResult) > 0 {
		if tokenValue, ok := tokenResult[0]["tokens"].(float64); ok {
			tokens = int(tokenValue)
		}
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Data: map[string]interface{}{
			"tokens": tokens,
		},
	})
}

func (h *PetitionHandler) GetPetitionSettings(c *gin.Context) {
	c.JSON(http.StatusOK, models.ApiResponse{
		Data: map[string]interface{}{},
	})
}

func (h *PetitionHandler) UpdatePetitionSettings(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, models.ApiResponse{
		Error: "Endpoint not implemented yet",
	})
}
