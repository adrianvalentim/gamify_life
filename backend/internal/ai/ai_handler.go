package ai

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
)

// AIHandler handles HTTP requests for AI functionalities.
type AIHandler struct {
	Service *AIService
}

// NewAIHandler creates a new instance of AIHandler.
func NewAIHandler(service *AIService) *AIHandler {
	return &AIHandler{Service: service}
}

// RegisterRoutes registers AI-related routes.
func (h *AIHandler) RegisterRoutes(r chi.Router) {
	r.Post("/process", h.handleProcessText)
	r.Post("/generate-avatar", h.handleGenerateAvatar)
}

// handleProcessText handles the request to process text.
func (h *AIHandler) handleProcessText(w http.ResponseWriter, r *http.Request) {
	var input ProcessTextInput
	err := json.NewDecoder(r.Body).Decode(&input)
	if err != nil {
		log.Printf("AIHandler: Error decoding request body: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if input.Text == "" {
		log.Printf("AIHandler: Input text is empty")
		http.Error(w, "Input text cannot be empty", http.StatusBadRequest)
		return
	}

	log.Printf("AIHandler: Received request to process text: '%s' for user '%s'", input.Text, input.UserID)

	output, err := h.Service.ProcessText(input.Text, input.UserID)
	if err != nil {
		log.Printf("AIHandler: Error processing text: %v", err)
		http.Error(w, "Failed to process text", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	err = json.NewEncoder(w).Encode(output)
	if err != nil {
		log.Printf("AIHandler: Error encoding response: %v", err)
		// Hard to send an error to client at this point, as headers might have been sent.
		// Server-side log is important.
		return
	}
	log.Printf("AIHandler: Successfully processed text and sent response.")
}

// handleGenerateAvatar handles the request to generate an avatar.
func (h *AIHandler) handleGenerateAvatar(w http.ResponseWriter, r *http.Request) {
	var input map[string]string
	err := json.NewDecoder(r.Body).Decode(&input)
	if err != nil {
		log.Printf("AIHandler: Error decoding request body: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	prompt, ok := input["prompt"]
	if !ok || prompt == "" {
		log.Printf("AIHandler: Input prompt is empty or missing")
		http.Error(w, "Input prompt cannot be empty", http.StatusBadRequest)
		return
	}

	log.Printf("AIHandler: Received request to generate avatar with prompt: '%s'", prompt)

	avatarURL, err := h.Service.GenerateAvatar(prompt)
	if err != nil {
		log.Printf("AIHandler: Error generating avatar: %v", err)
		http.Error(w, "Failed to generate avatar", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	err = json.NewEncoder(w).Encode(map[string]string{"avatar_url": avatarURL})
	if err != nil {
		log.Printf("AIHandler: Error encoding response: %v", err)
		return
	}
	log.Printf("AIHandler: Successfully generated avatar and sent response.")
}
