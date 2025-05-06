package models

// Tag represents a keyword or label that can be associated with journal entries.
// It corresponds to the Tag class in Class.md.
type Tag struct {
	ID   string `json:"id" gorm:"primaryKey"`
	Name string `json:"name" gorm:"uniqueIndex"` // Assuming tags are global and names unique

	// If tags are user-specific, we might add:
	// UserID    string `json:"user_id,omitempty" gorm:"index"`
	// And adjust uniqueness to be a composite key of UserID and Name.

	// For GORM many2many relationship with JournalEntry:
	// Entries []JournalEntry `gorm:"many2many:journal_entry_tags;"`
} 