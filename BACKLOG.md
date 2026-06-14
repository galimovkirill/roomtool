# Backlog задач — RoomTool MVP

> Только нереализованные задачи с промптами. Завершённые — в таблице внизу.

---

## Pending

### TASK-009 — Хоткеи Ctrl+Z / Ctrl+Y (useKeyboard)

**Промпт для Claude Code:**
```
Создай хук для подписки на клавиши и подключи Undo/Redo.

Создай src/hooks/useKeyboard.ts:
Хук принимает handlers: Record<string, (e: KeyboardEvent) => void>.
Подписывается на keydown через useEffect, корректно отписывается при unmount.
Ключи в handlers — строки формата 'key' или 'ctrl+key' или 'ctrl+shift+key'.
Хук сам собирает модификаторы из e.ctrlKey, e.metaKey, e.shiftKey.
Кросс-платформенное правило: префикс 'ctrl' считается совпадением при e.ctrlKey === true ИЛИ e.metaKey === true.
Это позволяет одному хэндлеру 'ctrl+z' работать и на Windows/Linux (Ctrl+Z), и на macOS (Cmd+Z) без дублирования.

Пример использования:
useKeyboard({
  'ctrl+z': () => undo(),
  'ctrl+y': () => redo(),
})

В src/main.tsx создай компонент KeyboardShortcuts и добавь его внутрь <React.StrictMode>:
function KeyboardShortcuts() {
  useKeyboard({
    'ctrl+z': () => useSceneStore.getState().undo(),
    'ctrl+y': () => useSceneStore.getState().redo(),
  })
  return null
}
Используй getState() чтобы не создавать лишних подписок на рендер.

Напиши тест для useKeyboard:
- коллбек вызывается при нажатии нужной клавиши
- коллбек не вызывается при нажатии другой клавиши
- коллбек для 'ctrl+z' не вызывается при нажатии 'z' без ctrl
```

---

### TASK-015 — Undo/Redo через Ctrl+Z / Ctrl+Y

**Промпт для Claude Code:**
```
Подключи Undo/Redo к горячим клавишам и убедись что история работает корректно.

Компонент KeyboardShortcuts создаётся в TASK-009 и живёт в src/main.tsx.
Убедись что он там есть и содержит:
- 'ctrl+z' → useSceneStore.getState().undo()
- 'ctrl+y' → useSceneStore.getState().redo()

Напиши интеграционный тест:
- Добавь элемент → undo → items пустой
- Добавь элемент → undo → redo → items содержит элемент
- 5 действий → 5 undo → items пустой → 5 redo → items содержит все 5 элементов
```

---

### TASK-033 — Backend: Персистентность сцен (БД + CRUD)

