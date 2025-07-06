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
	ID        string    `gorm:"primaryKey" json:"id"`
	UserID    string    `gorm:"uniqueIndex" json:"user_id"`
	Name      string    `json:"name"`
	Bio       string    `json:"bio"`
	AvatarURL string    `json:"avatar_url"`
	XP        int       `gorm:"default:0" json:"xp"`
	Level     int       `gorm:"default:1" json:"level"`
	Class     string    `json:"class"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// BeforeCreate will set a UUID rather than relying on database default UUID generation.
func (character *Character) BeforeCreate(tx *gorm.DB) (err error) {
	character.ID = uuid.New().String()
	return
}
