package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"time"
)

var ErrNotFound = errors.New("not found")

type Scene struct {
	ID        string
	Name      string
	Data      json.RawMessage
	CreatedAt time.Time
	UpdatedAt time.Time
}

type SceneRepository interface {
	Create(ctx context.Context, name string, data json.RawMessage) (*Scene, error)
	Get(ctx context.Context, id string) (*Scene, error)
	List(ctx context.Context) ([]Scene, error)
	Update(ctx context.Context, id string, name string, data json.RawMessage) (*Scene, error)
	Delete(ctx context.Context, id string) error
}

type PostgresSceneRepository struct {
	db *sql.DB
}

func NewPostgresSceneRepository(db *sql.DB) *PostgresSceneRepository {
	return &PostgresSceneRepository{db: db}
}

func (r *PostgresSceneRepository) Create(ctx context.Context, name string, data json.RawMessage) (*Scene, error) {
	s := &Scene{}
	var rawData []byte
	err := r.db.QueryRowContext(ctx,
		`INSERT INTO scenes (name, data) VALUES ($1, $2)
		 RETURNING id, name, data, created_at, updated_at`,
		name, []byte(data),
	).Scan(&s.ID, &s.Name, &rawData, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("create scene: %w", err)
	}
	s.Data = json.RawMessage(rawData)
	return s, nil
}

func (r *PostgresSceneRepository) Get(ctx context.Context, id string) (*Scene, error) {
	s := &Scene{}
	var rawData []byte
	err := r.db.QueryRowContext(ctx,
		`SELECT id, name, data, created_at, updated_at FROM scenes WHERE id = $1`,
		id,
	).Scan(&s.ID, &s.Name, &rawData, &s.CreatedAt, &s.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get scene: %w", err)
	}
	s.Data = json.RawMessage(rawData)
	return s, nil
}

func (r *PostgresSceneRepository) List(ctx context.Context) ([]Scene, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, name, data, created_at, updated_at FROM scenes ORDER BY created_at DESC`,
	)
	if err != nil {
		return nil, fmt.Errorf("list scenes: %w", err)
	}
	defer rows.Close()

	scenes := []Scene{}
	for rows.Next() {
		var s Scene
		var rawData []byte
		if err := rows.Scan(&s.ID, &s.Name, &rawData, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan scene: %w", err)
		}
		s.Data = json.RawMessage(rawData)
		scenes = append(scenes, s)
	}
	return scenes, rows.Err()
}

func (r *PostgresSceneRepository) Update(ctx context.Context, id string, name string, data json.RawMessage) (*Scene, error) {
	s := &Scene{}
	var rawData []byte
	err := r.db.QueryRowContext(ctx,
		`UPDATE scenes SET name = $1, data = $2 WHERE id = $3
		 RETURNING id, name, data, created_at, updated_at`,
		name, []byte(data), id,
	).Scan(&s.ID, &s.Name, &rawData, &s.CreatedAt, &s.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update scene: %w", err)
	}
	s.Data = json.RawMessage(rawData)
	return s, nil
}

func (r *PostgresSceneRepository) Delete(ctx context.Context, id string) error {
	result, err := r.db.ExecContext(ctx, `DELETE FROM scenes WHERE id = $1`, id)
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