**Промпт для Claude Code:**
```
Реализуй полноценный CRUD для сцен на бэкенде с PostgreSQL.

Контекст:
- OpenAPI-контракт уже описан в apps/docs/openapi.yaml — не изменяй его.
- Типы уже сгенерированы в apps/backend/internal/api/types.gen.go — не редактируй.
- Все 5 обработчиков в apps/backend/internal/api/handlers.go возвращают 501 — их нужно реализовать.
- Схема БД: одна таблица scenes.

Шаг 1 — SQL-миграция.
Создай apps/backend/migrations/001_create_scenes.sql:

  CREATE TABLE scenes (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT NOT NULL,
    data       JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE OR REPLACE FUNCTION update_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN NEW.updated_at = now(); RETURN NEW; END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER scenes_updated_at
    BEFORE UPDATE ON scenes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

Шаг 2 — Подключение к PostgreSQL и запуск миграций.
В apps/backend/cmd/server/main.go:

  dsn := os.Getenv("DATABASE_URL") // например: postgres://user:pass@localhost:5432/roomtool
  sqlDB, err := sql.Open("pgx", dsn)
  // проверь err, вызови sqlDB.Ping(ctx) перед стартом

Если pgx/v5 не в go.mod — добавь: go get github.com/jackc/pgx/v5
Импорт драйвера: import _ "github.com/jackc/pgx/v5/stdlib"

Добавь вызов runMigrations(ctx, sqlDB) перед регистрацией роутов.
Функцию runMigrations реализуй рядом: читает все *.sql файлы из папки migrations/ (встроить через embed.FS),
сортирует по имени файла (алфавитный порядок = хронологический при префиксе NNN_),
выполняет каждый в отдельной транзакции, идемпотентно (использует таблицу schema_migrations для отслеживания).

Шаг 3 — Repository.
Создай apps/backend/internal/repository/scenes.go с интерфейсом и реализацией:

  type SceneRepository interface {
    Create(ctx context.Context, name string, data json.RawMessage) (*Scene, error)
    Get(ctx context.Context, id string) (*Scene, error)
    List(ctx context.Context) ([]Scene, error)
    Update(ctx context.Context, id string, name string, data json.RawMessage) (*Scene, error)
    Delete(ctx context.Context, id string) error
  }

  type Scene struct {
    ID        string
    Name      string
    Data      json.RawMessage
    CreatedAt time.Time
    UpdatedAt time.Time
  }

Реализация — PostgresSceneRepository принимает *sql.DB (database/sql + pgx/v5/stdlib).
Для Get и Update возвращай (nil, ErrNotFound) если строка не найдена (определи sentinel-ошибку).

Шаг 4 — Handlers.
В apps/backend/internal/api/handlers.go реализуй все 5 обработчиков, используя SceneRepository:

HandleListScenes   → SELECT все, вернуть []SceneResponse (пустой массив если нет записей, не null)
HandleCreateScene  → INSERT, вернуть 201 + SceneResponse
HandleGetScene     → SELECT по id из r.PathValue("id"), 404 если ErrNotFound
HandleUpdateScene  → UPDATE по id, 404 если ErrNotFound, вернуть обновлённый SceneResponse
HandleDeleteScene  → DELETE по id, 404 если ErrNotFound, 204 No Content

SceneResponse — маппинг из repository.Scene в types.gen.go тип (Scene из openapi).

Шаг 5 — Dependency injection.
Handlers не должны знать о конкретной реализации репозитория. Создай структуру Handler,
которая держит SceneRepository:

  type Handler struct { repo repository.SceneRepository }
  func (h *Handler) ListScenes(w http.ResponseWriter, r *http.Request) { ... }

В main.go инициализируй: repo := repository.NewPostgresSceneRepository(sqlDB) → handler := &Handler{repo}
Зарегистрируй роуты через handler.*

Требования:
- Используй только стандартную библиотеку Go + pgx/v5/stdlib. Не добавляй ORM.
- Возвращай Content-Type: application/json для всех ответов.
- Логируй ошибки в stderr, но не возвращай внутренние детали клиенту.
- Напиши тесты для repository через testcontainers-go (реальная БД в Docker).
  Это важно: data хранится как JSONB — sqlmock не проверит реальное поведение PostgreSQL с этим типом.
```

---

### TASK-034 — Frontend: Sync service (автосохранение на сервер)

