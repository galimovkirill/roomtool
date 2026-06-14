# Backend — Архитектура

> Соглашения и workflow добавления эндпоинтов — в [CLAUDE.md](CLAUDE.md).

---

## Схема БД

_Будет заполнено по мере реализации._

---

## Доменные модели

_Будет заполнено по мере реализации._

---

## Слои

```
cmd/server/main.go          → HTTP-сервер, routing
internal/api/handlers.go    → HTTP-хэндлеры (тонкий слой)
internal/api/types.gen.go   → сгенерированные типы из openapi.yaml
```

По мере роста: добавить `internal/service/` (бизнес-логика) и `internal/store/` (работа с БД).
