package quest

import (
	"errors"

	"github.com/adrianvalentim/gamify_journal/internal/models"
	"gorm.io/gorm"
)

// Store handles database operations for quests.
// It will implement an interface defined in the service layer.
type Store struct {
	db *gorm.DB
}

// NewStore creates a new quest store.
func NewStore(db *gorm.DB) *Store {
	return &Store{db: db}
}

// CreateQuest adds a new quest to the database.
func (s *Store) CreateQuest(quest *models.Quest) error {
	return s.db.Create(quest).Error
}

// GetQuestByID retrieves a quest by its ID.
func (s *Store) GetQuestByID(id string) (*models.Quest, error) {
	var quest models.Quest
	err := s.db.First(&quest, "id = ?", id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, err
		}
		return nil, err
	}
	return &quest, nil
}

// GetQuestsByUserID retrieves all quests associated with a specific user ID.
func (s *Store) GetQuestsByUserID(userID string) ([]models.Quest, error) {
	var quests []models.Quest
	err := s.db.Where("user_id = ?", userID).Find(&quests).Error
	if err != nil {
		return nil, err
	}
	return quests, nil
}

// UpdateQuest updates an existing quest in the database.
func (s *Store) UpdateQuest(quest *models.Quest) error {
	return s.db.Save(quest).Error
}
