.PHONY: dev dev-build down logs db test build gen help

dev: ## Запустить весь стек для разработки (с hot-reload)
	docker compose -f docker-compose.dev.yml up

dev-build: ## Пересобрать образы и запустить (нужно после изменения зависимостей)
	docker compose -f docker-compose.dev.yml up --build

down: ## Остановить все сервисы
	docker compose -f docker-compose.dev.yml down

logs: ## Показать логи (все сервисы)
	docker compose -f docker-compose.dev.yml logs -f

db: ## Запустить только PostgreSQL (для локального запуска без Docker)
	docker compose -f docker-compose.dev.yml up db -d

gen: ## Регенерировать типы из apps/docs/openapi.yaml (Go + TypeScript)
	cd apps/backend && go run github.com/oapi-codegen/oapi-codegen/v2/cmd/oapi-codegen \
		--config .oapi-codegen.yaml ../docs/openapi.yaml
	pnpm gen:types

test: ## Запустить тесты frontend
	pnpm test:run

build: ## Production сборка (docker compose)
	docker compose up --build

help: ## Показать список команд
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'
