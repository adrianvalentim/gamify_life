package folder

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
	r.Route("/folders", func(r chi.Router) {
		r.Post("/", h.createFolder)
		r.Get("/user/{userID}", h.getFoldersByUserID)
		r.Put("/{folderID}", h.updateFolder)
		r.Delete("/{folderID}", h.deleteFolder)
	})
}

func (h *Handler) createFolder(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Name     string  `json:"name"`
		ParentID *string `json:"parent_id"`
		UserID   string  `json:"user_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	folder, err := h.service.CreateFolder(payload.Name, payload.ParentID, payload.UserID)
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

func (h *Handler) getFoldersByUserID(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "userID")
	folders, err := h.service.GetFoldersByUserID(userID)
	if err != nil {
		http.Error(w, "failed to get folders for user", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(folders)
} 