package user

import (
	"errors"
	"fmt"
	"regexp" // For matching UUIDs
	"testing"
	// "time" // Not directly used in this initial set of tests, but might be for CreatedAt/UpdatedAt checks

	"gamify_journal/internal/models"
	// We don't import bcrypt here directly for tests if we trust our hashPassword,
	// but for mockStore, we might need to simulate password checking if we were testing AuthenticateUser more deeply.
)

// mockUserStore is a mock implementation of the Store interface for testing the user service.
type mockUserStore struct {
	CreateFunc        func(user *models.User) error
	GetByIDFunc       func(id string) (*models.User, error)
	GetByEmailFunc    func(email string) (*models.User, error)
	GetByUsernameFunc func(username string) (*models.User, error)
	UpdateFunc        func(user *models.User) error
}

// Implement the Store interface for mockUserStore
func (m *mockUserStore) Create(user *models.User) error {
	if m.CreateFunc != nil {
		return m.CreateFunc(user)
	}
	// Default behavior if CreateFunc is not set for a specific test
	return fmt.Errorf("CreateFunc not implemented in mockUserStore for this test")
}

func (m *mockUserStore) GetByID(id string) (*models.User, error) {
	if m.GetByIDFunc != nil {
		return m.GetByIDFunc(id)
	}
	return nil, fmt.Errorf("GetByIDFunc not implemented in mockUserStore for this test")
}

func (m *mockUserStore) GetByEmail(email string) (*models.User, error) {
	if m.GetByEmailFunc != nil {
		return m.GetByEmailFunc(email)
	}
	return nil, fmt.Errorf("GetByEmailFunc not implemented in mockUserStore for this test")
}

func (m *mockUserStore) GetByUsername(username string) (*models.User, error) {
	if m.GetByUsernameFunc != nil {
		return m.GetByUsernameFunc(username)
	}
	return nil, fmt.Errorf("GetByUsernameFunc not implemented in mockUserStore for this test")
}

func (m *mockUserStore) Update(user *models.User) error {
	if m.UpdateFunc != nil {
		return m.UpdateFunc(user)
	}
	return fmt.Errorf("UpdateFunc not implemented in mockUserStore for this test")
}

