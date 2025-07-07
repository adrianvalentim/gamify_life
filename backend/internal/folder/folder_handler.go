package folder

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
	r.Route("/folders", func(r chi.Router) {
		r.Use(auth.AuthMiddleware)

		r.Post("/", h.createFolder)
		r.Get("/me", h.handleGetMyFolders)
		r.Put("/{folderID}", h.updateFolder)
		r.Delete("/{folderID}", h.deleteFolder)
	})
}

func (h *Handler) createFolder(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(auth.UserIDKey).(string)
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusUnauthorized)
		return
	}

	var payload struct {
		Name     string  `json:"name"`
		ParentID *string `json:"parent_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	folder, err := h.service.CreateFolder(payload.Name, payload.ParentID, userID)
	if err != nil {
		http.Error(w, "failed to create folder", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(folder)
}

func (h *Handler) updateFolder(w http.ResponseWriter, r *http.Request) {
	folderID := chi.URLParam(r, "folderID")
	var payload struct {
		Name string `json:"name"`
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	updatedFolder, err := h.service.UpdateFolder(folderID, payload.Name)
	if err != nil {
		http.Error(w, "failed to update folder", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updatedFolder)
}

func (h *Handler) deleteFolder(w http.ResponseWriter, r *http.Request) {
	folderID := chi.URLParam(r, "folderID")

	if err := h.service.DeleteFolder(folderID); err != nil {
		http.Error(w, "failed to delete folder", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) handleGetMyFolders(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(auth.UserIDKey).(string)
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusUnauthorized)
		return
	}
	folders, err := h.service.GetFoldersByUserID(userID)
	if err != nil {
		http.Error(w, "failed to get folders for user", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(folders)
}
