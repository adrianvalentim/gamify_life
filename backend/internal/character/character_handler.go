package character

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/adrianvalentim/gamify_journal/internal/auth"
	"github.com/adrianvalentim/gamify_journal/internal/models" // Project specific models
	"github.com/go-chi/chi/v5"
	"gorm.io/gorm"
)

// ICharacterService defines the interface for character business logic that the handler needs.
// This should be compatible with the methods provided by character.Service.
type ICharacterService interface {
	CreateCharacter(input CreateCharacterInput) (*models.Character, error)
	GetCharacterByUserID(userID string) (*models.Character, error)
	GrantXP(characterID string, amount int) (char *models.Character, leveledUp bool, err error)
	GetCharacter(characterID string) (*models.Character, error) // Added for GrantXP consistency
	SpendAttributePoints(characterID string, input SpendAttributePointsInput) (*models.Character, error)
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
		// Authenticated routes
		r.Group(func(r chi.Router) {
			r.Use(auth.AuthMiddleware)
			r.Post("/", h.handleCreateCharacter) // POST /api/v1/characters
			r.Get("/me", h.handleGetMyCharacter) // GET /api/v1/characters/me
			r.Post("/me/spend-points", h.handleSpendAttributePoints) // POST /api/v1/characters/me/spend-points
		})

		// Public or other character routes
		r.Get("/user/{userID}", h.handleGetCharacterByUserID) // GET /api/v1/characters/user/{userID}
		r.Get("/{characterID}", h.handleGetCharacterByID)     // GET /api/v1/characters/{characterID}
		r.Post("/{characterID}/grant-xp", h.handleGrantXP)    // POST /api/v1/characters/{characterID}/grant-xp
	})

	// This route seems misplaced, let's keep it separate for now if it serves a unique purpose.
	// It's better to have a more RESTful approach like POST /characters/{characterID}/xp
	r.Post("/users/{userID}/character/xp", h.handleGrantXPByUserID)
}

// GrantXPInput defines the expected JSON payload for the grant XP endpoint.
type GrantXPInput struct {
	Amount int `json:"xp_amount"`
}

type createCharacterRequest struct {
	Name      string `json:"name"`
	Class     string `json:"class"`
	AvatarURL string `json:"avatar_url"`
}

func (h *Handler) handleCreateCharacter(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(auth.UserIDKey).(string)
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusUnauthorized)
		return
	}

	var req createCharacterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	input := CreateCharacterInput{
		UserID:    userID,
		Name:      req.Name,
		Class:     models.CharacterClass(req.Class),
		AvatarURL: req.AvatarURL,
	}

	character, err := h.service.CreateCharacter(input)
	if err != nil {
		http.Error(w, "Failed to create character", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(character)
}

// handleGetCharacterByUserID handles the HTTP request to get a character by UserID.
func (h *Handler) handleGetCharacterByUserID(w http.ResponseWriter, r *http.Request) {
	userIDStr := chi.URLParam(r, "userID")
	if userIDStr == "" {
		http.Error(w, `{"error": "Invalid user ID format"}`, http.StatusBadRequest)
		return
	}

	character, err := h.service.GetCharacterByUserID(userIDStr)
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
	if characterIDStr == "" {
		http.Error(w, `{"error": "Invalid character ID format"}`, http.StatusBadRequest)
		return
	}

	character, err := h.service.GetCharacter(characterIDStr)
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

// handleGrantXP handles granting XP to a character by characterID.
func (h *Handler) handleGrantXP(w http.ResponseWriter, r *http.Request) {
	characterIDStr := chi.URLParam(r, "characterID")
	if characterIDStr == "" {
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

	char, leveledUp, err := h.service.GrantXP(characterIDStr, input.Amount)
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

// handleGrantXPByUserID handles granting XP to a character based on their user ID.
// This is useful for services that only have the user ID.
func (h *Handler) handleGrantXPByUserID(w http.ResponseWriter, r *http.Request) {
	userIDStr := chi.URLParam(r, "userID")
	if userIDStr == "" {
		http.Error(w, `{"error": "Invalid user ID format"}`, http.StatusBadRequest)
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

	character, err := h.service.GetCharacterByUserID(userIDStr)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			http.Error(w, `{"error": "Character not found for this user"}`, http.StatusNotFound)
			return
		}
		http.Error(w, `{"error": "Failed to retrieve character before granting XP"}`, http.StatusInternalServerError)
		return
	}

	char, leveledUp, err := h.service.GrantXP(character.ID, input.Amount)
	if err != nil {
		// This should be rare if the character was just fetched, but handle it
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

func (h *Handler) handleGetMyCharacter(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(auth.UserIDKey).(string)
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusUnauthorized)
		return
	}

	character, err := h.service.GetCharacterByUserID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			http.Error(w, `{"error": "Character not found for this user"}`, http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to get character", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(character)
}

func (h *Handler) handleSpendAttributePoints(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(auth.UserIDKey).(string)
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusUnauthorized)
		return
	}

	char, err := h.service.GetCharacterByUserID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			http.Error(w, `{"error": "Character not found for this user"}`, http.StatusNotFound)
			return
		}
		http.Error(w, `{"error": "Failed to retrieve character"}`, http.StatusInternalServerError)
		return
	}

	var input SpendAttributePointsInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	updatedChar, err := h.service.SpendAttributePoints(char.ID, input)
	if err != nil {
		// Basic error handling, can be improved to check for validation errors
		http.Error(w, "Failed to spend attribute points: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(updatedChar)
}
