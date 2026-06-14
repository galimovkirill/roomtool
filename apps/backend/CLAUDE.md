# Backend — соглашения

Стек: Go 1.25 · `net/http` (stdlib) · PostgreSQL 17 · `oapi-codegen v2` · air (hot-reload)

## Структура

```
apps/backend/
├── cmd/server/main.go              # точка входа, HTTP-сервер :8080
├── migrations/
│   ├── migrations.go               # runner: embed + schema_migrations tracker
│   └── NNN_*.sql                   # SQL-миграции (алфавитный порядок = хронологический)
├── internal/
│   ├── api/
│   │   ├── handlers.go             # Handler struct + все HTTP-хэндлеры
│   │   └── types.gen.go            # СГЕНЕРИРОВАНО из openapi.yaml — не редактировать
│   └── repository/
│       ├── scenes.go               # SceneRepository interface + PostgresSceneRepository
│       └── scenes_test.go          # интеграционные тесты через testcontainers-go
├── tools/tools.go                  # //go:build tools — закрепляет oapi-codegen в go.mod
├── .oapi-codegen.yaml              # конфиг генератора (package: api, output: internal/api/types.gen.go)
├── Dockerfile                      # multi-stage: golang:1.25-alpine → alpine:3.21
├── Dockerfile.dev                  # FROM golang:1.25-alpine + air
└── .env.example                    # PORT, DATABASE_URL
```

## API-контракт

Единственный источник истины — **`apps/docs/openapi.yaml`**.
Типы генерируются командой из корня: `make gen`.

**Добавить эндпоинт:**
1. `apps/docs/openapi.yaml` — добавить path + schemas
2. `make gen` — регенерировать `types.gen.go` (и `types.gen.ts` на фронте)
3. Handler в `internal/api/handlers.go`, использовать сгенерированные типы
4. Route в `cmd/server/main.go`
5. Закоммитить `openapi.yaml`, `types.gen.go`, `types.gen.ts` в одном коммите

## Важно

- `types.gen.go` — не редактировать вручную. Запуск `make gen` перезапишет изменения.
- Версия Go в `go.mod` и в Dockerfile должна совпадать (сейчас **1.25**).
- Новые эндпоинты: добавить handler-метод на `Handler` struct, зарегистрировать route через `h.*` в `main.go`.
- `go run github.com/oapi-codegen/...` без `@version` — использует версию из `go.mod`.
