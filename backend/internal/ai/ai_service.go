package ai

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
)

const (
	aiServiceURL = "http://localhost:8001/process-text"
)

// AIService handles AI-related business logic.
type AIService struct {
	HttpClient *http.Client
}

// NewAIService creates a new instance of AIService.
func NewAIService() *AIService {
	return &AIService{
		HttpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// ProcessTextInput DTO for ProcessText
type ProcessTextInput struct {
	Text   string `json:"text"`
	UserID string `json:"user_id"`
}

// ProcessTextOutput DTO for ProcessText
type ProcessTextOutput struct {
	ProcessedText string `json:"processed_text"`
}

// AIResponse DTO for ProcessText
type AIResponse struct {
	SuggestedActions []struct {
		Type       string                 `json:"type"`
		Target     string                 `json:"target_entity"`
		EntityID   string                 `json:"entity_id"`
		Parameters map[string]interface{} `json:"parameters"`
	} `json:"suggested_actions"`
}

// ProcessText simulates processing text with an AI model.
// Later, this will call the Google Gemini API.
func (s *AIService) ProcessText(text string, userID string) (map[string]interface{}, error) {
	log.Printf("AIService: Sending text to AI service for user %s: '%s'", userID, text)

	requestBody, err := json.Marshal(map[string]string{
		"paragraph": text,
		"user_id":   userID,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request body: %w", err)
	}

	resp, err := http.Post("http://localhost:8001/agent/update_character", "application/json", bytes.NewBuffer(requestBody))
	if err != nil {
		return nil, fmt.Errorf("failed to send request to AI service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("AI service returned non-OK status: %d, body: %s", resp.StatusCode, string(body))
	}

	var aiResp map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&aiResp); err != nil {
		return nil, fmt.Errorf("failed to decode AI response: %w", err)
	}

	log.Printf("AIService: Received response from AI: %+v", aiResp)
	return aiResp, nil
}
