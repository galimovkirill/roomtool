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

	repo := repository.NewPostgresSceneRepository(sqlDB)
	h := api.NewHandler(repo)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", h.HandleHealth)
	mux.HandleFunc("GET /api/v1/scenes", h.HandleListScenes)
	mux.HandleFunc("POST /api/v1/scenes", h.HandleCreateScene)
	mux.HandleFunc("GET /api/v1/scenes/{id}", h.HandleGetScene)
	mux.HandleFunc("PUT /api/v1/scenes/{id}", h.HandleUpdateScene)
	mux.HandleFunc("DELETE /api/v1/scenes/{id}", h.HandleDeleteScene)

	slog.Info("server starting", "port", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		slog.Error("server failed", "err", err)
		os.Exit(1)
	}
}
