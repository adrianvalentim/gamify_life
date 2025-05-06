package models

import "time"

// Task represents a single task that might be part of a Quest or a standalone activity.
// Note: If tasks are only ever part of Quests, this could be nested or defined locally to Quest-related packages.
// For now, defining it here for potential broader use or if quests have complex task structures.
type Task struct {
	ID          string `json:"id"` // Unique identifier for the task, could be unique within a Quest or globally if tasks are reusable.
	Description string `json:"description"`
	// TargetValue defines what needs to be achieved for this task (e.g., count of actions, specific state).
	TargetValue int `json:"target_value"`
	// ActionType could be a string like "write_entry", "add_mood", "complete_streak_X_days"
	// This helps the gamification service know what event to listen for or what state to check.
	ActionType string `json:"action_type,omitempty"`
	// Points awarded for completing this specific task, if quests are granular.
	Points int `json:"points,omitempty"`
}

// Quest represents a challenge or a set of tasks users can undertake for rewards.
// It corresponds to the Quest class in Class.md.
type Quest struct {
	ID           string    `json:"id" gorm:"primaryKey"`
	Title        string    `json:"title"`
	Description  string    `json:"description"`
	Tasks        []Task    `json:"tasks" gorm:"type:jsonb"` // Storing tasks as JSONB. Assumes DB support (like PostgreSQL).
	RewardPoints int       `json:"reward_points,omitempty"` // Points awarded upon completing the entire quest.
	// RewardBadgeID could link to a separate Badges model/table if you have visual badges.
	RewardBadgeID string    `json:"reward_badge_id,omitempty"`
	IsRecurring  bool      `json:"is_recurring"`
	IsActive     bool      `json:"is_active" gorm:"default:true"` // To administratively enable/disable quests.
	StartDate    time.Time `json:"start_date,omitempty"`          // When the quest becomes available.
	ExpiryDate   time.Time `json:"expiry_date,omitempty"`          // When the quest is no longer available.
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

/*
User-specific Quest Progress:

To track an individual user's progress on a quest, especially if tasks are complex or need individual tracking,
we would typically introduce another model, for example:

type UserQuestProgress struct {
    ID             string    `gorm:"primaryKey"`
    UserID         string    `gorm:"index"`
    QuestID        string    `gorm:"index"`
    Status         string    // e.g., "not_started", "in_progress", "completed", "failed"
    TasksProgress  map[string]int `gorm:"type:jsonb"` // Key: Task.ID, Value: current progress towards Task.TargetValue
    StartedAt      time.Time
    CompletedAt    time.Time `gorm:"nullable"`
    LastProgressAt time.Time
}

This `UserQuestProgress` model would store which tasks a user has progressed on for a given quest
and the overall status of the quest for that user.
The `Quest.Tasks` field would serve as the definition of the quest, while `UserQuestProgress.TasksProgress` would track the instance data.
*/ 