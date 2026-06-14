package main

import (
	"log/slog"
	"net/http"
	"os"

	"github.com/kirillgalimov/roomtool/backend/internal/api"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", api.HandleHealth)
	mux.HandleFunc("GET /api/v1/scenes", api.HandleListScenes)
	mux.HandleFunc("POST /api/v1/scenes", api.HandleCreateScene)
	mux.HandleFunc("GET /api/v1/scenes/{id}", api.HandleGetScene)
	mux.HandleFunc("PUT /api/v1/scenes/{id}", api.HandleUpdateScene)
	mux.HandleFunc("DELETE /api/v1/scenes/{id}", api.HandleDeleteScene)

	slog.Info("server starting", "port", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		slog.Error("server failed", "err", err)
		os.Exit(1)
	}
}
