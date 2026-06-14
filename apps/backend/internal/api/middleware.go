package api

import (
	"context"
	"net/http"

	"github.com/kirillgalimov/roomtool/backend/internal/auth"
)

type contextKey string

const userIDKey contextKey = "user_id"

func UserIDFromContext(ctx context.Context) (string, bool) {
	id, ok := ctx.Value(userIDKey).(string)
	return id, ok
}

func (h *Handler) AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("access_token")
		if err != nil {
			writeJSON(w, http.StatusUnauthorized, ErrorResponse{Message: "unauthorized"})
			return
		}
		userID, err := auth.ValidateAccessToken(cookie.Value, h.jwtSecret)
		if err != nil {
			writeJSON(w, http.StatusUnauthorized, ErrorResponse{Message: "unauthorized"})
			return
		}
		ctx := context.WithValue(r.Context(), userIDKey, userID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

