package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Folder represents a folder in the journal, which can contain documents and other folders.
type Folder struct {
	ID        string         `gorm:"primaryKey" json:"id"`
	Name      string         `gorm:"not null" json:"name"`
	UserID    string         `gorm:"index;not null" json:"user_id"`
	ParentID  *string        `gorm:"index" json:"parent_id"` // Nullable for root folders
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// Associations
	User      User     `gorm:"foreignKey:UserID" json:"-"`
	Parent    *Folder  `gorm:"foreignKey:ParentID" json:"-"`
	Subfolders []Folder `gorm:"foreignKey:ParentID" json:"subfolders"`
}

// BeforeCreate will set a UUID for the folder.
func (folder *Folder) BeforeCreate(tx *gorm.DB) (err error) {
	if folder.ID == "" {
		folder.ID = "folder-" + uuid.New().String()
	}
	return
} 