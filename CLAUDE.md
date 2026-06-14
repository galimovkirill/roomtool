# RoomTool — Claude Code Guide

Монорепозиторий: 3D-редактор шкафов (frontend) + REST API (backend).

## Структура

| Слой | Путь | Стек |
|------|------|------|
| Frontend | `apps/frontend/` | React 19, TypeScript, Vite, Three.js, Zustand |
| Backend | `apps/backend/` | Go 1.24, PostgreSQL |
| API spec | `apps/docs/openapi.yaml` | OpenAPI 3.0.3 — единственный источник истины |
| CI | `.github/workflows/ci.yml` | GitHub Actions |

Детальные соглашения: [apps/frontend/CLAUDE.md](apps/frontend/CLAUDE.md) · [apps/backend/CLAUDE.md](apps/backend/CLAUDE.md)

---

## Команды

### Из корня

```bash
pnpm dev           # frontend dev-сервер (Vite)
pnpm build         # production сборка frontend
pnpm test:run      # тесты frontend (одиночный прогон)
pnpm test          # тесты в watch-режиме
pnpm test:coverage # тесты + отчёт покрытия
pnpm typecheck     # TypeScript без сборки
pnpm lint          # ESLint
pnpm lint:fix      # ESLint автоисправление
pnpm format        # Prettier
make gen           # регенерировать Go + TS типы из openapi.yaml
```

### Backend (`apps/backend/`)

```bash
go run ./cmd/server           # запуск сервера
air                            # hot-reload
go test ./...                  # тесты
go vet ./...                   # линт
go build -o ./dist/server ./cmd/server
```

### Docker Compose

```bash
make dev           # полный стек с hot-reload (docker-compose.dev.yml)
make db            # только postgres
make dev-build     # пересборка образов
docker compose up  # production-стек
```

**Pre-commit:** husky запускает `lint-staged → typecheck → test:run` (frontend); `go vet → go test` (backend, только если staged .go файлы). Хук в `.husky/pre-commit`.

---

## API-контракт (OpenAPI)

Единственный источник истины — **`apps/docs/openapi.yaml`** (OpenAPI 3.0.3).
Сгенерированные файлы **не редактировать вручную:**

| Файл | Генератор | Назначение |
|------|-----------|-----------|
| `apps/backend/internal/api/types.gen.go` | `oapi-codegen v2` | Go-структуры и request body aliases |
| `apps/frontend/src/api/types.gen.ts` | `openapi-typescript v7` | TypeScript-интерфейсы paths/components |

**Workflow:** изменить `apps/docs/openapi.yaml` → `make gen` → закоммитить все три файла в одном коммите.

**Как добавить эндпоинт:**
1. Добавить path + schemas в `apps/docs/openapi.yaml`
2. `make gen` — регенерировать оба типовых файла
3. Handler в `apps/backend/internal/api/handlers.go`
4. Route в `apps/backend/cmd/server/main.go`
5. Использовать на фронте через `apiClient`

**HTTP-клиент на фронте:**
```typescript
import { apiClient } from '@/api/client'
const { data } = await apiClient.GET('/api/v1/scenes')
const { data: scene } = await apiClient.GET('/api/v1/scenes/{id}', {
  params: { path: { id: '...' } },
})
```
`baseUrl: ''` — запросы на тот же origin. Vite proxy перенаправляет `/health` и `/api` на `BACKEND_URL` (default `http://localhost:8080`). В Docker dev: `BACKEND_URL=http://backend:8080`.

**CI:** job `spec-check` регенерирует оба файла и проверяет `git diff --exit-code`. Расхождение типов и spec — CI падает.

---

## Навигация по документации

| Файл | Назначение |
|------|-----------|
| `apps/frontend/CLAUDE.md` | Frontend-соглашения, анти-паттерны, архитектура |
| `apps/backend/CLAUDE.md` | Backend-структура, oapi-codegen |
| `ARCHITECTURE.md` | TypeScript-интерфейсы, дерево компонентов |
| `docs/mvp.md` | Требования MVP |
| `docs/user-flows.md` | Пользовательские сценарии |
| `docs/TODO.md` | Отложенные решения |
| `BACKLOG.md` | Задачи с промптами для разработки |
