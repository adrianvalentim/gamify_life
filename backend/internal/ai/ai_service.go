package ai

import (
	"log"
)

// AIService handles AI-related business logic.
type AIService struct {
	// Dependencies for the AI service, e.g., API keys or clients, will go here.
	// For now, it's empty.
}

// NewAIService creates a new instance of AIService.
func NewAIService() *AIService {
	return &AIService{}
}

// ProcessTextInput DTO for ProcessText
type ProcessTextInput struct {
	Text string `json:"text"`
}

// ProcessTextOutput DTO for ProcessText
type ProcessTextOutput struct {
	ProcessedText string `json:"processed_text"`
}

// ProcessText simulates processing text with an AI model.
// Later, this will call the Google Gemini API.
func (s *AIService) ProcessText(input ProcessTextInput) (*ProcessTextOutput, error) {
	log.Printf("AIService: Received text to process: '%s'", input.Text)

	// Simulate AI processing for now
	processedText := "Placeholder: AI processed -> " + input.Text

	log.Printf("AIService: Processed text: '%s'", processedText)
	return &ProcessTextOutput{ProcessedText: processedText}, nil
} 