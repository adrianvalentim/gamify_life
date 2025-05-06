package database

import (
	"fmt"
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"gamify_journal/internal/models" // Assumes module name is 'gamify_journal'
)

var DB *gorm.DB

// Connect initializes the database connection.
// It tries to read DB_DSN from environment variables first.
// Falls back to a default DSN for local development if DB_DSN is not set.
func Connect() error {
	dsn := os.Getenv("DB_DSN")
	if dsn == "" {
		log.Println("Warning: DB_DSN environment variable not set. Falling back to default local DSN. Ensure your local PostgreSQL is configured accordingly.")
		// Replace with your actual local PostgreSQL connection string
		dsn = "host=localhost user=youruser password=yourpassword dbname=gamify_journal_db port=5432 sslmode=disable TimeZone=UTC"
	}

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info), // Set to logger.Silent for production if desired
	})

	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	log.Println("Database connection successfully established.")
	return nil
}

// MigrateAll performs auto-migration for all defined models in internal/models.
// This should be called once, usually at application startup.
func MigrateAll() error {
	if DB == nil {
		return fmt.Errorf("database connection is not initialized, call database.Connect() first")
	}
	log.Println("Starting database auto-migrations...")

	// Add all your models here to be migrated
	migrationErr := DB.AutoMigrate(
		&models.User{},
		&models.JournalEntry{},
		&models.Tag{},
		&models.Achievement{},
		&models.UserProgress{},
		&models.Quest{}, // Task struct is embedded in Quest for JSONB, so not migrated separately as a table
	)

	if migrationErr != nil {
		return fmt.Errorf("failed to auto-migrate database schemas: %w", migrationErr)
	}

	log.Println("Database auto-migrations completed successfully.")
	return nil
}

// GetDB returns the global GORM DB instance.
// Ensure Connect() has been called successfully before using this.
func GetDB() *gorm.DB {
	return DB
} 