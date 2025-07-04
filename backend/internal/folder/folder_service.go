package folder

import (
	"github.com/adrianvalentim/gamify_journal/internal/models"
)

// Service defines the interface for folder business logic.
type Service interface {
	CreateFolder(name string, parentID *string, userID string) (*models.Folder, error)
	GetFoldersByUserID(userID string) ([]models.Folder, error)
	UpdateFolder(folderID string, newName string) (*models.Folder, error)
	DeleteFolder(folderID string) error
}

type service struct {
	store Store
}

// NewService creates a new folder service.
func NewService(store Store) Service {
	return &service{store: store}
}

// CreateFolder creates a new folder.
func (s *service) CreateFolder(name string, parentID *string, userID string) (*models.Folder, error) {
	newFolder := &models.Folder{
		Name:     name,
		ParentID: parentID,
		UserID:   userID,
	}

	if err := s.store.Create(newFolder); err != nil {
		return nil, err
	}

	return newFolder, nil
}

// UpdateFolder updates a folder's name.
func (s *service) UpdateFolder(folderID string, newName string) (*models.Folder, error) {
	// For now, we only support renaming. We'd need to fetch the folder first
	// if we were updating more properties to avoid overwriting them.
	updatedFolder := &models.Folder{
		ID:   folderID,
		Name: newName,
	}
	if err := s.store.Update(updatedFolder); err != nil {
		return nil, err
	}
	return updatedFolder, nil
}

// DeleteFolder deletes a folder by its ID.
func (s *service) DeleteFolder(folderID string) error {
	return s.store.Delete(folderID)
}

// GetFoldersByUserID retrieves all folders for a given user ID.
func (s *service) GetFoldersByUserID(userID string) ([]models.Folder, error) {
	return s.store.GetFoldersByUserID(userID)
} 