package character

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/adrianvalentim/gamify_journal/internal/models" // Project specific models
	// auth "github.com/adrianvalentim/gamify_journal/internal/auth" // Placeholder for auth package
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ICharacterService defines the interface for character business logic that the handler needs.
// This should be compatible with the methods provided by character.Service.
type ICharacterService interface {
	CreateCharacter(input CreateCharacterInput) (*models.Character, error)
	GetCharacterByUserID(userID uuid.UUID) (*models.Character, error)
	GrantXP(characterID uuid.UUID, amount int) (char *models.Character, leveledUp bool, err error)
	GetCharacter(characterID uuid.UUID) (*models.Character, error) // Added for GrantXP consistency
}

type Handler struct {
	service ICharacterService
}

func NewHandler(service ICharacterService) *Handler {
	return &Handler{service: service}
}

// RegisterRoutes sets up the routes for character operations within a Chi router.
func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Route("/characters", func(r chi.Router) {
		r.Post("/", h.handleCreateCharacter)                // POST /api/v1/characters
		r.Get("/user/{userID}", h.handleGetCharacterByUserID) // GET /api/v1/characters/user/{userID}
		// Example: Get character by its own ID
		r.Get("/{characterID}", h.handleGetCharacterByID) // GET /api/v1/characters/{characterID}
		// Example: Grant XP to a character - might require auth/admin privileges
		r.Post("/{characterID}/grant-xp", h.handleGrantXP) // POST /api/v1/characters/{characterID}/grant-xp
		// TODO: Consider a GET /me/character endpoint that uses auth context
	})
}

// handleCreateCharacter handles the HTTP request to create a new character.
func (h *Handler) handleCreateCharacter(w http.ResponseWriter, r *http.Request) {
	var input CreateCharacterInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid request payload: "+err.Error(), http.StatusBadRequest)
		return
	}

	// In a real application, UserID might come from JWT token/auth context
	// For now, it's expected in the CreateCharacterInput payload.
	// userID := auth.GetUserIDFromContext(r.Context()) // Example
	// input.UserID = userID

	if input.UserID == uuid.Nil {
		http.Error(w, `{"error": "UserID is required in payload"}`, http.StatusBadRequest)
		return
	}

	character, err := h.service.CreateCharacter(input)
	if err != nil {
		var valErr *ValidationError
		if errors.As(err, &valErr) {
			http.Error(w, `{"error": "`+valErr.Error()+`"}`, http.StatusBadRequest)
			return
		} 
		// Check for other specific errors, like if user already has a character if that's a rule
		// else if errors.Is(err, someSpecificError) { ... }
		http.Error(w, `{"error": "Failed to create character"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(character)
}

// handleGetCharacterByUserID handles the HTTP request to get a character by UserID.
func (h *Handler) handleGetCharacterByUserID(w http.ResponseWriter, r *http.Request) {
	userIDStr := chi.URLParam(r, "userID")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		http.Error(w, `{"error": "Invalid user ID format"}`, http.StatusBadRequest)
		return
	}

	character, err := h.service.GetCharacterByUserID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			http.Error(w, `{"error": "Character not found for this user"}`, http.StatusNotFound)
			return
		}
		http.Error(w, `{"error": "Failed to retrieve character"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(character)
}

// handleGetCharacterByID handles the HTTP request to get a character by its own ID.
func (h *Handler) handleGetCharacterByID(w http.ResponseWriter, r *http.Request) {
	characterIDStr := chi.URLParam(r, "characterID")
	characterID, err := uuid.Parse(characterIDStr)
	if err != nil {
		http.Error(w, `{"error": "Invalid character ID format"}`, http.StatusBadRequest)
		return
	}

	character, err := h.service.GetCharacter(characterID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			http.Error(w, `{"error": "Character not found"}`, http.StatusNotFound)
			return
		}
		http.Error(w, `{"error": "Failed to retrieve character"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(character)
}

// GrantXPInput defines the expected JSON payload for the grant XP endpoint.
type GrantXPInput struct {
	Amount int `json:"amount"`
}

// handleGrantXP handles granting XP to a character.
func (h *Handler) handleGrantXP(w http.ResponseWriter, r *http.Request) {
	characterIDStr := chi.URLParam(r, "characterID")
	characterID, err := uuid.Parse(characterIDStr)
	if err != nil {
		http.Error(w, `{"error": "Invalid character ID format"}`, http.StatusBadRequest)
		return
	}

	var input GrantXPInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid request payload: "+err.Error(), http.StatusBadRequest)
		return
	}

	if input.Amount <= 0 {
		http.Error(w, `{"error": "XP amount must be positive"}`, http.StatusBadRequest)
		return
	}

	char, leveledUp, err := h.service.GrantXP(characterID, input.Amount)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			http.Error(w, `{"error": "Character not found"}`, http.StatusNotFound)
			return
		}
		http.Error(w, `{"error": "Failed to grant XP"}`, http.StatusInternalServerError)
		return
	}

	response := struct {
		*models.Character
		LeveledUp bool `json:"leveled_up"`
	}{
		Character: char,
		LeveledUp: leveledUp,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
} 