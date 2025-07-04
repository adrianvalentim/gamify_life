package main

import (
	"log"
	"net/http"
	"os"

	"github.com/adrianvalentim/gamify_journal/internal/character"
	"github.com/adrianvalentim/gamify_journal/internal/folder"
	"github.com/adrianvalentim/gamify_journal/internal/journal"
	"github.com/adrianvalentim/gamify_journal/internal/models"
	"github.com/adrianvalentim/gamify_journal/internal/platform/database"
	"github.com/adrianvalentim/gamify_journal/internal/user"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	if err := database.Connect(); err != nil {
		log.Fatalf("Fatal Error: Could not connect to the database: %v", err)
	}
	dbInstance := database.GetDB()

	if err := database.MigrateAll(); err != nil {
		log.Fatalf("Fatal Error: Could not run database migrations: %v", err)
	}

	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.StripSlashes)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"Accept", "Authorization", "Content-Type"},
	}))

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status": "healthy", "service": "gamify_journal_api"}`))
	})

	userStore := user.NewGormStore()
	journalStore := journal.NewStore(dbInstance)
	characterStore := character.NewStore(dbInstance)
	folderStore := folder.NewStore(dbInstance)

	userService := user.NewService(userStore)
	journalService := journal.NewService(journalStore)
	characterService := character.NewService(characterStore)
	folderService := folder.NewService(folderStore)

	userHandler := user.NewHandler(userService)
	journalHandler := journal.NewHandler(journalService)
	characterHandler := character.NewHandler(characterService)
	folderHandler := folder.NewHandler(folderService)

	// Seed data
	seedData(userStore)

	r.Route("/api/v1", func(r chi.Router) {
		r.Mount("/users", userRouter(userHandler))
		r.Mount("/auth", authRouter(userHandler))
		journalHandler.RegisterRoutes(r)
		characterHandler.RegisterRoutes(r)
		folderHandler.RegisterRoutes(r)
	})

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

func seedData(userStore user.Store) {
	const seedUserID = "user-123"
	existingUser, err := userStore.GetByID(seedUserID)
	if err != nil {
		log.Fatalf("Error checking for seed user: %v", err)
		return
	}
	if existingUser != nil {
		log.Printf("User %s already exists. Skipping seed.", seedUserID)
		return
	}

	log.Println("Seeding initial user...")
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password"), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("Could not hash password for seed user: %v", err)
	}

	seedUser := &models.User{
		ID:             seedUserID,
		Username:       "testuser",
		Email:          "test@example.com",
		HashedPassword: string(hashedPassword),
	}

	if err := userStore.Create(seedUser); err != nil {
		log.Fatalf("Could not create seed user: %v", err)
	}
	log.Println("Successfully seeded user user-123.")
}

func userRouter(h *user.Handler) http.Handler {
	r := chi.NewRouter()
	r.Post("/register", h.HandleRegisterUser)
	r.Get("/{userID}", h.HandleGetUserByID)
	return r
}

func authRouter(h *user.Handler) http.Handler {
	r := chi.NewRouter()
	r.Post("/login", h.HandleLoginUser)
	return r
} 