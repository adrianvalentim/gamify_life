package models

// Achievement represents a defined achievement that users can unlock.
// It corresponds to the Achievement class in Class.md.
type Achievement struct {
	ID          string `json:"id" gorm:"primaryKey"` // e.g., "first_entry", "7_day_streak"
	Name        string `json:"name"`
	Description string `json:"description"`
	IconURL     string `json:"icon_url,omitempty"`
	Points      int    `json:"points"`
	// Criteria for unlocking this achievement.
	// This could be a simple string description, a JSON object stored as string/JSONB,
	// or map to more complex logic in the gamification service.
	CriteriaDescription string `json:"criteria_description,omitempty"`
} 