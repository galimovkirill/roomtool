package repository_test

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"
	"testing"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/wait"

	"github.com/kirillgalimov/roomtool/backend/internal/repository"
	"github.com/kirillgalimov/roomtool/backend/migrations"
)

var (
	sharedDB   *sql.DB
	testUserID string
)

func TestMain(m *testing.M) {
	ctx := context.Background()

	pg, err := testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{
		ContainerRequest: testcontainers.ContainerRequest{
			Image: "postgres:17-alpine",
			Env: map[string]string{
				"POSTGRES_USER":     "test",
				"POSTGRES_PASSWORD": "test",
				"POSTGRES_DB":       "testdb",
			},
			ExposedPorts: []string{"5432/tcp"},
			WaitingFor: wait.ForLog("database system is ready to accept connections").
				WithOccurrence(2),
		},
		Started: true,
	})
	if err != nil {
		log.Fatalf("start postgres container: %v", err)
	}
	defer pg.Terminate(ctx) //nolint:errcheck

	host, err := pg.Host(ctx)
	if err != nil {
		log.Fatalf("get host: %v", err)
	}
	port, err := pg.MappedPort(ctx, "5432")
	if err != nil {
		log.Fatalf("get port: %v", err)
	}

	dsn := fmt.Sprintf("postgres://test:test@%s:%s/testdb?sslmode=disable", host, port.Port())
	sharedDB, err = sql.Open("pgx", dsn)
	if err != nil {
		log.Fatalf("open db: %v", err)
	}
	defer sharedDB.Close()

	if err := migrations.Run(ctx, sharedDB); err != nil {
		log.Fatalf("run migrations: %v", err)
	}

	if err := sharedDB.QueryRowContext(ctx,
		`INSERT INTO users (email, password_hash) VALUES ('test@example.com', 'fakehash') RETURNING id`,
	).Scan(&testUserID); err != nil {
		log.Fatalf("create test user: %v", err)
	}

	os.Exit(m.Run())
}

// newRepo creates a repository and truncates the scenes table for isolation.
func newRepo(t *testing.T) *repository.PostgresSceneRepository {
	t.Helper()
	if _, err := sharedDB.ExecContext(context.Background(), "TRUNCATE TABLE scenes"); err != nil {
		t.Fatalf("truncate scenes: %v", err)
	}
	return repository.NewPostgresSceneRepository(sharedDB)
}

var testData = json.RawMessage(`{"version":1,"items":[],"groups":[]}`)

func TestCreate(t *testing.T) {
	repo := newRepo(t)
	ctx := context.Background()

	s, err := repo.Create(ctx, testUserID, "Test Scene", testData)
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	if s.ID == "" {
		t.Error("expected non-empty ID")
	}
	if s.Name != "Test Scene" {
		t.Errorf("name: got %q, want %q", s.Name, "Test Scene")
	}
	var got map[string]any
	if err := json.Unmarshal(s.Data, &got); err != nil {
		t.Fatalf("unmarshal data: %v", err)
	}
	if got["version"] != float64(1) {
		t.Errorf("data version: got %v, want 1", got["version"])
	}
}

func TestGet(t *testing.T) {
	repo := newRepo(t)
	ctx := context.Background()

	created, err := repo.Create(ctx, testUserID, "My Scene", testData)
	if err != nil {
		t.Fatalf("create: %v", err)
	}

	got, err := repo.Get(ctx, created.ID, testUserID)
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if got.ID != created.ID {
		t.Errorf("id: got %q, want %q", got.ID, created.ID)
	}
	if got.Name != created.Name {
		t.Errorf("name: got %q, want %q", got.Name, created.Name)
	}
}

func TestGetNotFound(t *testing.T) {
	repo := newRepo(t)

	_, err := repo.Get(context.Background(), "00000000-0000-0000-0000-000000000000", testUserID)
	if !errors.Is(err, repository.ErrNotFound) {
		t.Errorf("expected ErrNotFound, got %v", err)
	}
}

func TestList(t *testing.T) {
	repo := newRepo(t)
	ctx := context.Background()

	repo.Create(ctx, testUserID, "Scene A", testData) //nolint:errcheck
	repo.Create(ctx, testUserID, "Scene B", testData) //nolint:errcheck

	scenes, err := repo.List(ctx, testUserID)
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if len(scenes) != 2 {
		t.Errorf("count: got %d, want 2", len(scenes))
	}
}

func TestListEmpty(t *testing.T) {
	repo := newRepo(t)

	scenes, err := repo.List(context.Background(), testUserID)
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if scenes == nil {
		t.Error("expected non-nil slice for empty result")
	}
	if len(scenes) != 0 {
		t.Errorf("count: got %d, want 0", len(scenes))
	}
}

