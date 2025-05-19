package models

import "time"

// UserProgress represents a user's gamification status.
// It corresponds to the UserProgress class in Class.md.
type UserProgress struct {
	ID        string `json:"id" gorm:"primaryKey"` // Can be UserID or a separate UUID for the record itself
	UserID    string `json:"user_id" gorm:"uniqueIndex"` // Foreign key to User, ensuring one progress per user
	Points    int    `json:"points"`
	Level     int    `json:"level"`

	// UnlockedAchievementIDs stores IDs of achievements the user has unlocked.
	// `gorm:"type:text[]"` is suitable for PostgreSQL native string arrays.
	// For other databases, or a more normalized structure, a join table (e.g., user_unlocked_achievements)
	// linking UserProgress and Achievement would be preferred.
	UnlockedAchievementIDs []string `json:"unlocked_achievement_ids,omitempty" gorm:"type:text[]"`

	// CurrentStreaks tracks active streaks, e.g., {"daily_writing": 5}.
	// `gorm:"type:jsonb"` is suitable for PostgreSQL JSONB type.
	// For other databases, this might be stored as a serialized string or in separate tables.
	CurrentStreaks map[string]int `json:"current_streaks,omitempty" gorm:"type:jsonb"`

	// LastStreakUpdate tracks the timestamp of the last update for each streak type.
	// This helps in determining if a streak is continuous or broken.
	LastStreakUpdate map[string]time.Time `json:"last_streak_update,omitempty" gorm:"type:jsonb"`

	UpdatedAt time.Time `json:"updated_at"`
}

/*
Alternative for UnlockedAchievements (more relational):

// UserUnlockedAchievement is a join table between UserProgress and Achievement
type UserUnlockedAchievement struct {
    UserProgressID string    `gorm:"primaryKey"`
    AchievementID  string    `gorm:"primaryKey"`
    AchievedAt     time.Time
    // UserProgress   UserProgress `gorm:"foreignKey:UserProgressID"` // Optional: for preloading
    // Achievement    Achievement  `gorm:"foreignKey:AchievementID"`  // Optional: for preloading
}

And in UserProgress struct:
UnlockedAchievements []Achievement `gorm:"many2many:user_unlocked_achievements;foreignKey:ID;joinForeignKey:UserProgressID;References:ID;joinReferences:AchievementID"`

This sets up a many-to-many relationship where `user_unlocked_achievements` is the join table.
The GORM tags would need to be precise based on the actual primary keys of UserProgress and Achievement.
If UserProgress.ID is the same as User.ID, the foreign keys might need adjustment.
*/ 