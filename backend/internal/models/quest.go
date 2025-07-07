package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// QuestStatus defines the possible statuses of a quest.
type QuestStatus string

const (
	// QuestStatusInProgress means the quest has been started by the user.
	QuestStatusInProgress QuestStatus = "in_progress"
	// QuestStatusCompleted means the user has completed all objectives of the quest.
	QuestStatusCompleted QuestStatus = "completed"
)

// Quest represents a challenge or a set of tasks users can undertake for rewards.
// This model is simplified to be user-specific and managed by the AI agent.
type Quest struct {
	ID               string      `gorm:"primaryKey" json:"id"`
	UserID           string      `gorm:"index" json:"userId"`
	Title            string      `json:"title"`
	Description      string      `json:"description"`
	Status           QuestStatus `gorm:"default:'in_progress'" json:"status"`
	ExperienceReward int         `json:"experienceReward"`
	CreatedAt        time.Time   `json:"createdAt"`
	UpdatedAt        time.Time   `json:"updatedAt"`
}

// BeforeCreate will set a UUID rather than relying on database default UUID generation.
func (quest *Quest) BeforeCreate(tx *gorm.DB) (err error) {
	quest.ID = uuid.New().String()
	return
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
