package journal

import (
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/adrianvalentim/gamify_journal/internal/ai"
	"github.com/adrianvalentim/gamify_journal/internal/character"
	"github.com/adrianvalentim/gamify_journal/internal/models"
	"gorm.io/gorm"
)

// Service defines the interface for journal business logic.
type Service interface {
	GetJournalEntry(id string) (*models.JournalEntry, error)
	UpdateJournalEntry(id, title, content string, folderID *string, newText string) (*models.JournalEntry, error)
	CreateJournalEntry(title, content, userID string, folderID *string) (*models.JournalEntry, error)
	GetJournalEntriesByUserID(userID string) ([]models.JournalEntry, error)
	DeleteJournalEntry(id string) error
}

type service struct {
	store            Store
	aiService        *ai.AIService
	characterService *character.Service
}

// NewService creates a new journal service.
func NewService(store Store, aiService *ai.AIService, characterService *character.Service) Service {
	return &service{store: store, aiService: aiService, characterService: characterService}
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
func (s *service) UpdateJournalEntry(id, title, content string, folderID *string, newText string) (*models.JournalEntry, error) {
	entry, err := s.store.GetByID(id)
	if err != nil {
		// If the entry does not exist, create it.
		if errors.Is(err, gorm.ErrRecordNotFound) {
			newEntry := &models.JournalEntry{
				ID:       id,
				Title:    title,
				Content:  content,
				FolderID: folderID,
			}
			return newEntry, s.store.Create(newEntry)
		}
		return nil, err
	}

	// Only update fields that are not empty
	if title != "" {
		entry.Title = title
	}
	if content != "" {
		entry.Content = content
	}
	if folderID != nil {
		entry.FolderID = folderID
	}

	if err := s.store.Update(entry); err != nil {
		return nil, err
	}

	// Determine what text to send to the AI
	textToProcess := newText
	if textToProcess == "" {
		textToProcess = content
	}

	// After successfully updating, send content to the AI services
	// Process for XP
	go func() {
		_, err := s.aiService.ProcessText(textToProcess, entry.UserID)
		if err != nil {
			log.Printf("Failed to process text with XP agent: %v", err)
			return
		}
		log.Printf("XP agent processed entry %s successfully.", entry.ID)
	}()

	// Process for Quests
	go func() {
		err := s.aiService.ProcessTextForQuests(textToProcess, entry.UserID)
		if err != nil {
			log.Printf("Failed to process text with Quest agent: %v", err)
			return
		}
		log.Printf("Quest agent processed entry %s successfully.", entry.ID)
	}()

	return entry, nil
}

func (s *service) CreateJournalEntry(title, content, userID string, folderID *string) (*models.JournalEntry, error) {
	newEntry := &models.JournalEntry{
		ID:       fmt.Sprintf("doc-%d", time.Now().UnixNano()),
		Title:    title,
		Content:  content,
		UserID:   userID,
		FolderID: folderID,
	}

	if err := s.store.Create(newEntry); err != nil {
		return nil, err
	}

	return newEntry, nil
}

func (s *service) GetJournalEntriesByUserID(userID string) ([]models.JournalEntry, error) {
	return s.store.GetByUserID(userID)
}

// DeleteJournalEntry deletes a journal entry by its ID.
func (s *service) DeleteJournalEntry(id string) error {
	return s.store.Delete(id)
}
