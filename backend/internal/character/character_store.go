package character

import (
	"errors" // Standard Go errors package
	"github.com/adrianvalentim/gamify_journal/internal/models" // Adjust path as necessary

	"gorm.io/gorm"
)

// Store handles database operations for characters.
// It implements the ICharacterStore interface defined in character_service.go.
type Store struct {
	db *gorm.DB
}

// NewStore creates a new character store.
func NewStore(db *gorm.DB) *Store {
	return &Store{db: db}
}

// CreateCharacter adds a new character to the database.
func (s *Store) CreateCharacter(character *models.Character) error {
	return s.db.Create(character).Error
}

// GetCharacterByUserID retrieves a character by their UserID.
func (s *Store) GetCharacterByUserID(userID string) (*models.Character, error) {
	var character models.Character
	// It's good practice to preload related data if you often need it, e.g., User.
	// err := s.db.Preload("User").Where("user_id = ?", userID).First(&character).Error
	err := s.db.Where("user_id = ?", userID).First(&character).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Return a specific error or nil, nil if not found is not an application error
			// For now, just return the gorm error which service layer can check.
			return nil, err 
		}
		return nil, err
	}
	return &character, nil
}

// UpdateCharacter updates an existing character in the database.
func (s *Store) UpdateCharacter(character *models.Character) error {
	return s.db.Save(character).Error
}

// GetCharacterByID retrieves a character by their ID.
func (s *Store) GetCharacterByID(id string) (*models.Character, error) {
	var character models.Character
	err := s.db.First(&character, "id = ?", id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, err // Let service layer handle ErrRecordNotFound
		}
		return nil, err
	}
	return &character, nil
} 