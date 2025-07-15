
package main

import (
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"argumentum-backend/handlers"
	"argumentum-backend/middleware"
)

func init() {
	// Carrega variáveis do .env (se existir)
	if err := godotenv.Load(); err != nil {
		log.Println("⚠️  .env não encontrado, usando variáveis de ambiente do sistema")
	}
}

func main() {
	// Initialize Gin router
	r := gin.Default()

	// Configure CORS
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:5173", "http://localhost:3000"}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	config.AllowCredentials = true
	r.Use(cors.New(config))

	// Initialize handlers (que internamente usarão SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY)
	authHandler := handlers.NewAuthHandler()
	petitionHandler := handlers.NewPetitionHandler()
	profileHandler := handlers.NewProfileHandler()
	storageHandler := handlers.NewStorageHandler()

	// Auth routes (public)
	auth := r.Group("/auth")
	{
		auth.POST("/login", authHandler.Login)
		auth.POST("/register", authHandler.Register)
		auth.POST("/logout", authHandler.Logout)
		auth.POST("/refresh", authHandler.RefreshToken)
		auth.POST("/reset-password", authHandler.ResetPassword)
	}

	// Protected routes
	protected := r.Group("/")
	protected.Use(middleware.AuthMiddleware())
	{
		protected.GET("/profile", profileHandler.GetProfile)
		protected.PUT("/profile", profileHandler.UpdateProfile)

		protected.GET("/petitions", petitionHandler.GetPetitions)
		protected.POST("/petitions", petitionHandler.CreatePetition)
		protected.GET("/petitions/:id", petitionHandler.GetPetitionByID)
		protected.PUT("/petitions/:id", petitionHandler.UpdatePetition)
		protected.DELETE("/petitions/:id", petitionHandler.DeletePetition)

		protected.GET("/teams", petitionHandler.GetTeams)
		protected.POST("/teams", petitionHandler.CreateTeam)
		protected.GET("/teams/:id", petitionHandler.GetTeamByID)
		protected.PUT("/teams/:id", petitionHandler.UpdateTeam)
		protected.DELETE("/teams/:id", petitionHandler.DeleteTeam)
		protected.GET("/teams/:id/token-balance", petitionHandler.GetTeamTokenBalance)

		protected.GET("/documents", storageHandler.GetDocuments)
		protected.POST("/documents/upload", storageHandler.UploadDocument)
		protected.DELETE("/documents/:id", storageHandler.DeleteDocument)

		protected.GET("/petition-settings", petitionHandler.GetPetitionSettings)
		protected.PUT("/petition-settings", petitionHandler.UpdatePetitionSettings)

		protected.POST("/storage/signed-url", storageHandler.GetSignedURL)
		protected.POST("/storage/delete", storageHandler.DeleteFile)
	}

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "message": "Argumentum Backend Go is running"})
	})

	// Get port from environment or default to 8080
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	log.Fatal(r.Run(":" + port))
}
