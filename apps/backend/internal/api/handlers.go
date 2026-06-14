package api

import (
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"

	"github.com/kirillgalimov/roomtool/backend/internal/repository"
)

type Handler struct {
	scenes        repository.SceneRepository
	users         repository.UserRepository
	refreshTokens repository.RefreshTokenRepository
	jwtSecret     []byte
}

func NewHandler(
	scenes repository.SceneRepository,
	users repository.UserRepository,
	refreshTokens repository.RefreshTokenRepository,
	jwtSecret []byte,
) *Handler {
	return &Handler{
		scenes:        scenes,
		users:         users,
		refreshTokens: refreshTokens,
		jwtSecret:     jwtSecret,
	}
}

func (h *Handler) HandleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, HealthResponse{Status: "ok"})
}

func (h *Handler) HandleListScenes(w http.ResponseWriter, r *http.Request) {
	userID, _ := UserIDFromContext(r.Context())
	scenes, err := h.scenes.List(r.Context(), userID)
	if err != nil {
		slog.Error("list scenes", "err", err)
		writeJSON(w, http.StatusInternalServerError, ErrorResponse{Message: "internal error"})
		return
	}
	result := make([]SceneSummary, len(scenes))
	for i, s := range scenes {
		result[i] = SceneSummary{
			Id:        s.ID,
			Name:      s.Name,
			CreatedAt: s.CreatedAt,
			UpdatedAt: s.UpdatedAt,
		}
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *Handler) HandleCreateScene(w http.ResponseWriter, r *http.Request) {
	userID, _ := UserIDFromContext(r.Context())
	var body CreateSceneJSONRequestBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Message: "invalid JSON"})
		return
	}
	dataJSON, err := json.Marshal(body.Data)
	if err != nil {
		slog.Error("marshal scene data", "err", err)
		writeJSON(w, http.StatusInternalServerError, ErrorResponse{Message: "internal error"})
		return
	}
	scene, err := h.scenes.Create(r.Context(), userID, body.Name, dataJSON)
	if err != nil {
		slog.Error("create scene", "err", err)
		writeJSON(w, http.StatusInternalServerError, ErrorResponse{Message: "internal error"})
		return
	}
	resp, err := sceneToResponse(scene)
	if err != nil {
		slog.Error("build scene response", "err", err)
		writeJSON(w, http.StatusInternalServerError, ErrorResponse{Message: "internal error"})
		return
	}
	writeJSON(w, http.StatusCreated, resp)
}

func (h *Handler) HandleGetScene(w http.ResponseWriter, r *http.Request) {
	userID, _ := UserIDFromContext(r.Context())
	id := r.PathValue("id")
	scene, err := h.scenes.Get(r.Context(), id, userID)
	if errors.Is(err, repository.ErrNotFound) {
		writeJSON(w, http.StatusNotFound, ErrorResponse{Message: "scene not found"})
		return
	}
	if err != nil {
		slog.Error("get scene", "err", err)
		writeJSON(w, http.StatusInternalServerError, ErrorResponse{Message: "internal error"})
		return
	}
	resp, err := sceneToResponse(scene)
	if err != nil {
		slog.Error("build scene response", "err", err)
		writeJSON(w, http.StatusInternalServerError, ErrorResponse{Message: "internal error"})
		return
	}
	writeJSON(w, http.StatusOK, resp)
}

func (h *Handler) HandleUpdateScene(w http.ResponseWriter, r *http.Request) {
	userID, _ := UserIDFromContext(r.Context())
	id := r.PathValue("id")
	var body UpdateSceneJSONRequestBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Message: "invalid JSON"})
		return
	}
	dataJSON, err := json.Marshal(body.Data)
	if err != nil {
		slog.Error("marshal scene data", "err", err)
		writeJSON(w, http.StatusInternalServerError, ErrorResponse{Message: "internal error"})
		return
	}
	scene, err := h.scenes.Update(r.Context(), id, userID, body.Name, dataJSON)
	if errors.Is(err, repository.ErrNotFound) {
		writeJSON(w, http.StatusNotFound, ErrorResponse{Message: "scene not found"})
		return
	}
	if err != nil {
		slog.Error("update scene", "err", err)
		writeJSON(w, http.StatusInternalServerError, ErrorResponse{Message: "internal error"})
		return
	}
	resp, err := sceneToResponse(scene)
	if err != nil {
		slog.Error("build scene response", "err", err)
		writeJSON(w, http.StatusInternalServerError, ErrorResponse{Message: "internal error"})
		return
	}
	writeJSON(w, http.StatusOK, resp)
}

func (h *Handler) HandleDeleteScene(w http.ResponseWriter, r *http.Request) {
	userID, _ := UserIDFromContext(r.Context())
	id := r.PathValue("id")
	err := h.scenes.Delete(r.Context(), id, userID)
	if errors.Is(err, repository.ErrNotFound) {
		writeJSON(w, http.StatusNotFound, ErrorResponse{Message: "scene not found"})
		return
	}
	if err != nil {
		slog.Error("delete scene", "err", err)
		writeJSON(w, http.StatusInternalServerError, ErrorResponse{Message: "internal error"})
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func sceneToResponse(s *repository.Scene) (Scene, error) {
	var data SceneData
	if err := json.Unmarshal(s.Data, &data); err != nil {
		return Scene{}, fmt.Errorf("unmarshal scene data: %w", err)
	}
	return Scene{
		Id:        s.ID,
		Name:      s.Name,
		Data:      data,
		CreatedAt: s.CreatedAt,
		UpdatedAt: s.UpdatedAt,
	}, nil
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v) //nolint:errcheck
}
