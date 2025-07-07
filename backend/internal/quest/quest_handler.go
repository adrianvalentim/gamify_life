package quest

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/adrianvalentim/gamify_journal/internal/auth"
	"github.com/adrianvalentim/gamify_journal/internal/models"
	"github.com/go-chi/chi/v5"
	"gorm.io/gorm"
)

// IQuestService defines the interface for quest business logic.
type IQuestService interface {
	CreateQuest(input CreateQuestInput) (*models.Quest, error)
	GetUserQuests(userID string) ([]models.Quest, error)
	UpdateQuest(id string, input UpdateQuestInput) (*models.Quest, error)
	CompleteQuest(id string) (*models.Quest, error)
}

// Handler handles HTTP requests for quests.
type Handler struct {
	service IQuestService
}

// NewHandler creates a new quest handler.
func NewHandler(service IQuestService) *Handler {
	return &Handler{service: service}
}

// RegisterRoutes sets up the routes for quest operations.
func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Route("/quests", func(r chi.Router) {
		// Authenticated routes for frontend
		r.Group(func(r chi.Router) {
			r.Use(auth.AuthMiddleware)
			r.Get("/me", h.handleGetMyQuests)
		})

		// AI Service routes (unauthenticated)
		r.Post("/", h.handleCreateQuest)
		r.Route("/{questID}", func(r chi.Router) {
			r.Put("/", h.handleUpdateQuest)
			r.Post("/complete", h.handleCompleteQuest)
		})

		// Unauthenticated route for fetching quests by user ID
		r.Get("/user/{userID}", h.handleGetUserQuests)
	})
}

// handleCreateQuest handles the creation of a new quest.
// This endpoint is expected to be called by the AI service.
func (h *Handler) handleCreateQuest(w http.ResponseWriter, r *http.Request) {
	var input CreateQuestInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	quest, err := h.service.CreateQuest(input)
	if err != nil {
		http.Error(w, "Failed to create quest", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(quest)
}

// handleGetUserQuests handles fetching all quests for a user.
func (h *Handler) handleGetUserQuests(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "userID")
	if userID == "" {
		http.Error(w, "User ID is required", http.StatusBadRequest)
		return
	}

	quests, err := h.service.GetUserQuests(userID)
	if err != nil {
		http.Error(w, "Failed to retrieve quests", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(quests)
}

// handleUpdateQuest handles updating a quest's details.
func (h *Handler) handleUpdateQuest(w http.ResponseWriter, r *http.Request) {
	questID := chi.URLParam(r, "questID")
	if questID == "" {
		http.Error(w, "Quest ID is required", http.StatusBadRequest)
		return
	}

	var input UpdateQuestInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	quest, err := h.service.UpdateQuest(questID, input)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			http.Error(w, "Quest not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to update quest", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(quest)
}

// handleCompleteQuest handles marking a quest as completed.
func (h *Handler) handleCompleteQuest(w http.ResponseWriter, r *http.Request) {
	questID := chi.URLParam(r, "questID")
	if questID == "" {
		http.Error(w, "Quest ID is required", http.StatusBadRequest)
		return
	}

	quest, err := h.service.CompleteQuest(questID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			http.Error(w, "Quest not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to complete quest", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(quest)
}

// handleGetMyQuests handles fetching all quests for the authenticated user.
func (h *Handler) handleGetMyQuests(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(auth.UserIDKey).(string)
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusUnauthorized)
		return
	}

	quests, err := h.service.GetUserQuests(userID)
	if err != nil {
		http.Error(w, "Failed to retrieve quests", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(quests)
}
