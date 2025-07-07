package ai

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

// AIService handles AI-related business logic.
type AIService struct {
	HttpClient *http.Client
	BaseURL    string
}

// NewAIService creates a new instance of AIService.
func NewAIService() *AIService {
	aiServiceURL := os.Getenv("AI_SERVICE_URL")
	if aiServiceURL == "" {
		aiServiceURL = "http://localhost:8002"
	}
	return &AIService{
		HttpClient: &http.Client{
			Timeout: 60 * time.Second,
		},
		BaseURL: aiServiceURL,
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

// ProcessText sends text to the AI service for XP analysis.
func (s *AIService) ProcessText(text, userID string) (*AIResponse, error) {
	requestBody, err := json.Marshal(map[string]string{
		"entry_text": text,
		"user_id":    userID,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request body for xp agent: %w", err)
	}

	req, err := http.NewRequest("POST", s.BaseURL+"/agent/update_character_xp", bytes.NewBuffer(requestBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request for xp agent: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.HttpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to make request to xp agent: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("xp agent returned an error: %s - %s", resp.Status, string(bodyBytes))
	}

	// The response for this endpoint is for logging/confirmation, not complex data.
	// We can return nil for the AIResponse as the old structure is no longer used.
	return nil, nil
}

// ProcessTextForQuests sends text to the AI service for quest processing.
func (s *AIService) ProcessTextForQuests(text, userID string) error {
	requestBody, err := json.Marshal(map[string]string{
		"entry_text": text,
		"user_id":    userID,
	})
	if err != nil {
		return fmt.Errorf("failed to marshal request body for quest agent: %w", err)
	}

	req, err := http.NewRequest("POST", s.BaseURL+"/agent/update_quests", bytes.NewBuffer(requestBody))
	if err != nil {
		return fmt.Errorf("failed to create request for quest agent: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.HttpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to make request to quest agent: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("quest agent returned an error: %s - %s", resp.Status, string(bodyBytes))
	}

	return nil
}

// GenerateAvatar proxies the request to the Python AI service.
func (s *AIService) GenerateAvatar(prompt string) (string, error) {
	requestBody, err := json.Marshal(map[string]string{"prompt": prompt})
	if err != nil {
		return "", fmt.Errorf("failed to marshal request body: %w", err)
	}

	resp, err := s.HttpClient.Post(s.BaseURL+"/generate-avatar", "application/json", bytes.NewBuffer(requestBody))
	if err != nil {
		return "", fmt.Errorf("failed to make request to AI service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("AI service returned an error: %s - %s", resp.Status, string(bodyBytes))
	}

	var result map[string]string
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("failed to decode response from AI service: %w", err)
	}

	avatarURL, ok := result["avatar_url"]
	if !ok {
		return "", fmt.Errorf("response from AI service did not contain avatar_url")
	}

	return avatarURL, nil
}
