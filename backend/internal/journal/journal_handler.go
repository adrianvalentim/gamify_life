package journal

import (
	"encoding/json"
	"net/http"
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
		r.Get("/{journalId}", h.getJournalEntry)
		r.Put("/{journalId}", h.updateJournalEntry)
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

func (h *Handler) updateJournalEntry(w http.ResponseWriter, r *http.Request) {
	journalId := chi.URLParam(r, "journalId")
	var payload struct {
		Title   string `json:"title"`
		Content string `json:"content"`
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	entry, err := h.service.UpdateJournalEntry(journalId, payload.Title, payload.Content)
	if err != nil {
		http.Error(w, "failed to update entry", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(entry)
} 