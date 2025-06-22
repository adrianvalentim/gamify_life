package journal

import (
	"gorm.io/gorm"
	"github.com/adrianvalentim/gamify_journal/internal/models"
)

// Store defines the interface for journal data persistence.
type Store interface {
	GetByID(id string) (*models.JournalEntry, error)
	Update(entry *models.JournalEntry) error
    Create(entry *models.JournalEntry) error
}

// gormStore is a GORM implementation of the Store interface.
type gormStore struct {
	db *gorm.DB
}

// NewStore creates a new GORM store for journal entries.
func NewStore(db *gorm.DB) Store {
	return &gormStore{db: db}
}

// GetByID retrieves a journal entry by its ID.
func (s *gormStore) GetByID(id string) (*models.JournalEntry, error) {
	var entry models.JournalEntry
	if err := s.db.First(&entry, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &entry, nil
}

// Update saves the changes to a journal entry.
func (s *gormStore) Update(entry *models.JournalEntry) error {
	return s.db.Save(entry).Error
}

// Create creates a new journal entry.
func (s *gormStore) Create(entry *models.JournalEntry) error {
    return s.db.Create(entry).Error
} 