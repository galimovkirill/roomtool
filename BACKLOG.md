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

### TASK-036 — Backend: PATCH переименование + дублирование сцены

**Промпт для Claude Code:**
```
Добавь два новых эндпоинта для многофайлового режима: переименование сцены и её дублирование.

Контекст:
- Схема openapi.yaml: GET/PUT/DELETE /api/v1/scenes/{id} уже есть.
- PUT требует полный SceneInput (name + data). Для переименования с /files мы не хотим
  тащить весь data — нужен отдельный PATCH только по имени.
- Дублирование создаёт копию сцены с тем же data и именем "Копия {оригинал}".
- Все операции должны быть привязаны к userID текущего пользователя (из middleware).

Шаг 1 — openapi.yaml.
В apps/docs/openapi.yaml добавь:

Новая схема (в components.schemas):
  SceneRenameInput:
    type: object
    required: [name]
    properties:
      name:
        type: string
        description: New scene name

Новый путь PATCH /api/v1/scenes/{id}:
  patch:
    operationId: RenameScene
    summary: Rename a scene (update name only)
    security:
      - cookieAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/SceneRenameInput"
    responses:
      "200":
        description: Scene renamed
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/Scene"
      "400": { ... ErrorResponse }
      "401": { ... ErrorResponse }
      "404": { ... ErrorResponse }

Новый путь POST /api/v1/scenes/{id}/duplicate:
  post:
    operationId: DuplicateScene
    summary: Duplicate a scene
    security:
      - cookieAuth: []
    responses:
      "201":
        description: Scene duplicated
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/Scene"
      "401": { ... ErrorResponse }
      "404": { ... ErrorResponse }

Шаг 2 — make gen.
Запусти make gen. Убедись что apps/backend/internal/api/types.gen.go и
apps/frontend/src/api/types.gen.ts обновились и компилируются.

Шаг 3 — Repository.
В apps/backend/internal/repository/scenes.go добавь в интерфейс SceneRepository:
  UpdateName(ctx context.Context, id string, userID string, name string) (*Scene, error)
  Duplicate(ctx context.Context, id string, userID string) (*Scene, error)

Реализация PostgresSceneRepository:
- UpdateName: UPDATE scenes SET name=$1 WHERE id=$2 AND user_id=$3 RETURNING *.
  Если rowsAffected == 0 → ErrNotFound (уже определён в scenes.go).
- Duplicate: SELECT * FROM scenes WHERE id=$1 AND user_id=$2.
  Если не найден → ErrNotFound.
  INSERT INTO scenes (user_id, name, data) VALUES ($3, 'Копия ' || $4, $5) RETURNING *.
  Возвращает новую сцену.

Шаг 4 — Handlers.
В apps/backend/internal/api/handlers.go добавь два метода на Handler:

HandleRenameScene:
- Декодируй тело в SceneRenameInput (из types.gen.go).
- Вызови h.repo.UpdateName(ctx, id, userID, input.Name).
- 404 при ErrNotFound, 200 + SceneResponse при успехе.

HandleDuplicateScene:
- Вызови h.repo.Duplicate(ctx, id, userID).
- 404 при ErrNotFound, 201 + SceneResponse при успехе.

Шаг 5 — Routes.
В apps/backend/cmd/server/main.go зарегистрируй новые маршруты:
  mux.Handle("PATCH /api/v1/scenes/{id}", authMiddleware(handler.HandleRenameScene))
  mux.Handle("POST /api/v1/scenes/{id}/duplicate", authMiddleware(handler.HandleDuplicateScene))

Шаг 6 — Тесты.
В apps/backend/internal/repository/scenes_test.go (testcontainers) добавь тесты:
- UpdateName: переименовывает сцену, другой пользователь получает ErrNotFound.
- Duplicate: создаёт новую запись с prefix "Копия ", оригинал не тронут.
```

---

### TASK-037 — Frontend: страница /files и мультисценовая навигация

