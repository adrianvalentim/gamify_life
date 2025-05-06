package models

import "time"

// User represents a user in the system.
// It corresponds to the User class defined in Class.md.
type User struct {
	ID             string    `json:"id" gorm:"primaryKey"` // Using string for ID, suitable for UUIDs.
	Username       string    `json:"username" gorm:"unique"`
	Email          string    `json:"email" gorm:"unique"`
	HashedPassword string    `json:"-"` // Excluded from JSON responses.
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
} 