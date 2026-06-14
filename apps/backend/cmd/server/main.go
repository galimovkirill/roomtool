package main

import (
	"context"
	"database/sql"
	"log/slog"
	"net/http"
	"os"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/kirillgalimov/roomtool/backend/internal/api"
	"github.com/kirillgalimov/roomtool/backend/internal/repository"
	"github.com/kirillgalimov/roomtool/backend/migrations"
)

func main() {
	ctx := context.Background()

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		slog.Error("DATABASE_URL is not set")
		os.Exit(1)
	}

	jwtSecret := []byte(os.Getenv("JWT_SECRET"))
	if len(jwtSecret) == 0 {
		slog.Error("JWT_SECRET is not set")
		os.Exit(1)
	}

	sqlDB, err := sql.Open("pgx", dsn)
	if err != nil {
		slog.Error("open database", "err", err)
		os.Exit(1)
	}
	defer sqlDB.Close()

	if err := sqlDB.PingContext(ctx); err != nil {
		slog.Error("ping database", "err", err)
		os.Exit(1)
	}

	if err := migrations.Run(ctx, sqlDB); err != nil {
		slog.Error("run migrations", "err", err)
		os.Exit(1)
	}

	scenes := repository.NewPostgresSceneRepository(sqlDB)
	users := repository.NewPostgresUserRepository(sqlDB)
	refreshTokens := repository.NewPostgresRefreshTokenRepository(sqlDB)
	h := api.NewHandler(scenes, users, refreshTokens, jwtSecret)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", h.HandleHealth)

	// Public auth routes
	mux.HandleFunc("POST /api/v1/auth/register", h.HandleRegister)
	mux.HandleFunc("POST /api/v1/auth/login", h.HandleLogin)
	mux.HandleFunc("POST /api/v1/auth/refresh", h.HandleRefresh)

	// Protected routes
	mux.Handle("POST /api/v1/auth/logout", h.AuthMiddleware(http.HandlerFunc(h.HandleLogout)))
	mux.Handle("GET /api/v1/auth/me", h.AuthMiddleware(http.HandlerFunc(h.HandleMe)))
	mux.Handle("GET /api/v1/scenes", h.AuthMiddleware(http.HandlerFunc(h.HandleListScenes)))
	mux.Handle("POST /api/v1/scenes", h.AuthMiddleware(http.HandlerFunc(h.HandleCreateScene)))
	mux.Handle("GET /api/v1/scenes/{id}", h.AuthMiddleware(http.HandlerFunc(h.HandleGetScene)))
	mux.Handle("PUT /api/v1/scenes/{id}", h.AuthMiddleware(http.HandlerFunc(h.HandleUpdateScene)))
	mux.Handle("PATCH /api/v1/scenes/{id}", h.AuthMiddleware(http.HandlerFunc(h.HandleRenameScene)))
	mux.Handle("DELETE /api/v1/scenes/{id}", h.AuthMiddleware(http.HandlerFunc(h.HandleDeleteScene)))
	mux.Handle("POST /api/v1/scenes/{id}/duplicate", h.AuthMiddleware(http.HandlerFunc(h.HandleDuplicateScene)))

	slog.Info("server starting", "port", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		slog.Error("server failed", "err", err)
		os.Exit(1)
	}
}
