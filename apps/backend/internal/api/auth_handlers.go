package api

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"time"

	openapi_types "github.com/oapi-codegen/runtime/types"

	"github.com/kirillgalimov/roomtool/backend/internal/auth"
	"github.com/kirillgalimov/roomtool/backend/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

func (h *Handler) HandleRegister(w http.ResponseWriter, r *http.Request) {
	var body RegisterJSONRequestBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Message: "invalid JSON"})
		return
	}
	if len(body.Password) < 8 {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Message: "password must be at least 8 characters"})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(body.Password), bcrypt.DefaultCost)
	if err != nil {
		slog.Error("hash password", "err", err)
		writeJSON(w, http.StatusInternalServerError, ErrorResponse{Message: "internal error"})
		return
	}

	user, err := h.users.Create(r.Context(), string(body.Email), string(hash))
	if errors.Is(err, repository.ErrAlreadyExists) {
		writeJSON(w, http.StatusConflict, ErrorResponse{Message: "email already registered"})
		return
	}
	if err != nil {
		slog.Error("create user", "err", err)
		writeJSON(w, http.StatusInternalServerError, ErrorResponse{Message: "internal error"})
		return
	}

	if err := h.issueTokens(w, r, user.ID); err != nil {
		slog.Error("issue tokens", "err", err)
		writeJSON(w, http.StatusInternalServerError, ErrorResponse{Message: "internal error"})
		return
	}

	writeJSON(w, http.StatusCreated, AuthResponse{User: User{Id: user.ID, Email: openapi_types.Email(user.Email)}})
}

func (h *Handler) HandleLogin(w http.ResponseWriter, r *http.Request) {
	var body LoginJSONRequestBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Message: "invalid JSON"})
		return
	}

	user, err := h.users.GetByEmail(r.Context(), string(body.Email))
	if errors.Is(err, repository.ErrNotFound) {
		writeJSON(w, http.StatusUnauthorized, ErrorResponse{Message: "invalid credentials"})
		return
	}
	if err != nil {
		slog.Error("get user by email", "err", err)
		writeJSON(w, http.StatusInternalServerError, ErrorResponse{Message: "internal error"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(body.Password)); err != nil {
		writeJSON(w, http.StatusUnauthorized, ErrorResponse{Message: "invalid credentials"})
		return
	}

	if err := h.issueTokens(w, r, user.ID); err != nil {
		slog.Error("issue tokens", "err", err)
		writeJSON(w, http.StatusInternalServerError, ErrorResponse{Message: "internal error"})
		return
	}

	writeJSON(w, http.StatusOK, AuthResponse{User: User{Id: user.ID, Email: openapi_types.Email(user.Email)}})
}

func (h *Handler) HandleLogout(w http.ResponseWriter, r *http.Request) {
	userID, _ := UserIDFromContext(r.Context())
	if err := h.refreshTokens.DeleteAllForUser(r.Context(), userID); err != nil {
		slog.Error("delete refresh tokens on logout", "err", err)
	}
	h.clearAuthCookies(w)
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) HandleRefresh(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("refresh_token")
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, ErrorResponse{Message: "unauthorized"})
		return
	}

	tokenHash := repository.HashToken(cookie.Value)
	rt, err := h.refreshTokens.GetByTokenHash(r.Context(), tokenHash)
	if errors.Is(err, repository.ErrNotFound) {
		writeJSON(w, http.StatusUnauthorized, ErrorResponse{Message: "unauthorized"})
		return
	}
	if err != nil {
		slog.Error("get refresh token", "err", err)
		writeJSON(w, http.StatusInternalServerError, ErrorResponse{Message: "internal error"})
		return
	}

	if time.Now().After(rt.ExpiresAt) {
		_ = h.refreshTokens.Delete(r.Context(), tokenHash)
		h.clearAuthCookies(w)
		writeJSON(w, http.StatusUnauthorized, ErrorResponse{Message: "refresh token expired"})
		return
	}

	// Token rotation: delete old, issue new pair.
	if err := h.refreshTokens.Delete(r.Context(), tokenHash); err != nil {
		slog.Error("delete old refresh token", "err", err)
		writeJSON(w, http.StatusInternalServerError, ErrorResponse{Message: "internal error"})
		return
	}

	if err := h.issueTokens(w, r, rt.UserID); err != nil {
		slog.Error("issue tokens on refresh", "err", err)
		writeJSON(w, http.StatusInternalServerError, ErrorResponse{Message: "internal error"})
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) HandleMe(w http.ResponseWriter, r *http.Request) {
	userID, _ := UserIDFromContext(r.Context())

	user, err := h.users.GetByID(r.Context(), userID)
	if errors.Is(err, repository.ErrNotFound) {
		writeJSON(w, http.StatusUnauthorized, ErrorResponse{Message: "unauthorized"})
		return
	}
	if err != nil {
		slog.Error("get user by id", "err", err)
		writeJSON(w, http.StatusInternalServerError, ErrorResponse{Message: "internal error"})
		return
	}

	writeJSON(w, http.StatusOK, AuthResponse{User: User{Id: user.ID, Email: openapi_types.Email(user.Email)}})
}

func (h *Handler) issueTokens(w http.ResponseWriter, r *http.Request, userID string) error {
	accessToken, err := auth.GenerateAccessToken(userID, h.jwtSecret)
	if err != nil {
		return err
	}

	refreshToken, err := auth.GenerateRefreshToken()
	if err != nil {
		return err
	}

	expiresAt := time.Now().Add(auth.RefreshTokenDuration)
	if err := h.refreshTokens.Create(r.Context(), userID, repository.HashToken(refreshToken), expiresAt); err != nil {
		return err
	}

	secure := r.TLS != nil
	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    accessToken,
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteLaxMode,
		Path:     "/",
		MaxAge:   int(auth.AccessTokenDuration.Seconds()),
	})
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteLaxMode,
		Path:     "/api/v1/auth/refresh",
		MaxAge:   int(auth.RefreshTokenDuration.Seconds()),
	})
	return nil
}

func (h *Handler) clearAuthCookies(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     "access_token",
		Value:    "",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Path:     "/",
		MaxAge:   -1,
	})
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    "",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Path:     "/api/v1/auth/refresh",
		MaxAge:   -1,
	})
}
