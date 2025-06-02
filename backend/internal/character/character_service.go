package character

import (
	"errors" // Standard errors package, can be replaced with a custom one
	"gamelife/internal/models"

	"github.com/google/uuid"
)

// ICharacterStore defines the interface for character data storage.
// This will be implemented by the character_store.go file.	ype ICharacterStore interface {
	CreateCharacter(character *models.Character) error
	GetCharacterByUserID(userID uuid.UUID) (*models.Character, error)
	UpdateCharacter(character *models.Character) error
	GetCharacterByID(id uuid.UUID) (*models.Character, error) // Added for completeness, might be needed later
}

// Service handles the business logic for characters.
// This struct will have methods attached to it, forming our "object-oriented" approach.
type Service struct {
	store ICharacterStore
}

// NewService creates a new character service.
func NewService(store ICharacterStore) *Service {
	return &Service{store: store}
}

// CreateCharacterInput defines the input for creating a character.
type CreateCharacterInput struct {
	UserID uuid.UUID
	Name   string
	Class  models.CharacterClass
}

// ValidationError is a custom error type for validation errors.
// You might have a more generic error handling system in pkg/errors.
type ValidationError struct {
	Field   string
	Message string
}

func (ve *ValidationError) Error() string {
	return ve.Field + ": " + ve.Message
}

// CreateCharacter creates a new character for a user.
func (s *Service) CreateCharacter(input CreateCharacterInput) (*models.Character, error) {
	// Basic validation
	if input.Name == "" {
		return nil, &ValidationError{Field: "Name", Message: "Character name cannot be empty"}
	}
	if input.UserID == uuid.Nil {
		return nil, &ValidationError{Field: "UserID", Message: "UserID cannot be nil"}
	}
	// Validate character class (optional, depends on how strictly you want to enforce enum values here vs. relying on DB)
	switch input.Class {
	case models.Warrior, models.Mage, models.Rogue:
		// Valid class
	default:
		return nil, &ValidationError{Field: "Class", Message: "Invalid character class"}
	}

	// Check if user already has a character (Optional: uncomment and adapt if this is a business rule)
	// existingChar, err := s.store.GetCharacterByUserID(input.UserID)
	// if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) { // Assuming gorm.ErrRecordNotFound or similar for not found
	// 	 return nil, err // Handle actual DB errors
	// }
	// if existingChar != nil {
	// 	 return nil, errors.New("user already has a character") // Or a custom error type
	// }

	character := &models.Character{
		UserID:           input.UserID,
		Name:             input.Name,
		Class:            input.Class,
		Level:            1,
		ExperiencePoints: 0,
	}

	if err := s.store.CreateCharacter(character); err != nil {
		// Consider wrapping the error for more context if you have a standard way of doing so.
		// return nil, fmt.Errorf("failed to create character in store: %w", err)
		return nil, err
	}
	return character, nil
}

// GrantXP grants experience points to a character and handles leveling up.
func (s *Service) GrantXP(characterID uuid.UUID, amount int) (char *models.Character, leveledUp bool, err error) {
	if amount <= 0 {
		// No XP granted or invalid amount, return current state without error or specific error
		char, err = s.store.GetCharacterByID(characterID)
		return char, false, err
	}

	char, err = s.store.GetCharacterByID(characterID)
	if err != nil {
		return nil, false, err // e.g., character not found
	}

	char.ExperiencePoints += amount
	leveledUp = s.levelUpIfNeeded(char) // Call another method of the service

	if err := s.store.UpdateCharacter(char); err != nil {
		return char, leveledUp, err // Return current char state even if update fails, but with error
	}
	return char, leveledUp, nil
}

// levelUpIfNeeded checks if the character has enough XP to level up and does so.
// This is like a "private" method for our service logic (though Go doesn't have private methods, convention is lowercase).
func (s *Service) levelUpIfNeeded(character *models.Character) bool {
	leveledUp := false
	// Define your leveling logic, e.g., XP threshold per level
	xpToNextLevel := character.Level * 100 // Example: 100 XP for L1->L2, 200 XP for L2->L3, etc.

	for character.ExperiencePoints >= xpToNextLevel && character.Level < 100 { // Cap level at 100 for example
		character.Level++
		character.ExperiencePoints -= xpToNextLevel
		// Potentially add stat increases or other rewards here
		leveledUp = true
		xpToNextLevel = character.Level * 100 // Recalculate for next potential level
	}
	return leveledUp
}

// GetCharacterByUserID retrieves a character by their UserID.
func (s *Service) GetCharacterByUserID(userID uuid.UUID) (*models.Character, error) {
	char, err := s.store.GetCharacterByUserID(userID)
	if err != nil {
		// Consider wrapping or mapping errors (e.g., to a common ErrNotFound)
		return nil, err
	}
	return char, nil
}

// GetCharacter retrieves a character by their own ID.
func (s *Service) GetCharacter(characterID uuid.UUID) (*models.Character, error) {
    char, err := s.store.GetCharacterByID(characterID)
    if err != nil {
        return nil, err
    }
    return char, nil
} 