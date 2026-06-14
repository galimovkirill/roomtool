Проведи аудит CLAUDE.md — сверь его с текущим состоянием кодовой базы и предложи конкретный diff.

Аудит охватывает **три файла**: корневой `CLAUDE.md`, `apps/frontend/CLAUDE.md` и `apps/backend/CLAUDE.md`.
Проверяется только то, что нельзя вычитать из кода — договорённости, «почему», структурные факты.

---

## Часть 1 — Frontend (`apps/frontend/CLAUDE.md`)

1. **Структура файлов** — есть ли в `apps/frontend/src/` новые файлы/директории, которых нет в CLAUDE.md? Удалены ли упомянутые?
2. **Каталог деталей** — сверь `apps/frontend/src/catalog/items.ts` (список id, defaultDimensions) с таблицей в CLAUDE.md
3. **Типы** — сверь `apps/frontend/src/types/index.ts` с описанием типов в CLAUDE.md
4. **Store** — сверь экспорты `apps/frontend/src/store/sceneStore.ts` с упомянутыми полями и мутациями
5. **Конвенции** — проверь, что упомянутые файлы (`config/scene.ts`, `utils/collision.ts` и т.д.) существуют и экспортируют то, что написано
6. **Тесты** — сверь раздел «Тесты» с реально существующими `*.test.ts(x)` файлами
7. **Команды** — запусти `cat apps/frontend/package.json | python3 -c "import sys,json; s=json.load(sys.stdin)['scripts']; [print(f'{k}: {v}') for k,v in s.items()]"` и сверь с разделом «Команды»

Для шагов 1–6 запусти:
```bash
find apps/frontend/src -name "*.ts" -o -name "*.tsx" | grep -v node_modules | sort
find apps/frontend/src -name "*.test.ts" -o -name "*.test.tsx" | sort
```

---

## Часть 2 — Backend (`apps/backend/CLAUDE.md`)

Прочитай `apps/backend/CLAUDE.md` целиком, затем проверь:

1. **Структура пакетов** — сверь упомянутые пакеты/директории с реальным деревом `apps/backend/`
2. **Handlers** — сверь список эндпоинтов в CLAUDE.md с `apps/backend/internal/api/handlers.go`
3. **OpenAPI-соответствие** — упомянутые маршруты существуют в `apps/docs/openapi.yaml`?
4. **Сгенерированные типы** — убедись, что в CLAUDE.md нет ссылок на типы, которых нет в `apps/backend/internal/api/types.gen.go`
5. **Команды** — сверь раздел «Команды» с фактическими `go run`, `make` таргетами (Makefile + docker-compose)

```bash
find apps/backend -name "*.go" | grep -v "_test.go" | sort
find apps/backend -name "*_test.go" | sort
```

---

## Часть 3 — Корневой `CLAUDE.md`

1. **Команды** — сверь таблицу команд с корневым `package.json` и `Makefile`
2. **Структура монорепо** — добавлены ли новые приложения/пакеты, которых нет в таблице?
3. **OpenAPI workflow** — описание шагов актуально?

```bash
cat package.json | python3 -c "import sys,json; s=json.load(sys.stdin).get('scripts',{}); [print(f'{k}: {v}') for k,v in s.items()]"
cat Makefile | grep "^[a-z]" | head -30
```

---

## Формат вывода

```
## Аудит CLAUDE.md — <дата>

### Расхождения найдены: N

#### 1. [Файл: apps/frontend/CLAUDE.md | Секция: Каталог деталей]
**Сейчас:** `hanging-rod` — 860 × 25 × 25
**В коде:** 860 × 30 × 30 (catalog/items.ts:42)
**Исправить:** обновить строку в таблице

...

### Актуально (проверено, совпадает): ...список файлов и секций...
```

Если расхождений нет — написать «Все три CLAUDE.md актуальны, расхождений не найдено».

После вывода отчёта — спроси пользователя, применить ли найденные исправления.
