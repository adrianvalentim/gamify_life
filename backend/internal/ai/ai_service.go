package ai

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

const (
	// The AI service now runs on port 8002
	aiServiceURL = "http://localhost:8002/agent/update_character"
)

// AIService handles AI-related business logic.
type AIService struct {
	HttpClient *http.Client
	BaseURL    string
}

// NewAIService creates a new instance of AIService.
func NewAIService() *AIService {
	return &AIService{
		HttpClient: &http.Client{
			Timeout: 60 * time.Second, // Increased timeout for image generation
		},
		// This BaseURL is for other endpoints like avatar generation
		BaseURL: "http://localhost:8002",
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

// ProcessText sends text to the AI service for processing (e.g., generating quests).
func (s *AIService) ProcessText(text, userID string) (*AIResponse, error) {
	requestBody, err := json.Marshal(map[string]string{
		"paragraph": text,
		"user_id":   userID,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request body: %w", err)
	}

	// Use the constant for the URL
	req, err := http.NewRequest("POST", aiServiceURL, bytes.NewBuffer(requestBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.HttpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to make request to AI service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("AI service returned an error: %s - %s", resp.Status, string(bodyBytes))
	}

	var result AIResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		if err == io.EOF {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to decode response from AI service: %w", err)
	}

	return &result, nil
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
