package main

import (
	"log"
	"net/http"
	"os"

	"github.com/adrianvalentim/gamify_journal/internal/platform/database" // Updated import path
	"github.com/adrianvalentim/gamify_journal/internal/user"                // Updated import path

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func main() {
	// Initialize Database Connection
	// This will use the DSN from DB_DSN env var or the fallback in database/database.go
	if err := database.Connect(); err != nil {
		log.Fatalf("Fatal Error: Could not connect to the database: %v", err)
	}

	// Run Database Migrations
	// This will attempt to create/update tables for your models.
	if err := database.MigrateAll(); err != nil {
		log.Fatalf("Fatal Error: Could not run database migrations: %v", err)
	}

	// Initialize Chi Router
	r := chi.NewRouter()

	// Basic Middleware Setup
	r.Use(middleware.RequestID) // Injects a request ID into the context of each request.
	r.Use(middleware.RealIP)    // Sets RemoteAddr to the real IP address from X-Forwarded-For or X-Real-IP.
	r.Use(middleware.Logger)    // Logs the start and end of each request with the path, method, latency, and status.
	r.Use(middleware.Recoverer) // Gracefully absorbs panics and sends an HTTP 500 error.
	r.Use(middleware.StripSlashes) // Normalizes request paths by removing trailing slashes.

	// Health Check Route
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		// You could add more details to the health check if needed (e.g., DB status)
		_, _ = w.Write([]byte(`{"status": "healthy", "service": "gamify_journal_api"}`))
	})

	// --- User Routes --- //
	// Initialize user store, service, and handler
	userStore := user.NewGormStore()     // GORM store implementation
	userService := user.NewService(userStore) // User service with store dependency
	userHandler := user.NewHandler(userService) // User HTTP handler with service dependency

	// API v1 Routes
	r.Route("/api/v1", func(r chi.Router) {
		// Mount user-specific routes (registration, get by ID)
		r.Mount("/users", userRouter(userHandler)) // Will define userRouter shortly

		// Mount authentication routes (login)
		r.Mount("/auth", authRouter(userHandler)) // Will define authRouter shortly

		r.Get("/", func(w http.ResponseWriter, r *http.Request) { // Basic v1 welcome
			_, _ = w.Write([]byte("Welcome to Gamify Journal API v1"))
		})
	})

	// Determine port for HTTP service.
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // Default port if not specified
		log.Printf("Info: PORT environment variable not set. Defaulting to port %s", port)
	}

	log.Printf("Info: Server starting on http://localhost:%s", port)

	// Start the HTTP server.
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatalf("Fatal Error: Could not start server: %v", err)
	}
}

// userRouter defines routes related to user management (e.g., register, get user details)
func userRouter(h *user.Handler) http.Handler {
	r := chi.NewRouter()
	r.Post("/register", h.HandleRegisterUser) // POST /api/v1/users/register
	// GET /api/v1/users/{userID}
	// Note: handleGetUserByID is already part of the handler passed to MountRoutes in user_handler.go
	// So, if MountRoutes in user_handler.go handles "/{userID}", we might not need it here explicitly
	// Let's adjust user_handler.go's MountRoutes to be more flexible or define specific routes here.
	// For now, assuming user_handler.MountRoutes sets up /{userID}
	// We can make it more explicit by calling specific handler methods for specific sub-routes.
	r.Get("/{userID}", h.HandleGetUserByID)
	return r
}

// authRouter defines routes related to authentication (e.g., login, logout, refresh token)
func authRouter(h *user.Handler) http.Handler {
	r := chi.NewRouter()
	r.Post("/login", h.HandleLoginUser) // POST /api/v1/auth/login
	// r.Post("/logout", h.handleLogoutUser) // TODO: Implement logout
	// r.Post("/refresh", h.handleRefreshToken) // TODO: Implement token refresh
	return r
} 