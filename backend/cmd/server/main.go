package main

import (
	"errors"
	"log"
	"net/http"
	"os"

	"github.com/adrianvalentim/gamify_journal/internal/ai"
	"github.com/adrianvalentim/gamify_journal/internal/character"
	"github.com/adrianvalentim/gamify_journal/internal/folder"
	"github.com/adrianvalentim/gamify_journal/internal/journal"
	"github.com/adrianvalentim/gamify_journal/internal/models"
	"github.com/adrianvalentim/gamify_journal/internal/platform/database"
	"github.com/adrianvalentim/gamify_journal/internal/quest"
	"github.com/adrianvalentim/gamify_journal/internal/user"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
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
	questStore := quest.NewStore(dbInstance)

	aiService := ai.NewAIService()
	characterService := character.NewService(characterStore)
	userService := user.NewService(userStore)
	journalService := journal.NewService(journalStore, aiService, characterService)
	folderService := folder.NewService(folderStore)
	questService := quest.NewService(questStore)

	userHandler := user.NewHandler(userService)
	journalHandler := journal.NewHandler(journalService)
	characterHandler := character.NewHandler(characterService)
	folderHandler := folder.NewHandler(folderService)
	questHandler := quest.NewHandler(questService)
	aiHandler := ai.NewAIHandler(aiService)

	// Seed data
	seedData(userStore, characterStore)

	r.Route("/api/v1", func(r chi.Router) {
		userHandler.RegisterRoutes(r)
		journalHandler.RegisterRoutes(r)
		characterHandler.RegisterRoutes(r)
		folderHandler.RegisterRoutes(r)
		questHandler.RegisterRoutes(r)
		aiHandler.RegisterRoutes(r)
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

func seedData(userStore user.Store, characterStore character.ICharacterStore) {
	const seedUserID = "user-123"
	// Seed User
	existingUser, err := userStore.GetByID(seedUserID)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		log.Fatalf("Error checking for seed user: %v", err)
	}

	if existingUser == nil {
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
	} else {
		log.Printf("User %s already exists. Skipping user seed.", seedUserID)
	}

	// Seed Character
	existingChar, err := characterStore.GetCharacterByUserID(seedUserID)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		log.Fatalf("Error checking for seed character: %v", err)
	}

	if existingChar == nil {
		log.Println("Seeding initial character for user-123...")
		newChar := &models.Character{
			UserID: seedUserID,
			Name:   "Aventureiro",
			Class:  string(models.Warrior),
			Level:  1,
			XP:     0,
		}
		if err := characterStore.CreateCharacter(newChar); err != nil {
			log.Fatalf("Could not create seed character: %v", err)
		}
		log.Println("Successfully seeded character for user user-123.")
	} else {
		log.Printf("Character for user %s already exists. Skipping character seed.", seedUserID)
	}
}
