package api

import (
	"encoding/json"
	"net/http"
)

func HandleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, HealthResponse{Status: "ok"})
}

func HandleListScenes(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, []SceneSummary{})
}

func HandleCreateScene(w http.ResponseWriter, r *http.Request) {
	var body CreateSceneJSONRequestBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Message: "invalid JSON"})
		return
	}
	// TODO: persist to DB
	writeJSON(w, http.StatusNotImplemented, ErrorResponse{Message: "not implemented"})
}

func HandleGetScene(w http.ResponseWriter, r *http.Request) {
	// TODO: fetch from DB by r.PathValue("id")
	writeJSON(w, http.StatusNotImplemented, ErrorResponse{Message: "not implemented"})
}

func HandleUpdateScene(w http.ResponseWriter, r *http.Request) {
	var body UpdateSceneJSONRequestBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Message: "invalid JSON"})
		return
	}
	// TODO: update in DB by r.PathValue("id")
	writeJSON(w, http.StatusNotImplemented, ErrorResponse{Message: "not implemented"})
}

func HandleDeleteScene(w http.ResponseWriter, r *http.Request) {
	// TODO: delete from DB by r.PathValue("id")
	writeJSON(w, http.StatusNotImplemented, ErrorResponse{Message: "not implemented"})
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
