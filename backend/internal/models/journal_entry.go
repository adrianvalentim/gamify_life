package models

import "time"

// JournalEntry represents a single journal entry made by a user.
// It corresponds to the JournalEntry class in Class.md.
type JournalEntry struct {
	ID        string    `json:"id" gorm:"primaryKey"`
	UserID    string    `json:"user_id" gorm:"index"` // Foreign key to User.ID
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	Mood      string    `json:"mood,omitempty"` // omitempty if mood is optional
	FolderID  *string   `gorm:"index" json:"folder_id"` // Nullable for documents in root
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Tags      []Tag     `json:"tags,omitempty" gorm:"many2many:journal_entry_tags;"` // Relationship with Tags
	// TagIDs    []string `json:"tag_ids,omitempty" gorm:"-"` // Placeholder for tag association - REMOVED

	// Associations
	User User `gorm:"foreignKey:UserID" json:"-"`
}

// BeforeCreate will set a UUID for the journal entry if it's not set.
// ... existing code ... 