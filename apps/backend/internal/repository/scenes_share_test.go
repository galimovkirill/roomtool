package repository_test

import (
	"context"
	"errors"
	"testing"

	"github.com/kirillgalimov/roomtool/backend/internal/repository"
)

func TestEnableShare_CreatesToken(t *testing.T) {
	repo := newRepo(t)
	ctx := context.Background()

	s, err := repo.Create(ctx, testUserID, "Share Test", testData)
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	if s.ShareToken != nil {
		t.Error("expected nil share_token after create")
	}

	token, err := repo.EnableShare(ctx, s.ID, testUserID)
	if err != nil {
		t.Fatalf("enable share: %v", err)
	}
	if token == "" {
		t.Error("expected non-empty token")
	}
}

func TestEnableShare_Idempotent(t *testing.T) {
	repo := newRepo(t)
	ctx := context.Background()

	s, err := repo.Create(ctx, testUserID, "Share Idempotent", testData)
	if err != nil {
		t.Fatalf("create: %v", err)
	}

	token1, err := repo.EnableShare(ctx, s.ID, testUserID)
	if err != nil {
		t.Fatalf("enable share first: %v", err)
	}
	token2, err := repo.EnableShare(ctx, s.ID, testUserID)
	if err != nil {
		t.Fatalf("enable share second: %v", err)
	}
	if token1 != token2 {
		t.Errorf("expected same token on repeat call: got %q and %q", token1, token2)
	}
}

func TestEnableShare_WrongUser(t *testing.T) {
	repo := newRepo(t)
	ctx := context.Background()

	s, err := repo.Create(ctx, testUserID, "Other User", testData)
	if err != nil {
		t.Fatalf("create: %v", err)
	}

	_, err = repo.EnableShare(ctx, s.ID, "00000000-0000-0000-0000-000000000001")
	if !errors.Is(err, repository.ErrNotFound) {
		t.Errorf("expected ErrNotFound for wrong user, got %v", err)
	}
}

func TestDisableShare(t *testing.T) {
	repo := newRepo(t)
	ctx := context.Background()

	s, err := repo.Create(ctx, testUserID, "Disable Share", testData)
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	if _, err := repo.EnableShare(ctx, s.ID, testUserID); err != nil {
		t.Fatalf("enable share: %v", err)
	}

	if err := repo.DisableShare(ctx, s.ID, testUserID); err != nil {
		t.Fatalf("disable share: %v", err)
	}

	got, err := repo.Get(ctx, s.ID, testUserID)
	if err != nil {
		t.Fatalf("get after disable: %v", err)
	}
	if got.ShareToken != nil {
		t.Errorf("expected nil share_token after disable, got %q", *got.ShareToken)
	}
}

func TestGetByShareToken(t *testing.T) {
	repo := newRepo(t)
	ctx := context.Background()

	s, err := repo.Create(ctx, testUserID, "Public Scene", testData)
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	token, err := repo.EnableShare(ctx, s.ID, testUserID)
	if err != nil {
		t.Fatalf("enable share: %v", err)
	}

	got, err := repo.GetByShareToken(ctx, token)
	if err != nil {
		t.Fatalf("get by share token: %v", err)
	}
	if got.ID != s.ID {
		t.Errorf("id: got %q, want %q", got.ID, s.ID)
	}
	if got.ShareToken == nil || *got.ShareToken != token {
		t.Errorf("share_token: got %v, want %q", got.ShareToken, token)
	}
}

func TestGetByShareToken_NotFound(t *testing.T) {
	repo := newRepo(t)

	_, err := repo.GetByShareToken(context.Background(), "nonexistent-token")
	if !errors.Is(err, repository.ErrNotFound) {
		t.Errorf("expected ErrNotFound, got %v", err)
	}
}