**Промпт для Claude Code:**
```
Реализуй автосохранение сцены на сервер с управлением жизненным циклом scene ID.

Контекст:
- localStorage-сохранение уже работает (src/store/persistence.ts + subscribe в sceneStore.ts).
- apiClient уже создан и типизирован в src/api/client.ts, но нигде не используется.
- Бэкенд ожидает: POST /api/v1/scenes { name, data } → { id, name, data, createdAt, updatedAt }.
- Бэкенд ожидает: PUT /api/v1/scenes/{id} { name, data } → { id, ... }.
- Имя сцены фиксировано: "Мой проект" (переименование — будущая задача).

Шаг 1 — Статус синхронизации.
Добавь в src/store/uiStore.ts (или создай src/store/syncStore.ts если uiStore большой) состояние:

  type SyncStatus = 'idle' | 'syncing' | 'error'

  interface SyncState {
    status: SyncStatus
    sceneId: string | null
    setSyncStatus: (status: SyncStatus) => void
    setSceneId: (id: string) => void
  }

Используй Zustand. sceneId инициализируй из localStorage (ключ: 'roomtool_scene_id_v1').
При setSceneId — сразу сохраняй в localStorage.

Шаг 2 — Sync service.
Создай src/api/syncService.ts:

  // initScene(): вызывается один раз при старте приложения.
  // Логика:
  //   1. Читает sceneId из syncStore.
  //   2. Если sceneId есть → GET /api/v1/scenes/{id}:
  //        200: загружает items/groups в sceneStore.
  //             Проверь сигнатуру resetScene в sceneStore.ts — если она принимает только void,
  //             создай отдельный экшен loadScene(items: SceneItem[], groups: SceneGroup[]): void
  //             который заменяет state без записи в undo-историю.
  //        404: sceneId устарел → создать новую сцену (см. п.3)
  //        Error (сеть недоступна): оставить данные из localStorage как есть (offline fallback)
  //   3. Если sceneId нет (или 404): POST /api/v1/scenes с текущими данными из sceneStore
  //        → syncStore.setSceneId(response.id)
  //   Возвращает Promise<void>. Ошибки не бросает наружу — логирует в console.error.
  export async function initScene(): Promise<void>

  // scheduleSync(): вызывается из sceneStore.subscribe при каждом изменении.
  // Debounce: 1500 мс.
  // Если sceneId нет — пропустить (initScene ещё не завершился).
  // Действие: PUT /api/v1/scenes/{id} с текущими items/groups.
  //   Перед запросом: setSyncStatus('syncing')
  //   При успехе: setSyncStatus('idle')
  //   При ошибке 404: sceneId устарел → POST новую сцену → обновить sceneId → повторить PUT
  //   При другой ошибке: setSyncStatus('error'), console.error
  export function scheduleSync(items: SceneItem[], groups: SceneGroup[]): void

  // syncNow(): немедленная синхронизация без debounce.
  // Используется кнопкой "Повторить" при статусе error.
  // Берёт текущие items/groups из useSceneStore.getState() и вызывает PUT напрямую.
  // Отменяет pending debounce-таймер если он есть.
  export async function syncNow(): Promise<void>

Шаг 3 — Подключение к sceneStore.
В src/store/sceneStore.ts найди существующий subscribe-блок (строки ~695-702).
Добавь вызов scheduleSync рядом с saveScene — НЕ замещай localStorage-сохранение:

  useSceneStore.subscribe((state) => {
    // localStorage (существующее)
    if (_saveTimer) clearTimeout(_saveTimer)
    _saveTimer = setTimeout(() => {
      saveScene({ version: 1, items: state.items, groups: state.groups })
    }, 500)
    // backend sync (новое)
    scheduleSync(state.items, state.groups)
  })

Шаг 4 — Инициализация при старте.
В src/main.tsx (или src/App.tsx) добавь вызов initScene() при монтировании приложения.
Используй useEffect с пустым массивом зависимостей, или вызови до рендера (за пределами компонента).
Приложение не должно блокироваться на initScene — рендерится сразу с данными из localStorage,
а после ответа сервера (если данные отличаются) sceneStore обновится.

Требования:
- Не создавай новых зависимостей — apiClient уже есть.
- scheduleSync должен отменять предыдущий таймер при каждом вызове (один глобальный таймер).
- При одновременных вызовах scheduleSync: только последний PUT уходит на сервер (debounce, не throttle).
- Не добавляй retry-логику с backoff — достаточно однократной попытки при каждом debounce-срабатывании.
- Напиши unit-тесты:
  scheduleSync: PUT вызывается через 1500мс, не вызывается раньше.
  syncNow: PUT вызывается немедленно, отменяет pending таймер.
```

---

### TASK-035 — Frontend: Индикатор статуса синхронизации

**Промпт для Claude Code:**
```
Добавь индикатор статуса автосохранения в Ribbon.

Контекст:
- syncStore (из TASK-034) хранит SyncStatus: 'idle' | 'syncing' | 'error'.
- Ribbon — компонент панели над сценой (реализован в TASK-029).
  Найди его в src/components/ или src/features/.
- Дизайн-система: Radix UI + Tailwind (TASK-031). Используй те же токены и подходы что в Ribbon.

Реализуй компонент SaveStatusIndicator:
- Состояние 'idle': текст "Сохранено", иконка CheckCircle, цвет text-muted-foreground (серый).
- Состояние 'syncing': текст "Сохранение...", анимированный спиннер (Loader2 из lucide-react с animate-spin).
- Состояние 'error': текст "Ошибка сохранения", иконка AlertCircle, цвет text-destructive (красный).
  Рядом — кнопка-ссылка "Повторить", по клику вызывает syncNow() из src/api/syncService.ts.

Разместить в Ribbon: в правой части панели, перед прочими action-кнопками (или за ними — смотри по месту).

Размер текста: text-xs или text-sm. Не перегружай визуально — это вспомогательная информация.

Не добавляй toast-уведомлений — только inline-индикатор в Ribbon.
```

