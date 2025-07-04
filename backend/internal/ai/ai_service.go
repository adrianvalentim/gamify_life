package ai

import (
	"bytes"
	"encoding/json"
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
func (s *AIService) ProcessText(input ProcessTextInput) (*AIResponse, error) {
	log.Printf("AIService: Sending text to AI service for user %s: '%s'", input.UserID, input.Text)

	requestBody, err := json.Marshal(input)
	if err != nil {
		log.Printf("Error marshalling AI request: %v", err)
		return nil, err
	}

	req, err := http.NewRequest("POST", aiServiceURL, bytes.NewBuffer(requestBody))
	if err != nil {
		log.Printf("Error creating AI request: %v", err)
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.HttpClient.Do(req)
	if err != nil {
		log.Printf("Error sending request to AI service: %v", err)
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("AI service returned non-OK status: %d", resp.StatusCode)
		return nil, err
	}

	var aiResp AIResponse
	if err := json.NewDecoder(resp.Body).Decode(&aiResp); err != nil {
		log.Printf("Error decoding AI response: %v", err)
		return nil, err
	}

	log.Printf("AIService: Received response from AI: %+v", aiResp)
	return &aiResp, nil
} 