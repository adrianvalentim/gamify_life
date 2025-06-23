package journal

import (
	"errors"
	"fmt"
	"time"

	"github.com/adrianvalentim/gamify_journal/internal/models"
	"gorm.io/gorm"
)

// Service defines the interface for journal business logic.
type Service interface {
	GetJournalEntry(id string) (*models.JournalEntry, error)
	UpdateJournalEntry(id, title, content string) (*models.JournalEntry, error)
	CreateJournalEntry(title, content, userID string) (*models.JournalEntry, error)
	GetJournalEntriesByUserID(userID string) ([]models.JournalEntry, error)
}

type service struct {
	store Store
}

// NewService creates a new journal service.
func NewService(store Store) Service {
	return &service{store: store}
}

// GetJournalEntry retrieves a journal entry, creating it if it doesn't exist.
func (s *service) GetJournalEntry(id string) (*models.JournalEntry, error) {
	entry, err := s.store.GetByID(id)
	if err != nil {
		// If not found, create a new one
		newEntry := &models.JournalEntry{
			ID:      id,
			Title:   "Untitled",
			Content: "<h1>Untitled</h1><p>Start writing your new entry!</p>",
		}
		if createErr := s.store.Create(newEntry); createErr != nil {
			return nil, createErr
		}
		return newEntry, nil
	}
	return entry, nil
}

// UpdateJournalEntry updates the title and content of a journal entry.
func (s *service) UpdateJournalEntry(id, title, content string) (*models.JournalEntry, error) {
	entry, err := s.store.GetByID(id)
	if err != nil {
		// If the entry does not exist, create it.
		if errors.Is(err, gorm.ErrRecordNotFound) {
			newEntry := &models.JournalEntry{
				ID:      id,
				Title:   title,
				Content: content,
			}
			return newEntry, s.store.Create(newEntry)
		}
		return nil, err
	}

	entry.Title = title
	entry.Content = content

	if err := s.store.Update(entry); err != nil {
		return nil, err
	}
	return entry, nil
}

func (s *service) CreateJournalEntry(title, content, userID string) (*models.JournalEntry, error) {
	newEntry := &models.JournalEntry{
		ID:      fmt.Sprintf("doc-%d", time.Now().UnixNano()),
		Title:   title,
		Content: content,
		UserID:  userID,
	}

	if err := s.store.Create(newEntry); err != nil {
		return nil, err
	}

	return newEntry, nil
}

func (s *service) GetJournalEntriesByUserID(userID string) ([]models.JournalEntry, error) {
	return s.store.GetByUserID(userID)
} 