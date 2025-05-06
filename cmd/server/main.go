package main

import (
	"log"
	"net/http"
	"os"

	"gamify_journal/internal/platform/database" // Adjust if your module name is different

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

	// API v1 Routes (example placeholder - we will build these out)
	r.Route("/api/v1", func(r chi.Router) {
		// r.Mount("/users", userRoutes()) // Example: how user routes would be mounted
		// r.Mount("/entries", entryRoutes()) // Example: how entry routes would be mounted
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