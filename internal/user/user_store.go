package user

import (
	"errors"

	"gorm.io/gorm"

	"github.com/adrianvalentim/gamify_journal/internal/models"
	"github.com/adrianvalentim/gamify_journal/internal/platform/database"
)

// Store defines the interface for user data storage operations.
// This allows for test mocking and decouples the service layer from direct GORM implementation details.
type Store interface {
	Create(user *models.User) error
	GetByID(id string) (*models.User, error)
	GetByEmail(email string) (*models.User, error)
	GetByUsername(username string) (*models.User, error)
	Update(user *models.User) error
	// Delete(id string) error // To be added if/when deletion functionality is required
}

// GormStore implements the Store interface using GORM for database interactions.
type GormStore struct {
	db *gorm.DB
}

// NewGormStore creates and returns a new GormStore instance.
// It retrieves the database connection from the global database package.
func NewGormStore() *GormStore {
	return &GormStore{db: database.GetDB()}
}

// Create attempts to insert a new user record into the database.
// Assumes user.ID is pre-populated if not auto-incrementing (e.g., UUIDs).
// Assumes password hashing has been done prior to calling this method (in the service layer).
func (s *GormStore) Create(user *models.User) error {
	if err := s.db.Create(user).Error; err != nil {
		// More specific error handling (e.g., for duplicate constraints) can be added here
		// or checked by the service layer by inspecting the error type.
		return err
	}
	return nil
}

// GetByID retrieves a user from the database by their primary ID.
// Returns (nil, nil) if the record is not found, allowing the service layer to handle.
func (s *GormStore) GetByID(id string) (*models.User, error) {
	var user models.User
	// GORM's First method finds the first record matching the given conditions.
	if err := s.db.Where("id = ?", id).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil // Standard practice to return nil, nil for not found
		}
		return nil, err // Other database error
	}
	return &user, nil
}

// GetByEmail retrieves a user from the database by their email address.
// Returns (nil, nil) if the record is not found.
func (s *GormStore) GetByEmail(email string) (*models.User, error) {
	var user models.User
	if err := s.db.Where("email = ?", email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

// GetByUsername retrieves a user from the database by their username.
// Returns (nil, nil) if the record is not found.
func (s *GormStore) GetByUsername(username string) (*models.User, error) {
	var user models.User
	if err := s.db.Where("username = ?", username).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

// Update saves changes to an existing user record in the database.
// It uses GORM's Save method, which updates all fields of the model based on its primary key.
// For partial updates, s.db.Model(user).Updates(changesMap) would be more appropriate.
func (s *GormStore) Update(user *models.User) error {
	return s.db.Save(user).Error
} 