package journal

import (
	"encoding/json"
	"net/http"

	"github.com/adrianvalentim/gamify_journal/internal/auth"
	"github.com/go-chi/chi/v5"
)

type Handler struct {
	service Service
}

func NewHandler(service Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Route("/journal", func(r chi.Router) {
		r.Use(auth.AuthMiddleware)

		r.Post("/", h.createJournalEntry)
		r.Get("/me", h.handleGetMyJournalEntries)
		r.Get("/{journalId}", h.getJournalEntry)
		r.Put("/{journalId}", h.updateJournalEntry)
		r.Delete("/{journalId}", h.deleteJournalEntry)
	})
}

func (h *Handler) getJournalEntry(w http.ResponseWriter, r *http.Request) {
	journalId := chi.URLParam(r, "journalId")
	entry, err := h.service.GetJournalEntry(journalId)
	if err != nil {
		http.Error(w, "entry not found", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(entry)
}

func (h *Handler) createJournalEntry(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(auth.UserIDKey).(string)
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusUnauthorized)
		return
	}

	var payload struct {
		Title    string  `json:"title"`
		Content  string  `json:"content"`
		FolderID *string `json:"folder_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	entry, err := h.service.CreateJournalEntry(payload.Title, payload.Content, userID, payload.FolderID)
	if err != nil {
		http.Error(w, "failed to create entry", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(entry)
}

func (h *Handler) updateJournalEntry(w http.ResponseWriter, r *http.Request) {
	journalId := chi.URLParam(r, "journalId")
	var payload struct {
		Title    string  `json:"title"`
		Content  string  `json:"content"`
		FolderID *string `json:"folder_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	entry, err := h.service.UpdateJournalEntry(journalId, payload.Title, payload.Content, payload.FolderID)
	if err != nil {
		http.Error(w, "failed to update entry", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(entry)
}

func (h *Handler) handleGetMyJournalEntries(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(auth.UserIDKey).(string)
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusUnauthorized)
		return
	}

	entries, err := h.service.GetJournalEntriesByUserID(userID)
	if err != nil {
		http.Error(w, "failed to get entries for user", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(entries)
}

func (h *Handler) deleteJournalEntry(w http.ResponseWriter, r *http.Request) {
	journalId := chi.URLParam(r, "journalId")
	err := h.service.DeleteJournalEntry(journalId)
	if err != nil {
		http.Error(w, "failed to delete entry", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
