package user

import (
	"errors"
	"fmt"
	"regexp"
	"strings"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"github.com/adrianvalentim/gamify_journal/internal/models"
)

// Pre-defined error variables for common user service issues.
var (
	ErrUserNotFound       = errors.New("user not found")
	ErrEmailTaken         = errors.New("email is already taken")
	ErrUsernameTaken      = errors.New("username is already taken")
	ErrInvalidEmailFormat = errors.New("invalid email format")
	ErrPasswordTooShort   = errors.New("password must be at least 8 characters long")
	ErrPasswordComplexity = errors.New("password must contain at least one uppercase letter, one lowercase letter, and one digit")
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrValidation         = errors.New("validation failed") // Generic validation error
)

// Service defines the interface for user-related business logic operations.
type Service interface {
	RegisterUser(username, email, password string) (*models.User, error)
	GetUserByID(id string) (*models.User, error)
	GetUserByEmail(email string) (*models.User, error)
	AuthenticateUser(email, password string) (*models.User, error)
	// UpdateUserProfile(userID string, updates map[string]interface{}) (*models.User, error)
	// ChangePassword(userID, oldPassword, newPassword string) error
}

// service implements the Service interface for user operations.
type service struct {
	store Store // Dependency on the Store interface for data persistence
}

// NewService creates and returns a new user service instance.
func NewService(store Store) Service {
	return &service{store: store}
}

const (
	minPasswordLength = 8
	bcryptCost        = bcrypt.DefaultCost // Or a higher cost like 12-14 for better security
)

// emailRegex is a basic regex for email validation.
var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\'-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)

func (s *service) hashPassword(password string) (string, error) {
	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(password), bcryptCost)
	if err != nil {
		return "", fmt.Errorf("failed to hash password: %w", err)
	}
	return string(hashedBytes), nil
}

func (s *service) checkPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func (s *service) sanitizeAndValidateEmail(email string) (string, error) {
	saneEmail := strings.ToLower(strings.TrimSpace(email))
	if !emailRegex.MatchString(saneEmail) {
		return "", ErrInvalidEmailFormat
	}
	return saneEmail, nil
}

// RegisterUser handles the creation of a new user.
func (s *service) RegisterUser(username, email, password string) (*models.User, error) {
	username = strings.TrimSpace(username)
	if username == "" {
		return nil, fmt.Errorf("%w: username cannot be empty", ErrValidation)
	}

	saneEmail, err := s.sanitizeAndValidateEmail(email)
	if err != nil {
		return nil, err
	}

	// Check if email is already taken
	existingUserByEmail, err := s.store.GetByEmail(saneEmail)
	if err != nil {
		return nil, fmt.Errorf("error checking email availability: %w", err)
	}
	if existingUserByEmail != nil {
		return nil, ErrEmailTaken
	}

	// Check if username is already taken
	existingUserByUsername, err := s.store.GetByUsername(username)
	if err != nil {
		return nil, fmt.Errorf("error checking username availability: %w", err)
	}
	if existingUserByUsername != nil {
		return nil, ErrUsernameTaken
	}

	hashedPassword, err := s.hashPassword(password)
	if err != nil {
		return nil, err
	}

	newUser := &models.User{
		ID:             uuid.NewString(),
		Username:       username,
		Email:          saneEmail,
		HashedPassword: hashedPassword,
	}

	if err := s.store.Create(newUser); err != nil {
		return nil, fmt.Errorf("could not create user in store: %w", err)
	}

	newUser.HashedPassword = ""
	return newUser, nil
}

// GetUserByID retrieves a user by their ID, ensuring password hash is not exposed.
func (s *service) GetUserByID(id string) (*models.User, error) {
	user, err := s.store.GetByID(id)
	if err != nil {
		return nil, fmt.Errorf("store error fetching user by ID: %w", err)
	}
	if user == nil { // store.GetByID returns (nil, nil) if not found
		return nil, ErrUserNotFound
	}
	user.HashedPassword = "" // Sanitize output
	return user, nil
}

// GetUserByEmail retrieves a user by email, ensuring password hash is not exposed.
func (s *service) GetUserByEmail(email string) (*models.User, error) {
	saneEmail, err := s.sanitizeAndValidateEmail(email)
	if err != nil {
		// Allow retrieval even if format is odd, but log it? Or enforce strict format here too?
		// For now, let's proceed with the sanitized email for lookup.
		saneEmail = strings.ToLower(strings.TrimSpace(email)) // Basic sanitization if regex fails
	}

	user, err := s.store.GetByEmail(saneEmail)
	if err != nil {
		return nil, fmt.Errorf("store error fetching user by email: %w", err)
	}
	if user == nil {
		return nil, ErrUserNotFound
	}
	user.HashedPassword = "" // Sanitize output
	return user, nil
}

// AuthenticateUser validates user credentials (email and password).
func (s *service) AuthenticateUser(email, password string) (*models.User, error) {
	saneEmail, err := s.sanitizeAndValidateEmail(email)
	if err != nil {
		// For authentication, if the email format is bad, it's likely an invalid attempt.
		return nil, ErrInvalidCredentials
	}

	if password == "" {
		return nil, ErrInvalidCredentials
	}

	user, err := s.store.GetByEmail(saneEmail) // Login is typically via email
	if err != nil {
		// Log internal store error but return generic credential error to user
		// log.Printf("Store error during authentication for email %s: %v", saneEmail, err)
		return nil, ErrInvalidCredentials
	}
	if user == nil { // User not found
		return nil, ErrInvalidCredentials
	}

	if !s.checkPasswordHash(password, user.HashedPassword) {
		return nil, ErrInvalidCredentials // Password does not match
	}

	// Authentication successful, clear password before returning user model
	user.HashedPassword = ""
	return user, nil
}