// uuidRegex helps validate that an ID string is in UUID format.
var uuidRegex = regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`)

func TestUserService_RegisterUser_Success(t *testing.T) {
	mockStore := &mockUserStore{}
	userService := NewService(mockStore) // userService is of type Service (interface)

	username := "testuser"
	email := "test@example.com"
	password := "ValidPass123"

	// Configure mockStore behavior for this specific test case
	mockStore.GetByEmailFunc = func(e string) (*models.User, error) {
		if e == email {
			return nil, nil // Simulate email not taken
		}
		return nil, fmt.Errorf("mock GetByEmail called with unexpected email: %s", e)
	}
	mockStore.GetByUsernameFunc = func(u string) (*models.User, error) {
		if u == username {
			return nil, nil // Simulate username not taken
		}
		return nil, fmt.Errorf("mock GetByUsername called with unexpected username: %s", u)
	}

	var capturedUserForCreate *models.User
	mockStore.CreateFunc = func(u *models.User) error {
		capturedUserForCreate = u // Capture the user passed to the mock store's Create method
		// Simulate successful creation by GORM (GORM would set CreatedAt, UpdatedAt)
		// For the purpose of what the service returns, these are not set by the service itself anymore.
		return nil
	}

	registeredUser, err := userService.RegisterUser(username, email, password)

	if err != nil {
		t.Fatalf("RegisterUser() expected no error, got %v", err)
	}
	if registeredUser == nil {
		t.Fatal("RegisterUser() expected a non-nil user, got nil")
	}

	// Validate the user object returned by the service
	if registeredUser.Username != username {
		t.Errorf("Expected username %s, got %s", username, registeredUser.Username)
	}
	if registeredUser.Email != email {
		t.Errorf("Expected email %s, got %s", email, registeredUser.Email)
	}
	if registeredUser.HashedPassword != "" {
		t.Error("Expected HashedPassword to be empty in the user model returned by the service")
	}
	if !uuidRegex.MatchString(registeredUser.ID) {
		t.Errorf("Expected ID to be a valid UUID, got '%s'", registeredUser.ID)
	}

	// Validate the user object that was passed to the store's Create method
	if capturedUserForCreate == nil {
		t.Fatal("mockStore.CreateFunc was not called or did not capture the user")
	}
	if capturedUserForCreate.Username != username {
		t.Errorf("Username passed to store.Create was '%s', expected '%s'", capturedUserForCreate.Username, username)
	}
	if capturedUserForCreate.Email != email {
		t.Errorf("Email passed to store.Create was '%s', expected '%s'", capturedUserForCreate.Email, email)
	}
	if capturedUserForCreate.HashedPassword == "" || capturedUserForCreate.HashedPassword == password {
		t.Error("HashedPassword passed to store.Create was empty or still plain text")
	}
	if !uuidRegex.MatchString(capturedUserForCreate.ID) {
		t.Errorf("ID passed to store.Create was '%s', expected UUID format", capturedUserForCreate.ID)
	}
}

// TestUserService_RegisterUser_EmailTaken tests the scenario where the email is already in use.
func TestUserService_RegisterUser_EmailTaken(t *testing.T) {
	mockStore := &mockUserStore{}
	userService := NewService(mockStore)

	username := "newuser"
	email := "taken@example.com"
	password := "ValidPass123"

	mockStore.GetByEmailFunc = func(e string) (*models.User, error) {
		if e == email {
			return &models.User{ID: "someID", Email: e}, nil // Simulate email is taken
		}
		return nil, nil
	}
	// GetByUsernameFunc will not be called if email check fails first, but good to define for clarity
	mockStore.GetByUsernameFunc = func(u string) (*models.User, error) {
		return nil, nil
	}

	_, err := userService.RegisterUser(username, email, password)

	if err == nil {
		t.Fatal("RegisterUser() expected an error for taken email, got nil")
	}
	if !errors.Is(err, ErrEmailTaken) {
		t.Errorf("RegisterUser() expected error %v, got %v", ErrEmailTaken, err)
	}
}

// TestUserService_RegisterUser_UsernameTaken tests username already in use.
func TestUserService_RegisterUser_UsernameTaken(t *testing.T) {
	mockStore := &mockUserStore{}
	userService := NewService(mockStore)

	username := "takenUser"
	email := "unique@example.com"
	password := "ValidPass123"

	mockStore.GetByEmailFunc = func(e string) (*models.User, error) {
		return nil, nil // Email is not taken
	}
	mockStore.GetByUsernameFunc = func(u string) (*models.User, error) {
		if u == username {
			return &models.User{ID: "someID", Username: u}, nil // Username is taken
		}
		return nil, nil
	}

	_, err := userService.RegisterUser(username, email, password)

	if err == nil {
		t.Fatal("RegisterUser() expected an error for taken username, got nil")
	}
	if !errors.Is(err, ErrUsernameTaken) {
		t.Errorf("RegisterUser() expected error %v, got %v", ErrUsernameTaken, err)
	}
}

// TODO: Add more test cases for RegisterUser covering other validation paths:
// - InvalidEmailFormat
// - PasswordTooShort
// - PasswordComplexity
// - Empty username
// - Store Create function returning an error

// TODO: Add comprehensive tests for AuthenticateUser:
// - Success
// - UserNotFound (bad email)
// - InvalidCredentials (wrong password)
// - Empty email/password inputs
// - Store GetByEmail returning an error

// TODO: Add tests for GetUserByID:
// - Success
// - UserNotFound
// - Store GetByID returning an error

// TODO: Add tests for GetUserByEmail:
// - Success
// - UserNotFound
// - Store GetByEmail returning an error

} 