package main

import (
	"log"
	"net/http"
	"os"

	"github.com/adrianvalentim/gamify_journal/internal/ai"                 // Added AI package
	"github.com/adrianvalentim/gamify_journal/internal/character"         // Added character package
	"github.com/adrianvalentim/gamify_journal/internal/platform/database"
	"github.com/adrianvalentim/gamify_journal/internal/user"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func main() {
	// Initialize Database Connection
	if err := database.Connect(); err != nil {
		log.Fatalf("Fatal Error: Could not connect to the database: %v", err)
	}
	dbInstance := database.GetDB() // Get the DB instance after connection

	// Run Database Migrations
	if err := database.MigrateAll(); err != nil {
		log.Fatalf("Fatal Error: Could not run database migrations: %v", err)
	}

	// Initialize Chi Router
	r := chi.NewRouter()

	// Basic Middleware Setup
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.StripSlashes)

	// Health Check Route
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status": "healthy", "service": "gamify_journal_api"}`))
	})

	// --- User Routes --- //
	userStore := user.NewGormStore() // Assuming this takes dbInstance if needed, or uses global DB
	// If NewGormStore needs dbInstance, it should be: user.NewGormStore(dbInstance)
	// For now, assuming it correctly accesses the global DB from database package
	userService := user.NewService(userStore)
	userHandler := user.NewHandler(userService)

	// --- Character Module Initialization --- //
	characterStore := character.NewStore(dbInstance)         // Pass DB instance
	characterService := character.NewService(characterStore) // Pass store to service
	characterHandler := character.NewHandler(characterService) // Pass service to handler

	// --- AI Module Initialization --- //
	aiService := ai.NewAIService()
	aiHandler := ai.NewAIHandler(aiService)

	// API v1 Routes
	r.Route("/api/v1", func(r chi.Router) {
		// Mount user-specific routes
		r.Mount("/users", userRouter(userHandler))

		// Mount authentication routes
		r.Mount("/auth", authRouter(userHandler))

		// Mount character routes
		characterHandler.RegisterRoutes(r) // This will mount under /api/v1/characters

		// Mount AI routes
		r.Route("/ai", func(r chi.Router) {
			aiHandler.RegisterRoutes(r) // This will mount under /api/v1/ai
		})

		r.Get("/", func(w http.ResponseWriter, r *http.Request) {
			_, _ = w.Write([]byte("Welcome to Gamify Journal API v1"))
		})
	})

	// Determine port for HTTP service.
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
		log.Printf("Info: PORT environment variable not set. Defaulting to port %s", port)
	}

	log.Printf("Info: Server starting on http://localhost:%s", port)

	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("Fatal Error: Could not start server: %v", err)
	}
}

// userRouter defines routes related to user management
func userRouter(h *user.Handler) http.Handler {
	r := chi.NewRouter()
	r.Post("/register", h.HandleRegisterUser)
	r.Get("/{userID}", h.HandleGetUserByID)
	return r
}

// authRouter defines routes related to authentication
func authRouter(h *user.Handler) http.Handler {
	r := chi.NewRouter()
	r.Post("/login", h.HandleLoginUser)
	return r
} 