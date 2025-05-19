package user

import (
	"errors"
	"fmt"
	"regexp" // For matching UUIDs
	"testing"
	// "time" // Not directly used in this initial set of tests, but might be for CreatedAt/UpdatedAt checks

	"github.com/adrianvalentim/gamify_journal/internal/models"
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

	var capturedUserForCreate models.User // Store a copy of the user
	var wasCreateCalled bool
	mockStore.CreateFunc = func(u *models.User) error {
		wasCreateCalled = true
		capturedUserForCreate = *u // Make a copy of the user struct at the moment of creation
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
	if !wasCreateCalled {
		t.Fatal("mockStore.CreateFunc was not called")
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

// TestUserService_RegisterUser_InvalidEmailFormat tests the scenario where the email format is invalid.
func TestUserService_RegisterUser_InvalidEmailFormat(t *testing.T) {
	mockStore := &mockUserStore{}
	userService := NewService(mockStore)

	_, err := userService.RegisterUser("testuser", "invalidemail", "ValidPass123")

	if err == nil {
		t.Fatal("RegisterUser() expected an error for invalid email format, got nil")
	}
	// Assuming you have a specific error type like ErrInvalidEmailFormat
	if !errors.Is(err, ErrInvalidEmailFormat) {
	 t.Errorf("RegisterUser() expected error type %v, got %v", ErrInvalidEmailFormat, err)
	}
}

// TestUserService_RegisterUser_PasswordTooShort tests the scenario where the password is too short.
func TestUserService_RegisterUser_PasswordTooShort(t *testing.T) {
	mockStore := &mockUserStore{}
	userService := NewService(mockStore)

	// Assuming your service defines a minimum password length
	_, err := userService.RegisterUser("testuser", "valid@example.com", "short")

	if err == nil {
		t.Fatal("RegisterUser() expected an error for password too short, got nil")
	}
	if !errors.Is(err, ErrPasswordTooShort) {
	 t.Errorf("RegisterUser() expected error %v, got %v", ErrPasswordTooShort, err)
	}
}

// TestUserService_RegisterUser_EmptyUsername tests the scenario where the username is empty.
func TestUserService_RegisterUser_EmptyUsername(t *testing.T) {
	mockStore := &mockUserStore{}
	userService := NewService(mockStore)

	_, err := userService.RegisterUser("", "valid@example.com", "ValidPass123")

	if err == nil {
		t.Fatal("RegisterUser() expected an error for empty username, got nil")
	}
	// The service returns a wrapped ErrValidation for empty username.
	// We check if ErrValidation is part of the error chain.
	if !errors.Is(err, ErrValidation) {
		t.Errorf("RegisterUser() expected error chain to include %v for empty username, got %v", ErrValidation, err)
	}
}

// TestUserService_RegisterUser_StoreCreateError tests the scenario where the store's Create method returns an error.
func TestUserService_RegisterUser_StoreCreateError(t *testing.T) {
	mockStore := &mockUserStore{}
	userService := NewService(mockStore)

	username := "testuser"
	email := "test@example.com"
	password := "ValidPass123"
	expectedStoreError := errors.New("simulated store create error")

	mockStore.GetByEmailFunc = func(e string) (*models.User, error) {
		return nil, nil // Email not taken
	}
	mockStore.GetByUsernameFunc = func(u string) (*models.User, error) {
		return nil, nil // Username not taken
	}
	mockStore.CreateFunc = func(u *models.User) error {
		return expectedStoreError // Simulate error during store.Create
	}

	_, err := userService.RegisterUser(username, email, password)

	if err == nil {
		t.Fatal("RegisterUser() expected an error from store.Create, got nil")
	}
	if !errors.Is(err, expectedStoreError) {
		t.Errorf("RegisterUser() expected wrapped store error %v, got %v", expectedStoreError, err)
	}
}

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