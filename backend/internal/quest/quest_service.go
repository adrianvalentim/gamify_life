package quest

import (
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
	store IQuestStore
}

// NewService creates a new quest service.
func NewService(store IQuestStore) *Service {
	return &Service{store: store}
}

// CreateQuestInput defines the input for creating a new quest.
type CreateQuestInput struct {
	UserID           string `json:"userId"`
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

// CompleteQuest marks a quest as completed.
func (s *Service) CompleteQuest(id string) (*models.Quest, error) {
	quest, err := s.store.GetQuestByID(id)
	if err != nil {
		return nil, err
	}

	quest.Status = models.QuestStatusCompleted

	err = s.store.UpdateQuest(quest)
	if err != nil {
		return nil, err
	}

	// Here you might also grant the XP to the character.
	// This would require a dependency on the character service.
	// For now, we'll keep it simple.

	return quest, nil
}