**Промпт для Claude Code:**
```
Реализуй страницу-хаб /files со списком 3D-сцен пользователя и перепиши роутинг
под мультисценовую модель (один редактор на сцену по URL-идентификатору).

Контекст:
- Сейчас единственный маршрут редактора — '/'. SceneId хранится в localStorage и
  определяется автоматически при старте.
- После этой задачи: редактор живёт на '/editor/:id', /files — хаб с картотекой сцен.
- PATCH /api/v1/scenes/{id} и POST /api/v1/scenes/{id}/duplicate уже реализованы
  в TASK-036.
- Дизайн-система: shadcn/ui + Tailwind v4. Визуальный ориентир — Figma Files.
- Все тексты UI — на русском языке.

─────────────────────────────────────────
Шаг 1 — Роутинг (src/main.tsx)
─────────────────────────────────────────
Перепиши маршруты:

  <Routes>
    <Route path="/login"    element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/"         element={<Navigate to="/files" replace />} />
    <Route path="/files"    element={<ProtectedRoute><FilesPage /></ProtectedRoute>} />
    <Route
      path="/editor/:id"
      element={
        <ProtectedRoute>
          <ScreenGuard>
            <EditorPage />   {/* новый компонент, см. Шаг 3 */}
          </ScreenGuard>
        </ProtectedRoute>
      }
    />
  </Routes>

LoginPage и RegisterPage: после успешной авторизации редиректить на '/files'
(сейчас они редиректят на '/').

─────────────────────────────────────────
Шаг 2 — Рефакторинг syncService + syncStore
─────────────────────────────────────────
src/store/syncStore.ts:
- Убери localStorage-персистентность sceneId (ключ 'roomtool_scene_id_v1').
  Теперь sceneId всегда приходит из URL, а не из localStorage.
- SyncStatus ('idle'|'syncing'|'error') и остальная логика не меняются.

src/api/syncService.ts — измени сигнатуру initScene:

  // Было: initScene(): Promise<void>  (читает sceneId из localStorage)
  // Стало:
  export async function initScene(sceneId: string): Promise<'ok' | 'not_found'>
  // Логика:
  //   GET /api/v1/scenes/{sceneId}
  //   200: loadScene(items, groups) в sceneStore + syncStore.setSceneId(sceneId) → return 'ok'
  //   404: return 'not_found'
  //   Сетевая ошибка: setSyncStatus('error'), return 'not_found'

src/store/persistence.ts:
- Измени ключ localStorage с фиксированного 'roomtool_scene_v1' на
  динамический `roomtool_scene_${sceneId}_v1`.
- Добавь параметр sceneId в saveScene(snapshot, sceneId) и loadScene(sceneId).
- В sceneStore.subscribe передавай sceneId из syncStore.getState().sceneId
  (может быть null — тогда не сохранять в localStorage).

─────────────────────────────────────────
Шаг 3 — EditorPage (src/pages/EditorPage.tsx)
─────────────────────────────────────────
Создай EditorPage — оборачивает существующий контент редактора:

  export function EditorPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()

    useEffect(() => {
      if (!id) { navigate('/files', { replace: true }); return }
      initScene(id).then(status => {
        if (status === 'not_found') navigate('/files', { replace: true })
      })
      return () => {
        // сброс сцены при уходе из редактора
        useSceneStore.getState().resetScene()
        useSyncStore.getState().setSceneId(null)
      }
    }, [id])

    return (
      <AppLayout>
        <SceneRibbon />
        <div className="flex flex-1 overflow-hidden">
          <SceneCanvas />
          <RightPanel />
        </div>
      </AppLayout>
    )
  }

Убедись что resetScene() в sceneStore существует и сбрасывает items/groups/history
без записи в undo-историю. Если нет — добавь.

─────────────────────────────────────────
Шаг 4 — AppHeader (src/components/ui/AppHeader.tsx)
─────────────────────────────────────────
Минималистичный хедер для не-редакторских страниц (как у Figma):

  <header className="h-12 border-b flex items-center justify-between px-4">
    <span className="font-semibold text-sm">RoomTool</span>
    <UserMenu />   {/* email пользователя + кнопка "Выйти" */}
  </header>

UserMenu: получает user из authStore. Показывает email (truncate) + выпадающий
список (shadcn DropdownMenu) с единственным пунктом "Выйти" (вызывает logout из authStore).
Можно использовать компонент UserButton из SceneRibbon как основу — он уже реализован.

─────────────────────────────────────────
Шаг 5 — FilesPage (src/pages/FilesPage.tsx)
─────────────────────────────────────────
Структура страницы:

  <div className="min-h-screen flex flex-col bg-background">
    <AppHeader />
    <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Мои файлы</h1>
        <Button onClick={handleCreateScene}>Создать сцену</Button>
      </div>
      <SortTabs />   {/* переключатель сортировки */}
      <SceneGrid />  {/* сетка карточек */}
    </main>
  </div>

Загрузка данных:
- Используй apiClient.GET('/api/v1/scenes') для получения списка.
- Показывай скелетон (shimmer placeholder) во время загрузки.
- Обработай ошибку загрузки (показать toast + retry-кнопку).

Сортировка (3 варианта, переключатель над сеткой):
- "Последнее изменение" — по updatedAt desc (по умолчанию)
- "Дата создания"       — по createdAt desc
- "По названию"         — по name asc (алфавит)
Сортировка локальная (не на сервере): sort массив после получения.

handleCreateScene:
  const { data } = await apiClient.POST('/api/v1/scenes', {
    body: { name: 'Без названия', data: { version: 1, items: [], groups: [] } }
  })
  navigate(`/editor/${data.id}`)

Пустое состояние (нет сцен):
  <div className="text-center py-24 text-muted-foreground">
    <p className="mb-4">У вас ещё нет файлов</p>
    <Button onClick={handleCreateScene}>Создать первую сцену</Button>
  </div>

─────────────────────────────────────────
Шаг 6 — SceneCard (src/components/files/SceneCard.tsx)
─────────────────────────────────────────
Карточка одной сцены (Figma-стиль):

  <div className="group relative rounded-lg border bg-card hover:border-primary
                  cursor-pointer transition-colors"
       onClick={() => navigate(`/editor/${scene.id}`)}>

    {/* Превью — иконка-заглушка */}
    <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center">
      <BoxIcon className="w-12 h-12 text-muted-foreground/40" />
    </div>

    {/* Мета */}
    <div className="p-3">
      <SceneName scene={scene} onRename={handleRename} />  {/* см. ниже */}
      <p className="text-xs text-muted-foreground mt-1">
        Изменено {formatRelativeDate(scene.updatedAt)}
      </p>
    </div>

    {/* Контекстное меню */}
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100
                           p-1 rounded hover:bg-accent transition-opacity"
                onClick={e => e.stopPropagation()}>
          <MoreHorizontalIcon className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={handleStartRename}>Переименовать</DropdownMenuItem>
        <DropdownMenuItem onClick={handleDuplicate}>Дублировать</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
          Удалить
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>

Inline-переименование (SceneName):
- По двойному клику на имя (или через меню "Переименовать") — показать <input>
  с текущим значением, автофокус.
- По Enter или blur — вызвать apiClient.PATCH('/api/v1/scenes/{id}', { body: { name } }).
- По Escape — отменить.
- Обновить локальный список оптимистично (до ответа сервера), откатить при ошибке.

Дублирование (handleDuplicate):
  const { data } = await apiClient.POST('/api/v1/scenes/{id}/duplicate')
  setScenes(prev => [data, ...prev])  // добавить в начало списка

Удаление (handleDelete):
- Подтверждение через window.confirm("Удалить «{name}»?") или shadcn AlertDialog.
- DELETE /api/v1/scenes/{id} → убрать из локального списка.
- Показать toast "Сцена удалена" (Sonner).

Утилита formatRelativeDate(dateStr: string): string:
- Сегодня: "сегодня в 14:32"
- Вчера: "вчера в 09:15"
- Текущий год: "15 мар в 11:00"
- Прошлый год: "15 мар 2024"
Положи в src/utils/formatDate.ts. Напиши unit-тест.

─────────────────────────────────────────
Шаг 7 — Имя сцены в редакторе (SceneRibbon)
─────────────────────────────────────────
Добавь отображение имени текущей сцены в SceneRibbon (по центру или рядом с логотипом):
- Читай name из нового поля syncStore.sceneName (добавь в SyncState).
- initScene должен сохранять name: syncStore.setSceneName(scene.name).
- Показывай как простой текст (не редактируемый — переименование только из /files).

─────────────────────────────────────────
Требования и ограничения
─────────────────────────────────────────
- Не использовать новых npm-зависимостей — все нужные компоненты уже есть в shadcn.
- BoxIcon и MoreHorizontalIcon — из lucide-react (уже в зависимостях).
- Убедись что TypeScript компилируется: pnpm typecheck.
- Убедись что тесты не сломались: pnpm test:run.
- Не удаляй localStorage-кеш полностью — только измени ключ на per-scene.
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
| TASK-036 | Файлы | Backend: PATCH переименование + дублирование сцены | M | ✅ |
| TASK-037 | Файлы | Frontend: страница /files + мультисценовая навигация | XL | ⬜ |

**S** = ~30–60 мин · **M** = ~1–2 ч · **L** = ~2–4 ч · **XL** = ~4–8 ч
