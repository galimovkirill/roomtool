# RoomTool

3D-редактор шкафов для дизайнеров мебели. Позволяет проектировать расстановку элементов шкафа на сцене в 3D и 2D режимах с сохранением сцен на сервере.

## Стек

| Слой | Решение |
|------|---------|
| Frontend | React 19 · TypeScript strict · Vite 6 · Three.js / R3F · Zustand · Tailwind CSS v4 |
| Backend | Go 1.25 · `net/http` · PostgreSQL 17 |
| API-контракт | OpenAPI 3.0.3 → oapi-codegen v2 (Go) + openapi-typescript v7 (TS) |
| Инфраструктура | Docker Compose · GitHub Actions CI |

## Быстрый старт

### Docker (рекомендуется)

```bash
cp apps/backend/.env.example apps/backend/.env   # заполнить JWT_SECRET
make dev                                           # поднять полный стек с hot-reload
```

Фронтенд доступен на [http://localhost:5173](http://localhost:5173), бэкенд — на [http://localhost:8080](http://localhost:8080).

### Локально (без Docker)

```bash
# 1. База данных
make db               # запустить только postgres в Docker

# 2. Backend
cd apps/backend
cp .env.example .env  # заполнить DATABASE_URL и JWT_SECRET
air                   # hot-reload, или: go run ./cmd/server

# 3. Frontend (в корне репозитория)
pnpm install
pnpm dev
```

## Команды

```bash
# Frontend (из корня)
pnpm dev              # dev-сервер
pnpm build            # production сборка
pnpm test:run         # тесты (одиночный прогон)
pnpm typecheck        # TypeScript без сборки
pnpm lint             # ESLint
pnpm format           # Prettier

# Backend (apps/backend/)
go test ./...
go vet ./...

# API-контракт
make gen              # регенерировать Go + TS типы из openapi.yaml
```

## Структура репозитория

```
apps/
  frontend/           # React-приложение
  backend/            # Go REST API
  docs/
    openapi.yaml      # единственный источник истины по API
docs/
  mvp.md              # требования MVP
  user-flows.md       # пользовательские сценарии
  roadmap.md          # этапы разработки
BACKLOG.md            # задачи с промптами
CLAUDE.md             # руководство для Claude Code
```

## Документация

| Файл | Содержание |
|------|-----------|
| [CLAUDE.md](CLAUDE.md) | Команды, API-workflow, соглашения по коду |
| [apps/frontend/CLAUDE.md](apps/frontend/CLAUDE.md) | Frontend-соглашения, анти-паттерны |
| [apps/frontend/ARCHITECTURE.md](apps/frontend/ARCHITECTURE.md) | TypeScript-типы, дерево компонентов, Store API |
| [apps/backend/CLAUDE.md](apps/backend/CLAUDE.md) | Backend-структура, oapi-codegen |
| [apps/backend/ARCHITECTURE.md](apps/backend/ARCHITECTURE.md) | Схема БД, доменные модели |
| [docs/mvp.md](docs/mvp.md) | Требования и ограничения MVP |
| [docs/user-flows.md](docs/user-flows.md) | Пользовательские сценарии |
