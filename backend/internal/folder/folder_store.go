package folder

import (
	"github.com/adrianvalentim/gamify_journal/internal/models"
	"gorm.io/gorm"
)

// Store defines the interface for folder data persistence.
type Store interface {
	Create(folder *models.Folder) error
	GetFoldersByUserID(userID string) ([]models.Folder, error)
	Update(folder *models.Folder) error
	Delete(folderID string) error
}

// gormStore is a GORM implementation of the Store interface.
type gormStore struct {
	db *gorm.DB
}

// NewStore creates a new GORM store for folders.
func NewStore(db *gorm.DB) Store {
	return &gormStore{db: db}
}

// Create creates a new folder.
func (s *gormStore) Create(folder *models.Folder) error {
	return s.db.Create(folder).Error
}

// Update updates an existing folder's name.
func (s *gormStore) Update(folder *models.Folder) error {
	// Using .Model and .Update to only change the specified field.
	// .Save() would try to update all fields, causing issues with zero-values.
	return s.db.Model(&models.Folder{}).Where("id = ?", folder.ID).Update("name", folder.Name).Error
}

// Delete removes a folder by its ID.
// This is a hard delete. It also sets the folder_id of associated documents to NULL.
func (s *gormStore) Delete(folderID string) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		// Set folder_id to NULL for documents in the folder being deleted
		if err := tx.Model(&models.JournalEntry{}).Where("folder_id = ?", folderID).Update("folder_id", nil).Error; err != nil {
			return err
		}

		// Delete the folder
		if err := tx.Where("id = ?", folderID).Delete(&models.Folder{}).Error; err != nil {
			return err
		}

		return nil
	})
}

// GetFoldersByUserID retrieves all folders for a given user ID.
func (s *gormStore) GetFoldersByUserID(userID string) ([]models.Folder, error) {
	var folders []models.Folder
	// Preload Subfolders recursively
	if err := s.db.Where("user_id = ? AND parent_id IS NULL", userID).
		Preload("Subfolders", func(db *gorm.DB) *gorm.DB {
			return db.Order("name ASC")
		}).
		Order("name ASC").
		Find(&folders).Error; err != nil {
		return nil, err
	}
	return folders, nil
} 