func TestUpdate(t *testing.T) {
	repo := newRepo(t)
	ctx := context.Background()

	created, err := repo.Create(ctx, testUserID, "Original", testData)
	if err != nil {
		t.Fatalf("create: %v", err)
	}

	// Ensure clock advances so updated_at > created_at.
	time.Sleep(2 * time.Millisecond)

	newData := json.RawMessage(`{"version":1,"items":[{"id":"abc"}],"groups":[]}`)
	updated, err := repo.Update(ctx, created.ID, testUserID, "Updated", newData)
	if err != nil {
		t.Fatalf("update: %v", err)
	}
	if updated.Name != "Updated" {
		t.Errorf("name: got %q, want %q", updated.Name, "Updated")
	}
	if !updated.UpdatedAt.After(created.CreatedAt) {
		t.Errorf("expected updated_at (%v) to be after created_at (%v)", updated.UpdatedAt, created.CreatedAt)
	}

	var got map[string]any
	if err := json.Unmarshal(updated.Data, &got); err != nil {
		t.Fatalf("unmarshal data: %v", err)
	}
	items, ok := got["items"].([]any)
	if !ok || len(items) != 1 {
		t.Errorf("expected 1 item in updated data, got %v", got["items"])
	}
}

func TestUpdateNotFound(t *testing.T) {
	repo := newRepo(t)

	_, err := repo.Update(context.Background(), "00000000-0000-0000-0000-000000000000", testUserID, "x", testData)
	if !errors.Is(err, repository.ErrNotFound) {
		t.Errorf("expected ErrNotFound, got %v", err)
	}
}

func TestDelete(t *testing.T) {
	repo := newRepo(t)
	ctx := context.Background()

	created, err := repo.Create(ctx, testUserID, "To Delete", testData)
	if err != nil {
		t.Fatalf("create: %v", err)
	}

	if err := repo.Delete(ctx, created.ID, testUserID); err != nil {
		t.Fatalf("delete: %v", err)
	}

	_, err = repo.Get(ctx, created.ID, testUserID)
	if !errors.Is(err, repository.ErrNotFound) {
		t.Errorf("expected ErrNotFound after delete, got %v", err)
	}
}

func TestDeleteNotFound(t *testing.T) {
	repo := newRepo(t)

	err := repo.Delete(context.Background(), "00000000-0000-0000-0000-000000000000", testUserID)
	if !errors.Is(err, repository.ErrNotFound) {
		t.Errorf("expected ErrNotFound, got %v", err)
	}
}

func TestUpdateName(t *testing.T) {
	repo := newRepo(t)
	ctx := context.Background()

	created, err := repo.Create(ctx, testUserID, "Original Name", testData)
	if err != nil {
		t.Fatalf("create: %v", err)
	}

	renamed, err := repo.UpdateName(ctx, created.ID, testUserID, "New Name")
	if err != nil {
		t.Fatalf("update name: %v", err)
	}
	if renamed.Name != "New Name" {
		t.Errorf("name: got %q, want %q", renamed.Name, "New Name")
	}
	if renamed.ID != created.ID {
		t.Errorf("id changed: got %q, want %q", renamed.ID, created.ID)
	}
}

func TestUpdateNameNotFound(t *testing.T) {
	repo := newRepo(t)

	_, err := repo.UpdateName(context.Background(), "00000000-0000-0000-0000-000000000000", testUserID, "x")
	if !errors.Is(err, repository.ErrNotFound) {
		t.Errorf("expected ErrNotFound, got %v", err)
	}
}

func TestUpdateNameWrongUser(t *testing.T) {
	repo := newRepo(t)
	ctx := context.Background()

	created, err := repo.Create(ctx, testUserID, "My Scene", testData)
	if err != nil {
		t.Fatalf("create: %v", err)
	}

	_, err = repo.UpdateName(ctx, created.ID, "00000000-0000-0000-0000-000000000001", "Hacked")
	if !errors.Is(err, repository.ErrNotFound) {
		t.Errorf("expected ErrNotFound for wrong user, got %v", err)
	}
}

func TestDuplicate(t *testing.T) {
	repo := newRepo(t)
	ctx := context.Background()

	orig, err := repo.Create(ctx, testUserID, "Original", testData)
	if err != nil {
		t.Fatalf("create: %v", err)
	}

	dup, err := repo.Duplicate(ctx, orig.ID, testUserID)
	if err != nil {
		t.Fatalf("duplicate: %v", err)
	}
	if dup.Name != "Копия Original" {
		t.Errorf("name: got %q, want %q", dup.Name, "Копия Original")
	}
	if dup.ID == orig.ID {
		t.Error("duplicate should have a different ID")
	}

	// original untouched
	got, err := repo.Get(ctx, orig.ID, testUserID)
	if err != nil {
		t.Fatalf("get original: %v", err)
	}
	if got.Name != "Original" {
		t.Errorf("original name changed: got %q", got.Name)
	}
}

func TestDuplicateNotFound(t *testing.T) {
	repo := newRepo(t)

	_, err := repo.Duplicate(context.Background(), "00000000-0000-0000-0000-000000000000", testUserID)
	if !errors.Is(err, repository.ErrNotFound) {
		t.Errorf("expected ErrNotFound, got %v", err)
	}
}
