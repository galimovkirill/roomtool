Сделай git commit текущих изменений в формате Conventional Commits.

## Формат сообщения

```
<type>(<scope>): <description>

[optional body]
```

**Типы:** feat, fix, refactor, test, docs, style, perf, build, chore

**Scope — frontend:** `store, scene, catalog, ui, config`
**Scope — backend:** `api, db, handler, migrations, server`
**Scope — общий:** `deps, docs, ci, spec` (для `openapi.yaml` и сгенерированных типов)

**Description:** английский, lowercase, без точки, до 72 символов.

## Примеры

```
feat(store): add undo/redo with two-stack pattern
fix(scene): prevent TransformControls conflict with OrbitControls
feat(handler): add scene persistence endpoint
fix(db): correct scene dimensions column type
feat(spec): add scenes CRUD to openapi.yaml
```

## Инструкция

1. `git status` + `git diff --stat` — список изменённых файлов и объём правок

1a. **OpenAPI-спецификация.** Если среди изменений есть `apps/docs/openapi.yaml`:
   - Проверь, что `apps/backend/internal/api/types.gen.go` и `apps/frontend/src/api/types.gen.ts` тоже изменены
   - Если НЕТ — запусти `make gen` из корня проекта перед stage'ингом
   - Все три файла обязаны войти в один коммит; используй scope `spec`

1b. **Миграции БД.** Если среди изменений есть файлы `apps/backend/migrations/*.sql`:
   - Прочитай содержимое новой/изменённой миграции
   - Обнови `apps/backend/ARCHITECTURE.md` — раздел схемы БД (таблицы, колонки, индексы, триггеры)
   - Включи обновлённый `ARCHITECTURE.md` в тот же коммит

2. Добавь в stage релевантные файлы (не `.env`, не секреты, не temp-файлы)
3. Определи type/scope по именам файлов и контексту текущей задачи
4. **Проверь CLAUDE.md.** Затронуты ли структурные файлы?
   - Frontend: `apps/frontend/src/types/`, `config/`, `catalog/`, `store/`, `utils/` — обнови `apps/frontend/CLAUDE.md`
   - Backend: `apps/backend/internal/`, новые handlers/services/migrations — обнови `apps/backend/CLAUDE.md`
   - Корневой `CLAUDE.md` — при изменении команд, OpenAPI workflow или CI
   Обновляй только «почему» и договорённости, не пересказывай код. Включи изменённые CLAUDE.md в тот же коммит.
5. Сформируй сообщение: title обязателен, body — если нужно объяснить «почему»
6. Создай коммит с `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`
7. Покажи итог: файлы и финальное сообщение коммита
