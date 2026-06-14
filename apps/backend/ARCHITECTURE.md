# Backend — Архитектура

> Соглашения и workflow добавления эндпоинтов — в [CLAUDE.md](CLAUDE.md).

---

## Схема БД

```sql
-- Миграции применяются в алфавитном порядке (001 → 004)

users
  id            UUID PK  DEFAULT gen_random_uuid()
  email         TEXT NOT NULL UNIQUE
  password_hash TEXT NOT NULL          -- bcrypt, cost=10
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()

refresh_tokens
  id         UUID PK  DEFAULT gen_random_uuid()
  user_id    UUID NOT NULL → users(id) ON DELETE CASCADE
  token_hash TEXT NOT NULL UNIQUE      -- SHA-256(raw_token), hex
  expires_at TIMESTAMPTZ NOT NULL      -- now() + 7 days при выдаче
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()

scenes
  id         UUID PK  DEFAULT gen_random_uuid()
  user_id    UUID → users(id) ON DELETE SET NULL  -- nullable (legacy rows)
  name       TEXT NOT NULL
  data       JSONB NOT NULL DEFAULT '{}'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
```

Индексы: `idx_refresh_tokens_token_hash`, `idx_refresh_tokens_user_id`.  
Триггер `update_updated_at()` поддерживает `updated_at` на таблицах `users` и `scenes`.

---

## Доменные модели

| Go-тип | Пакет | Описание |
|--------|-------|----------|
| `User` | `repository` | Пользователь: id, email, password_hash, timestamps |
| `RefreshToken` | `repository` | Refresh-токен: id, user_id, token_hash, expires_at |
| `Scene` | `repository` | Сцена: id, user_id, name, data (JSONB), timestamps |

---

## Слои

```
cmd/server/main.go              → HTTP-сервер, routing, wire-up зависимостей
internal/api/
  handlers.go                   → Handler struct, scene-хэндлеры
  auth_handlers.go              → register, login, logout, refresh, me
  middleware.go                 → AuthMiddleware (JWT cookie → userID в context)
  types.gen.go                  → сгенерированные типы из openapi.yaml
internal/auth/
  jwt.go                        → GenerateAccessToken, ValidateAccessToken, GenerateRefreshToken
internal/repository/
  scenes.go                     → SceneRepository + PostgresSceneRepository
  users.go                      → UserRepository + PostgresUserRepository
  refresh_tokens.go             → RefreshTokenRepository + PostgresRefreshTokenRepository
```

По мере роста: добавить `internal/service/` (бизнес-логика) и `internal/store/` (работа с БД).
