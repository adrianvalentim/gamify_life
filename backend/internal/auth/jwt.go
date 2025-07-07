package auth

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// Note: This secret should be loaded from a secure configuration (e.g., environment variables)
// and should be a long, complex, randomly generated string.
var jwtSecret = []byte("a_very_secret_key_that_should_be_in_env")

// Claims defines the structure of the JWT claims.
type Claims struct {
	UserID string `json:"user_id"`
	jwt.RegisteredClaims
}

// GenerateToken creates a new JWT for a given user ID.
func GenerateToken(userID string) (string, error) {
	// Token expires in 24 hours
	expirationTime := time.Now().Add(24 * time.Hour)

	claims := &Claims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			// In JWT, the expiry time is expressed in Unix time
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "gamify_journal",
			Subject:   "user_login",
		},
	}

	// Create token with claims
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign the token with the secret
	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		return "", err
	}

	return tokenString, nil
}