---

## Сводная таблица

| ID | Фаза | Задача | Сложность | Статус |
|----|------|--------|-----------|--------|
| TASK-001 | Инфраструктура | Инициализация Vite + React + TS | S | ✅ |
| TASK-002 | Инфраструктура | ESLint + Prettier | S | ✅ |
| TASK-003 | Инфраструктура | Vitest + Testing Library | S | ✅ |
| TASK-004 | Сцена | Конфиг сцены + базовые типы | S | ✅ |
| TASK-005 | Сцена | Zustand stores + Undo/Redo | M | ✅ |
| TASK-006 | Сцена | Каталог мебельных элементов | S | ✅ |
| TASK-007 | Сцена | Layout + ScreenGuard (1024px) | S | ✅ |
| TASK-008 | Сцена | 3D-комната и камера | M | ✅ |
| TASK-010 | Сцена | Переключатель 2D/3D | M | ✅ |
| TASK-011 | Каталог | Правая панель: каталог | M | ✅ |
| TASK-012 | Каталог | Рендер элементов на сцене | M | ✅ |
| TASK-013 | Управление | TransformControls (перемещение) | L | ✅ |
| TASK-014 | Управление | Popover действий (поворот, удаление) | M | ✅ |
| TASK-016 | Свойства | PropertiesPanel + PropertyField | M | ✅ |
| TASK-017 | Коллизии | AABB-проверка + откат + уведомление | L | ✅ |
| TASK-018 | 2D-режим | Ортографическая камера + размеры | L | ✅ |
| TASK-019 | Полировка | Финальная проверка + README | S | ✅ |
| TASK-009 | Хоткеи | Хоткеи (Ctrl+Z/Y, useKeyboard) | M | ⬜ |
| TASK-015 | Хоткеи | Подключение Undo/Redo к хоткеям | S | ⬜ |
| TASK-020 | Каталог | Перепроектирование каталога: детали шкафа + материалы и цвета | XL | ✅ |
| TASK-021 | Слои | Панель слоёв, мульти-выбор, группировка, перемещение группы в 3D | XL | ✅ |
| TASK-022 | UX | Координаты выбранного элемента на оверлее сцены | S | ✅ |
| TASK-023 | UX | Блокировка элементов и групп (lock layer) | M | ✅ |
| TASK-024 | Баг | Элемент группы снапится на старую позицию после moveGroup | S | ✅ |
| TASK-025 | Архитектура | Унификация movement-слоя: единый источник истины (стор) | L | ✅ |
| TASK-026 | UX | Свойства элемента: открытие по двойному клику / контекст-меню «Редактировать» | M | ✅ |
| TASK-027 | Координаты | Нулевая точка координат в углу комнаты (отображение от угла) | S | ✅ |
| TASK-028 | Коллизии | Скольжение вдоль препятствий при drag (хард-коллизия per-frame) | L | ✅ |
| TASK-029 | UX | Лента (Ribbon): панель действий над сценой | L | ✅ |
| TASK-030 | 2D-режим | Полная переработка 2D-вида: SVG-план с линейками и размерными линиями | XL | ✅ |
| TASK-031 | Дизайн-система | Миграция UI-примитивов на Radix UI + дизайн-соглашения | L | ✅ |
| TASK-032 | Персистентность | Сохранение и загрузка сцены через LocalStorage | M | ✅ |
| TASK-033 | Персистентность | Backend: scenes table + CRUD handlers | L | ✅ |
| TASK-034 | Персистентность | Frontend: sync service (scene ID lifecycle + autosave) | M | ✅ |
| TASK-035 | Персистентность | Frontend: индикатор статуса синхронизации в Ribbon | S | ✅ |

**S** = ~30–60 мин · **M** = ~1–2 ч · **L** = ~2–4 ч · **XL** = ~4–8 ч
