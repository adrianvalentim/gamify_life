package quest

import (
	"github.com/adrianvalentim/gamify_journal/internal/character"
	"github.com/adrianvalentim/gamify_journal/internal/models"
)

// IQuestStore defines the interface for quest data storage.
type IQuestStore interface {
	CreateQuest(quest *models.Quest) error
	GetQuestByID(id string) (*models.Quest, error)
	GetQuestsByUserID(userID string) ([]models.Quest, error)
	UpdateQuest(quest *models.Quest) error
}

// Service provides quest-related business logic.
type Service struct {
	store            IQuestStore
	characterService *character.Service
}

// NewService creates a new quest service.
func NewService(store IQuestStore, characterService *character.Service) *Service {
	return &Service{store: store, characterService: characterService}
}

// CreateQuestInput defines the input for creating a new quest.
type CreateQuestInput struct {
	UserID           string `json:"user_id"`
	Title            string `json:"title"`
	Description      string `json:"description"`
	ExperienceReward int    `json:"experienceReward"`
}

// CreateQuest handles the creation of a new quest.
func (s *Service) CreateQuest(input CreateQuestInput) (*models.Quest, error) {
	quest := &models.Quest{
		UserID:           input.UserID,
		Title:            input.Title,
		Description:      input.Description,
		ExperienceReward: input.ExperienceReward,
		Status:           models.QuestStatusInProgress,
	}

	err := s.store.CreateQuest(quest)
	if err != nil {
		return nil, err
	}

	return quest, nil
}

// GetUserQuests retrieves all quests for a specific user.
func (s *Service) GetUserQuests(userID string) ([]models.Quest, error) {
	return s.store.GetQuestsByUserID(userID)
}

// UpdateQuestInput defines the input for updating a quest.
type UpdateQuestInput struct {
	Title       *string `json:"title"`
	Description *string `json:"description"`
}

// UpdateQuest handles updating a quest's details.
func (s *Service) UpdateQuest(id string, input UpdateQuestInput) (*models.Quest, error) {
	quest, err := s.store.GetQuestByID(id)
	if err != nil {
		return nil, err
	}

	if input.Title != nil {
		quest.Title = *input.Title
	}
	if input.Description != nil {
		quest.Description = *input.Description
	}

	err = s.store.UpdateQuest(quest)
	if err != nil {
		return nil, err
	}

	return quest, nil
}

// CompleteQuest marks a quest as completed and grants experience to the user's character.
func (s *Service) CompleteQuest(questID string) (*models.Quest, error) {
	quest, err := s.store.GetQuestByID(questID)
	if err != nil {
		return nil, err
	}

	// Avoid re-completing a quest
	if quest.Status == models.QuestStatusCompleted {
		// Or return an error, depending on desired behavior
		return quest, nil
	}

	// Grant XP to the character
	// We need the character to grant XP to. Let's assume the character service can find a character by userID.
	char, err := s.characterService.GetCharacterByUserID(quest.UserID)
	if err != nil {
		// Handle case where character is not found for the user
		return nil, err
	}

	if _, _, err := s.characterService.GrantXP(char.ID, quest.ExperienceReward); err != nil {
		// Decide how to handle this error. Should we still mark the quest as complete?
		// For now, let's return the error and not complete the quest.
		return nil, err
	}

	quest.Status = models.QuestStatusCompleted
	if err := s.store.UpdateQuest(quest); err != nil {
		return nil, err
	}

	return quest, nil
}
