package user

import (
	"encoding/json"
	"errors"
	"net/http"
	"time" // Added for time formatting

	"github.com/adrianvalentim/gamify_journal/internal/models"

	"github.com/go-chi/chi/v5"
)

// --- Request/Response Structs ---

// RegisterUserRequest defines the expected payload for user registration.
type RegisterUserRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

// LoginUserRequest defines the expected payload for user login.
type LoginUserRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// UserResponse is the sanitized user data sent back to clients.
// It omits sensitive information like the password hash.
type UserResponse struct {
	ID        string `json:"id"`
	Username  string `json:"username"`
	Email     string `json:"email"`
	CreatedAt string `json:"created_at"` // Using string for consistent time format (RFC3339)
	UpdatedAt string `json:"updated_at"` // Using string for consistent time format (RFC3339)
}

// AuthResponse is sent back on successful login, including user details and a token.
type AuthResponse struct {
	User  UserResponse `json:"user"`
	Token string       `json:"token,omitempty"` // JWT token will be placed here
}

// --- Handler ---

// Handler holds dependencies for user HTTP handlers, like the user service.
type Handler struct {
	service Service // The user service interface
}

// NewHandler creates a new user Handler with the given service.
func NewHandler(service Service) *Handler {
	return &Handler{service: service}
}

// --- Handler Functions ---

func (h *Handler) handleRegisterUser(w http.ResponseWriter, r *http.Request) {
	var req RegisterUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request payload: "+err.Error())
		return
	}
	defer r.Body.Close()

	user, err := h.service.RegisterUser(req.Username, req.Email, req.Password)
	if err != nil {
		// Map service errors to appropriate HTTP status codes
		var httpStatus int
		switch {
		case errors.Is(err, ErrEmailTaken), errors.Is(err, ErrUsernameTaken):
			httpStatus = http.StatusConflict
		case errors.Is(err, ErrInvalidEmailFormat), errors.Is(err, ErrPasswordTooShort), errors.Is(err, ErrPasswordComplexity), errors.Is(err, ErrValidation):
			httpStatus = http.StatusBadRequest
		default:
			// Log the internal error for debugging
			// log.Printf("Internal server error during user registration: %v", err) // Requires logger
			httpStatus = http.StatusInternalServerError
			// Do not expose internal error details to the client for security reasons
			respondWithError(w, httpStatus, "An unexpected error occurred while registering the user.")
			return
		}
		respondWithError(w, httpStatus, err.Error())
		return
	}

	userResp := toUserResponse(user)
	respondWithJSON(w, http.StatusCreated, userResp)
}

func (h *Handler) handleLoginUser(w http.ResponseWriter, r *http.Request) {
	var req LoginUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request payload: "+err.Error())
		return
	}
	defer r.Body.Close()

	user, err := h.service.AuthenticateUser(req.Email, req.Password)
	if err != nil {
		if errors.Is(err, ErrInvalidCredentials) {
			respondWithError(w, http.StatusUnauthorized, err.Error())
		} else {
			// log.Printf("Internal server error during user login: %v", err) // Requires logger
			respondWithError(w, http.StatusInternalServerError, "An unexpected error occurred during login.")
		}
		return
	}

	userResp := toUserResponse(user)
	
	// TODO: Implement JWT generation and return it in the AuthResponse
	// For now, a placeholder token is used.
	token := "placeholder_jwt_token_for_" + user.ID

	respondWithJSON(w, http.StatusOK, AuthResponse{User: userResp, Token: token})
}

func (h *Handler) handleGetUserByID(w http.ResponseWriter, r *http.Request) {
	// TODO: Implement authentication middleware to protect this endpoint.
	// The userID might come from the authenticated user's token (e.g., GET /users/me)
	// or an admin might be allowed to get any user by ID.

	userID := chi.URLParam(r, "userID")
	if userID == "" {
		respondWithError(w, http.StatusBadRequest, "User ID is missing in URL path.")
		return
	}

	user, err := h.service.GetUserByID(userID)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			respondWithError(w, http.StatusNotFound, err.Error())
		} else {
			// log.Printf("Internal server error getting user by ID %s: %v", userID, err) // Requires logger
			respondWithError(w, http.StatusInternalServerError, "Failed to retrieve user information.")
		}
		return
	}

	userResp := toUserResponse(user)
	respondWithJSON(w, http.StatusOK, userResp)
}

// toUserResponse converts a models.User to a UserResponse, ensuring consistent formatting.
func toUserResponse(user *models.User) UserResponse {
	return UserResponse{
		ID:        user.ID,
		Username:  user.Username,
		Email:     user.Email,
		CreatedAt: user.CreatedAt.UTC().Format(time.RFC3339Nano), // Using RFC3339Nano for more precision
		UpdatedAt: user.UpdatedAt.UTC().Format(time.RFC3339Nano),
	}
}

// --- Helper Functions for HTTP Responses ---
// These could be moved to a shared 'api/httputil' package later.

type ErrorResponse struct {
	Error   string `json:"error"`
	Details string `json:"details,omitempty"` // Optional field for more detailed error info (use with caution)
}

func respondWithError(w http.ResponseWriter, code int, message string, details ...string) {
	resp := ErrorResponse{Error: message}
	if len(details) > 0 {
		resp.Details = details[0]
	}
	respondWithJSON(w, code, resp)
}

func respondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	response, err := json.Marshal(payload)
	if err != nil {
		// If marshalling fails, log the error and send a generic server error to the client.
		// log.Printf("Critical error: Failed to marshal JSON response: %v. Payload: %+v", err, payload) // Requires logger
		// Avoid sending the payload details in the error message to the client for security.
		http.Error(w, `{"error":"An internal server error occurred while processing your request."}`, http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(code)
	_, _ = w.Write(response) // Best effort write, error handling here can be complex
} 