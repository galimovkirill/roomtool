.PHONY: dev dev-build down logs db test build help

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

test: ## Запустить тесты frontend
	pnpm test:run

build: ## Production сборка (docker compose)
	docker compose up --build

help: ## Показать список команд
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'
