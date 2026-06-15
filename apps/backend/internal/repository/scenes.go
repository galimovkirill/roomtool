package repository

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"time"
)

var (
	ErrNotFound      = errors.New("not found")
	ErrAlreadyExists = errors.New("already exists")
)

type Scene struct {
	ID         string
	UserID     string
	Name       string
	Data       json.RawMessage
	ShareToken *string
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

type SceneRepository interface {
	Create(ctx context.Context, userID, name string, data json.RawMessage) (*Scene, error)
	Get(ctx context.Context, id, userID string) (*Scene, error)
	List(ctx context.Context, userID string) ([]Scene, error)
	Update(ctx context.Context, id, userID, name string, data json.RawMessage) (*Scene, error)
	UpdateName(ctx context.Context, id, userID, name string) (*Scene, error)
	Duplicate(ctx context.Context, id, userID string) (*Scene, error)
	Delete(ctx context.Context, id, userID string) error
	EnableShare(ctx context.Context, id, userID string) (shareToken string, err error)
	DisableShare(ctx context.Context, id, userID string) error
	GetByShareToken(ctx context.Context, token string) (*Scene, error)
}

func generateShareToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

type PostgresSceneRepository struct {
	db *sql.DB
}

func NewPostgresSceneRepository(db *sql.DB) *PostgresSceneRepository {
	return &PostgresSceneRepository{db: db}
}

func (r *PostgresSceneRepository) Create(ctx context.Context, userID, name string, data json.RawMessage) (*Scene, error) {
	s := &Scene{}
	var rawData []byte
	var uid sql.NullString
	var shareToken sql.NullString
	err := r.db.QueryRowContext(ctx,
		`INSERT INTO scenes (user_id, name, data) VALUES ($1, $2, $3)
		 RETURNING id, user_id, name, data, share_token, created_at, updated_at`,
		userID, name, []byte(data),
	).Scan(&s.ID, &uid, &s.Name, &rawData, &shareToken, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("create scene: %w", err)
	}
	s.UserID = uid.String
	s.Data = json.RawMessage(rawData)
	if shareToken.Valid {
		s.ShareToken = &shareToken.String
	}
	return s, nil
}

func (r *PostgresSceneRepository) Get(ctx context.Context, id, userID string) (*Scene, error) {
	s := &Scene{}
	var rawData []byte
	var uid sql.NullString
	var shareToken sql.NullString
	err := r.db.QueryRowContext(ctx,
		`SELECT id, user_id, name, data, share_token, created_at, updated_at
		 FROM scenes WHERE id = $1 AND user_id = $2`,
		id, userID,
	).Scan(&s.ID, &uid, &s.Name, &rawData, &shareToken, &s.CreatedAt, &s.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get scene: %w", err)
	}
	s.UserID = uid.String
	s.Data = json.RawMessage(rawData)
	if shareToken.Valid {
		s.ShareToken = &shareToken.String
	}
	return s, nil
}

func (r *PostgresSceneRepository) List(ctx context.Context, userID string) ([]Scene, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, user_id, name, data, share_token, created_at, updated_at
		 FROM scenes WHERE user_id = $1 ORDER BY created_at DESC`,
		userID,
	)
	if err != nil {
		return nil, fmt.Errorf("list scenes: %w", err)
	}
	defer rows.Close()

	scenes := []Scene{}
	for rows.Next() {
		var s Scene
		var rawData []byte
		var uid sql.NullString
		var shareToken sql.NullString
		if err := rows.Scan(&s.ID, &uid, &s.Name, &rawData, &shareToken, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan scene: %w", err)
		}
		s.UserID = uid.String
		s.Data = json.RawMessage(rawData)
		if shareToken.Valid {
			s.ShareToken = &shareToken.String
		}
		scenes = append(scenes, s)
	}
	return scenes, rows.Err()
}

func (r *PostgresSceneRepository) Update(ctx context.Context, id, userID, name string, data json.RawMessage) (*Scene, error) {
	s := &Scene{}
	var rawData []byte
	var uid sql.NullString
	var shareToken sql.NullString
	err := r.db.QueryRowContext(ctx,
		`UPDATE scenes SET name = $1, data = $2
		 WHERE id = $3 AND user_id = $4
		 RETURNING id, user_id, name, data, share_token, created_at, updated_at`,
		name, []byte(data), id, userID,
	).Scan(&s.ID, &uid, &s.Name, &rawData, &shareToken, &s.CreatedAt, &s.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update scene: %w", err)
	}
	s.UserID = uid.String
	s.Data = json.RawMessage(rawData)
	if shareToken.Valid {
		s.ShareToken = &shareToken.String
	}
	return s, nil
}

func (r *PostgresSceneRepository) UpdateName(ctx context.Context, id, userID, name string) (*Scene, error) {
	s := &Scene{}
	var rawData []byte
	var uid sql.NullString
	var shareToken sql.NullString
	err := r.db.QueryRowContext(ctx,
		`UPDATE scenes SET name = $1
		 WHERE id = $2 AND user_id = $3
		 RETURNING id, user_id, name, data, share_token, created_at, updated_at`,
		name, id, userID,
	).Scan(&s.ID, &uid, &s.Name, &rawData, &shareToken, &s.CreatedAt, &s.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update scene name: %w", err)
	}
	s.UserID = uid.String
	s.Data = json.RawMessage(rawData)
	if shareToken.Valid {
		s.ShareToken = &shareToken.String
	}
	return s, nil
}

func (r *PostgresSceneRepository) Duplicate(ctx context.Context, id, userID string) (*Scene, error) {
	s := &Scene{}
	var rawData []byte
	var uid sql.NullString
	var shareToken sql.NullString
	err := r.db.QueryRowContext(ctx,
		`INSERT INTO scenes (user_id, name, data)
		 SELECT user_id, 'Копия ' || name, data FROM scenes WHERE id = $1 AND user_id = $2
		 RETURNING id, user_id, name, data, share_token, created_at, updated_at`,
		id, userID,
	).Scan(&s.ID, &uid, &s.Name, &rawData, &shareToken, &s.CreatedAt, &s.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("duplicate scene: %w", err)
	}
	s.UserID = uid.String
	s.Data = json.RawMessage(rawData)
	if shareToken.Valid {
		s.ShareToken = &shareToken.String
	}
	return s, nil
}

func (r *PostgresSceneRepository) Delete(ctx context.Context, id, userID string) error {
	result, err := r.db.ExecContext(ctx,
		`DELETE FROM scenes WHERE id = $1 AND user_id = $2`,
		id, userID,
	)
	if err != nil {
		return fmt.Errorf("delete scene: %w", err)
	}
	n, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("rows affected: %w", err)
	}
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *PostgresSceneRepository) EnableShare(ctx context.Context, id, userID string) (string, error) {
	token, err := generateShareToken()
	if err != nil {
		return "", fmt.Errorf("generate share token: %w", err)
	}
	var result sql.NullString
	err = r.db.QueryRowContext(ctx,
		`UPDATE scenes SET share_token = COALESCE(share_token, $1)
		 WHERE id = $2 AND user_id = $3
		 RETURNING share_token`,
		token, id, userID,
	).Scan(&result)
	if errors.Is(err, sql.ErrNoRows) {
		return "", ErrNotFound
	}
	if err != nil {
		return "", fmt.Errorf("enable share: %w", err)
	}
	return result.String, nil
}

func (r *PostgresSceneRepository) DisableShare(ctx context.Context, id, userID string) error {
	result, err := r.db.ExecContext(ctx,
		`UPDATE scenes SET share_token = NULL WHERE id = $1 AND user_id = $2`,
		id, userID,
	)
	if err != nil {
		return fmt.Errorf("disable share: %w", err)
	}
	n, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("rows affected: %w", err)
	}
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *PostgresSceneRepository) GetByShareToken(ctx context.Context, token string) (*Scene, error) {
	s := &Scene{}
	var rawData []byte
	var uid sql.NullString
	var shareToken sql.NullString
	err := r.db.QueryRowContext(ctx,
		`SELECT id, user_id, name, data, share_token, created_at, updated_at
		 FROM scenes WHERE share_token = $1`,
		token,
	).Scan(&s.ID, &uid, &s.Name, &rawData, &shareToken, &s.CreatedAt, &s.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get by share token: %w", err)
	}
	s.UserID = uid.String
	s.Data = json.RawMessage(rawData)
	if shareToken.Valid {
		s.ShareToken = &shareToken.String
	}
	return s, nil
}
