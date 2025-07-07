package user

import (
	"github.com/adrianvalentim/gamify_journal/internal/auth"
	"github.com/go-chi/chi/v5"
)

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Post("/register", h.HandleRegisterUser)
	r.Post("/login", h.HandleLoginUser)

	r.Group(func(r chi.Router) {
		r.Use(auth.AuthMiddleware)

		r.Get("/users/me", h.HandleGetMe)
	})
}
