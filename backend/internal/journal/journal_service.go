package journal

import (
	"github.com/adrianvalentim/gamify_journal/internal/models"
)

// Service defines the interface for journal business logic.
type Service interface {
	GetJournalEntry(id string) (*models.JournalEntry, error)
	UpdateJournalEntry(id, title, content string) (*models.JournalEntry, error)
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
		return nil, err // Or handle as a creation case if desired
	}

	entry.Title = title
	entry.Content = content

	if err := s.store.Update(entry); err != nil {
		return nil, err
	}
	return entry, nil
} 