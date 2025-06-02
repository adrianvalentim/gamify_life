package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// CharacterClass represents the class of the character (e.g., Warrior, Mage).
type CharacterClass string

const (
	Warrior CharacterClass = "Warrior"
	Mage    CharacterClass = "Mage"
	Rogue   CharacterClass = "Rogue"
	// Add more classes as needed
)

// Character represents a user's game character.
type Character struct {
	ID               uuid.UUID `gorm:"type:uuid;primary_key;"`
	UserID           uuid.UUID `gorm:"type:uuid;not null;uniqueIndex"` // Foreign key to User
	User             User      `gorm:"foreignKey:UserID"`            // Belongs to User
	Name             string    `gorm:"type:varchar(100);not null"`
	Class            CharacterClass `gorm:"type:varchar(50);not null"`
	Level            int       `gorm:"default:1;not null"`
	ExperiencePoints int       `gorm:"default:0;not null"`
	// Add other RPG elements like Strength, Dexterity, Health, Mana etc. later if needed
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`
}

// BeforeCreate will set a UUID rather than relying on database default UUID generation.
func (character *Character) BeforeCreate(tx *gorm.DB) (err error) {
	character.ID = uuid.New()
	return
} 