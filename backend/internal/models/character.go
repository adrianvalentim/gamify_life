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
	ID        string `gorm:"type:uuid;primary_key;" json:"id"`
	UserID    string `gorm:"type:uuid;not null" json:"user_id"`
	User      User   `gorm:"foreignkey:UserID"`
	Name      string `gorm:"not null" json:"name"`
	Class     string `gorm:"not null" json:"class"`
	AvatarURL string `json:"avatar_url"`
	Level     int    `gorm:"not null;default:1" json:"level"`
	XP        int    `gorm:"column:experience_points;not null;default:0" json:"xp"`

	// Core D&D-style attributes
	Strength int `gorm:"not null;default:10" json:"strength"`
	Defense  int `gorm:"not null;default:10" json:"defense"`
	Vitality int `gorm:"not null;default:10" json:"vitality"`
	Mana     int `gorm:"not null;default:10" json:"mana"`

	// Points to be spent on level up
	AttributePoints int `gorm:"not null;default:0" json:"attribute_points"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// BeforeCreate will set a UUID rather than relying on database default UUID generation.
func (character *Character) BeforeCreate(tx *gorm.DB) (err error) {
	character.ID = uuid.New().String()
	return
}
