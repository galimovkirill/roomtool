# Backlog задач — RoomTool MVP

> Только нереализованные задачи с промптами. Завершённые — в таблице внизу.

---

## Pending

### TASK-009 — Хоткеи Ctrl+Z / Ctrl+Y (useKeyboard)

**Промпт для Claude Code:**
```
Создай хук для подписки на клавиши и подключи Undo/Redo.

Директории src/hooks/ ещё не существует — создай её.

Создай src/hooks/useKeyboard.ts:
Хук принимает handlers: Record<string, (e: KeyboardEvent) => void>.
Подписывается на keydown через useEffect, корректно отписывается при unmount.
Ключи в handlers — строки формата 'key' или 'ctrl+key' или 'ctrl+shift+key'.
Хук сам собирает модификаторы из e.ctrlKey, e.metaKey, e.shiftKey.

Кросс-платформенное правило: префикс 'ctrl' считается совпадением при
e.ctrlKey === true ИЛИ e.metaKey === true.
Это позволяет одному хэндлеру 'ctrl+z' работать и на Windows/Linux (Ctrl+Z),
и на macOS (Cmd+Z) без дублирования.

Input-guard: перед вызовом любого хэндлера проверяй, не находится ли фокус
на текстовом поле — если да, хоткей пропускается и браузер обрабатывает его
нативно (например, Ctrl+Z в поле ввода отменяет только набор текста):

  const target = e.target as HTMLElement
  if (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable
  ) return

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

Напиши юнит-тесты для useKeyboard (src/hooks/useKeyboard.test.ts):
- коллбек вызывается при нажатии нужной клавиши
- коллбек не вызывается при нажатии другой клавиши
- коллбек для 'ctrl+z' не вызывается при нажатии 'z' без ctrl
- коллбек для 'ctrl+z' вызывается при e.ctrlKey (Windows)
- коллбек для 'ctrl+z' вызывается при e.metaKey (macOS)
- коллбек НЕ вызывается, если e.target — элемент <input>
- коллбек НЕ вызывается, если e.target — элемент <textarea>
```

---

### TASK-015 — Интеграционные тесты Undo/Redo

> Зависит от TASK-009 (useKeyboard + KeyboardShortcuts).

**Промпт для Claude Code:**
```
Напиши интеграционные тесты для Undo/Redo, проверяя стор напрямую.

Тесты живут в src/store/sceneStore.undo.test.ts.

Покрой следующие сценарии:

История:
- Добавь элемент → undo() → items пустой
- Добавь элемент → undo() → redo() → items содержит элемент
- 5 добавлений → 5 undo → items пустой → 5 redo → items содержит все 5 элементов
- undo() при пустой истории — ничего не падает, items не изменились
- redo() при пустом future — ничего не падает, items не изменились

Лимит истории:
- 51 действие → история содержит не более 50 записей (старейшая вытеснена)

Очистка editor state:
- После undo() и redo() вызывается useEditorStore.getState().clearEditorState()
  (store уже делает это — убедись, что не сломано)

Совместимость с useKeyboard (smoke-тест):
- Симулируй keydown с { key: 'z', ctrlKey: true } на document →
  undo() вызывается (items пустеют после предварительного addItem)
- Симулируй keydown с { key: 'y', ctrlKey: true } →
  redo() восстанавливает элемент
- Симулируй keydown с { key: 'z', metaKey: true } (macOS Cmd+Z) →
  undo() вызывается
- Симулируй keydown с { key: 'z', ctrlKey: true } с target = <input> →
  undo() НЕ вызывается (input-guard)
```

---

### TASK-038 — Настройка размеров комнаты

**Промпт для Claude Code:**
```
Реализуй возможность задавать размеры комнаты (ширина × глубина × высота) прямо в редакторе.

## Что нужно сделать

### 1. OpenAPI — добавить поле `room` в `SceneData`

В `apps/docs/openapi.yaml` добавь в схему `SceneData` опциональное поле:

```yaml
SceneData:
  type: object
  properties:
    version:
      type: integer
    room:
      type: object
      description: Room dimensions in mm. If absent, defaults are used (4000x4000x3000).
      properties:
        width:  { type: integer, minimum: 1000, maximum: 50000 }
        depth:  { type: integer, minimum: 1000, maximum: 50000 }
        height: { type: integer, minimum: 1000, maximum: 10000 }
      required: [width, depth, height]
    items:
      ...
```

После изменения запусти `make gen` из корня репозитория, чтобы регенерировать
`apps/backend/internal/api/types.gen.go` и `apps/frontend/src/api/types.gen.ts`.
Закоммить все три файла вместе.

### 2. Frontend — типы

В `apps/frontend/src/types/index.ts` добавь интерфейс:

```ts
interface RoomDimensions {
  width: number   // мм
  depth: number   // мм
  height: number  // мм
}
```

### 3. Frontend — стор

В `apps/frontend/src/store/sceneStore.ts`:

- Добавь в `SceneState` поле `room: RoomDimensions`
- Начальное значение берётся из `SCENE_CONFIG.room` (fallback для новых сцен без сохранённых размеров)
- Добавь действие `setRoomDimensions(dims: RoomDimensions): void`
  - Просто обновляет `room` в стейте — НЕ добавлять в undo/redo историю
  - Room — настройка проекта, а не редакторское действие
- Добавь геттер/селектор `selectRoom` для подписки компонентов

При загрузке сцены с сервера (в sync service / сцена парсится из `SceneData`):
- Если `data.room` присутствует — вызвать `setRoomDimensions(data.room)`
- Если `data.room` отсутствует (старые сцены) — оставить дефолт из `SCENE_CONFIG.room`

При сериализации сцены для отправки на сервер — включать `room` в `SceneData`.

### 4. Frontend — 3D комната

В `apps/frontend/src/components/scene/Room.tsx`:
- Заменить чтение `SCENE_CONFIG.room` на подписку через `useSceneStore(selectRoom)`
- 3D-геометрия (плоскости пола и стен) должна реактивно перестраиваться при смене размеров

Проверь все компоненты, которые читают `SCENE_CONFIG.room` напрямую
(`grep -r "SCENE_CONFIG.room" apps/frontend/src`) — каждый из них должен
перейти на `useSceneStore(selectRoom)`.

### 5. Frontend — кнопка в Ribbon

Создай `apps/frontend/src/components/scene/ribbon/RoomSettingsPopover.tsx`.

Кнопка открывает Popover (используй `Popover` из Radix через существующую
дизайн-систему проекта). Иконку подбери подходящую из `lucide-react`.

Форма внутри поповера — три поля `<input type="number">`:
- «Ширина» (width), мм, мин 1000, макс 50000
- «Глубина» (depth), мм, мин 1000, макс 50000
- «Высота» (height), мм, мин 1000, макс 10000

При открытии поповера поля заполняются текущими значениями из стора.
Кнопка «Применить» — запускает проверку коллизий (см. п. 6).
Кнопка «Отмена» — закрывает поповер без изменений.

В `SceneRibbon.tsx` добавь `<RoomSettingsPopover />` после `<AlignmentPopover />`
(перед разделителем, за которым идут `<ItemActionsGroup />`).

### 6. Frontend — проверка выхода элементов за границы

Перед вызовом `setRoomDimensions(newDims)` проверь, какие элементы окажутся
за пределами новой комнаты.

Элемент с `position [x, y, z]` и `dimensions {width: w, height: h, depth: d}`
выходит за границы если выполняется хотя бы одно:
- `x + w/2 > newDims.width / 2`
- `x - w/2 < -newDims.width / 2`
- `z + d/2 > newDims.depth / 2`
- `z - d/2 < -newDims.depth / 2`
- `y + h/2 > newDims.height`

Если таких элементов нет — применяй сразу, поповер закрывается.

Если есть — покажи диалог подтверждения (используй `AlertDialog` из Radix):
  «N элементов окажутся за пределами комнаты. Применить всё равно?»
  Кнопки: «Отмена» / «Применить»

При подтверждении — вызвать `setRoomDimensions(newDims)`, закрыть поповер.
Элементы остаются на своих позициях — пользователь перемещает их вручную.

### 7. Тесты

Напиши юнит-тесты в `apps/frontend/src/store/sceneStore.test.ts` (или рядом):
- `setRoomDimensions` обновляет `room` в стейте
- `setRoomDimensions` не добавляет запись в `history`
- Загрузка сцены с `data.room` → стор содержит переданные размеры
- Загрузка сцены без `data.room` → стор содержит дефолтные размеры из `SCENE_CONFIG.room`

### Ограничения / не делать сейчас
- Не добавлять четвёртую стену, потолок, окна или двери
- Не добавлять snap-to-grid при изменении размеров
- Не поддерживать L-образные и нестандартные формы комнат
```

---

### TASK-039 — Шаринг: Backend API (миграция + эндпоинты)

**Промпт для Claude Code:**
```
Добавь поддержку публичных share-ссылок на уровне API.

## 1. Миграция

Создай `apps/backend/migrations/005_add_share_token_to_scenes.sql`:

```sql
ALTER TABLE scenes ADD COLUMN share_token VARCHAR(43) UNIQUE;
```

NULL = ссылка неактивна. Ненулевое значение = сцена публично доступна.
Отдельный флаг is_public не нужен — наличие токена и есть признак публичности.

## 2. OpenAPI (`apps/docs/openapi.yaml`)

### 2a. SceneSummary — добавить поле share_token

```yaml
SceneSummary:
  properties:
    ...
    share_token:
      type: string
      nullable: true
      description: >
        Opaque share token. Non-null means the scene is publicly accessible
        via GET /api/v1/share/{token}. Null means sharing is disabled.
```

### 2b. Новые эндпоинты

```yaml
/api/v1/scenes/{id}/share:
  post:
    summary: Enable sharing (idempotent)
    security:
      - cookieAuth: []
    parameters:
      - $ref: '#/components/parameters/SceneId'
    responses:
      '200':
        description: Share token (existing or newly created)
        content:
          application/json:
            schema:
              type: object
              required: [share_token]
              properties:
                share_token:
                  type: string
      '403':
        $ref: '#/components/responses/Forbidden'
      '404':
        $ref: '#/components/responses/NotFound'
  delete:
    summary: Revoke sharing
    security:
      - cookieAuth: []
    parameters:
      - $ref: '#/components/parameters/SceneId'
    responses:
      '204':
        description: Sharing revoked
      '403':
        $ref: '#/components/responses/Forbidden'
      '404':
        $ref: '#/components/responses/NotFound'

/api/v1/share/{token}:
  get:
    summary: Get public scene by share token (no auth required)
    parameters:
      - name: token
        in: path
        required: true
        schema:
          type: string
    responses:
      '200':
        description: Scene data
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Scene'
      '404':
        $ref: '#/components/responses/NotFound'
```

После правок — запусти `make gen` из корня.
Закоммить `openapi.yaml`, оба gen-файла и миграцию в одном коммите.

## 3. Генерация токена

В `apps/backend/internal/repository/scenes.go` добавь приватную функцию:

```go
func generateShareToken() (string, error) {
    b := make([]byte, 32)
    if _, err := rand.Read(b); err != nil {
        return "", err
    }
    return base64.RawURLEncoding.EncodeToString(b), nil
}
```

Импорты: `"crypto/rand"`, `"encoding/base64"`.

## 4. Repository

Добавь в `SceneRepository` интерфейс и реализацию трёх методов:

```go
EnableShare(ctx context.Context, id, userID string) (shareToken string, err error)
DisableShare(ctx context.Context, id, userID string) error
GetByShareToken(ctx context.Context, token string) (*Scene, error)
```

`EnableShare`:
- Если `share_token` уже есть — вернуть существующий (идемпотентно).
- Если NULL — сгенерировать новый через `generateShareToken()`, сохранить,
  вернуть.
- Проверить ownership через `user_id = $userID`.

`DisableShare`:
- `UPDATE scenes SET share_token = NULL WHERE id = $id AND user_id = $userID`.
- Если строка не обновилась — вернуть 404.

`GetByShareToken`:
- `SELECT ... FROM scenes WHERE share_token = $token`.
- Без проверки user_id (публичный эндпоинт).

Не забудь добавить `share_token` в сканирование строки во всех существующих
`scan`-вызовах по таблице `scenes` (List, Get, Create, Update, ...).

## 5. Handlers

В `apps/backend/internal/api/handlers.go` добавь три хэндлера:

```go
func (h *Handler) HandleEnableShare(w http.ResponseWriter, r *http.Request)
func (h *Handler) HandleDisableShare(w http.ResponseWriter, r *http.Request)
func (h *Handler) HandleGetPublicScene(w http.ResponseWriter, r *http.Request)
```

`HandleEnableShare` (POST `/api/v1/scenes/{id}/share`, требует auth):
- Читает `id` из path.
- Вызывает `repo.EnableShare(ctx, id, userID)`.
- 200 JSON `{"share_token": "..."}`.

`HandleDisableShare` (DELETE `/api/v1/scenes/{id}/share`, требует auth):
- Вызывает `repo.DisableShare(ctx, id, userID)`.
- 204 No Content.

`HandleGetPublicScene` (GET `/api/v1/share/{token}`, без auth):
- Читает `token` из path.
- Вызывает `repo.GetByShareToken(ctx, token)`.
- 200 JSON `Scene` (те же поля что у обычного GetScene).
- 404 если не найдено или share_token = NULL.

## 6. Роутинг

В `apps/backend/cmd/server/main.go`:
- `POST /api/v1/scenes/{id}/share` → `handler.HandleEnableShare` (за authMiddleware)
- `DELETE /api/v1/scenes/{id}/share` → `handler.HandleDisableShare` (за authMiddleware)
- `GET /api/v1/share/{token}` → `handler.HandleGetPublicScene` (без auth)

## 7. Тесты

Напиши Go-тесты `apps/backend/internal/repository/scenes_share_test.go`:
- `EnableShare` создаёт токен для сцены без него
- `EnableShare` повторный вызов возвращает тот же токен
- `EnableShare` возвращает ошибку при несоответствии user_id
- `DisableShare` сбрасывает токен в NULL
- `GetByShareToken` находит сцену по токену
- `GetByShareToken` возвращает ошибку для несуществующего токена
```

---

### TASK-040 — Шаринг: Frontend (viewer + UI управления)

> Зависит от TASK-039.

**Промпт для Claude Code:**
```
Добавь публичный просмотрщик сцены и UI для управления share-ссылкой.

## 1. Новый маршрут `/share/:token`

В `apps/frontend/src/main.tsx` добавь публичный маршрут
(без ProtectedRoute, без ScreenGuard):

```tsx
/share/:token  →  ShareViewerPage
```

## 2. ShareViewerPage

Создай `apps/frontend/src/pages/ShareViewerPage.tsx`.

Страница загружает сцену по токену из URL через:
```typescript
GET /api/v1/share/{token}
// используй apiClient.GET('/api/v1/share/{token}', { params: { path: { token } } })
```

После загрузки — заполняет `sceneStore` данными сцены
(items, groups, room — аналогично тому, как это делает sync service в EditorPage).

Макет страницы (view-only, без инструментов редактирования):

```
┌────────────────────────────────────────────┐
│  [Название сцены]          [3D] [2D]       │  ← минимальный header
├────────────────────────────────────────────┤
│                                            │
│              SceneCanvas                   │  ← только сцена
│           (viewOnly=true)                  │
│                                            │
└────────────────────────────────────────────┘
```

Состояния:
- Загрузка — спиннер по центру.
- Токен не найден или деактивирован — сообщение «Ссылка недействительна» с
  кнопкой «Открыть RoomTool».
- Успех — рендерит сцену.

## 3. View-only режим в SceneCanvas

Добавь проп `viewOnly?: boolean` в `SceneCanvas`.

При `viewOnly={true}`:
- Клик по элементу не выделяет его (нет `selectedItemIds`).
- TransformControls и gizmo не отображаются.
- Правая панель (каталог, слои, свойства) не отображается.
- Ribbon не отображается — управление режимом вынесено в header ShareViewerPage.

Камера при этом работает в штатном режиме (вращение, зум, pan).

## 4. ShareDialog

Создай `apps/frontend/src/components/share/ShareDialog.tsx`.

Принимает `sceneId: string` и `initialToken: string | null`.

Использует `AlertDialog` / `Dialog` из Radix (по аналогии с остальными диалогами в проекте).

Состояния диалога:

**Ссылка не создана** (`initialToken === null`):
```
[ Создать ссылку ]
```
При нажатии → `POST /api/v1/scenes/{id}/share` → переходит в следующее состояние.

**Ссылка активна** (`token` получен):
```
https://…/share/abc123…   [Скопировать]

[Отозвать ссылку]
```
«Скопировать» — `navigator.clipboard.writeText(url)` + toast «Ссылка скопирована».
«Отозвать ссылку» — `DELETE /api/v1/scenes/{id}/share` → диалог возвращается
в состояние «Ссылка не создана».
После отзыва родительский компонент получает колбэк `onTokenChange(null)`.

## 5. Точки входа в ShareDialog

### 5a. Страница /files — контекстное меню SceneCard

В `apps/frontend/src/components/files/SceneCard.tsx` добавь пункт
«Поделиться» в контекстное меню (рядом с «Дублировать», «Удалить»).

`SceneSummary` теперь содержит поле `share_token` (из API, после TASK-039).
Передай его в `ShareDialog` как `initialToken`.

После отзыва — обновить список сцен (инвалидировать запрос или обновить
локальный стейт).

### 5b. Редактор — кнопка в Ribbon

В `apps/frontend/src/components/scene/ribbon/` создай `ShareButton.tsx`.

Кнопка открывает `ShareDialog` для текущей сцены.
`sceneId` читать из URL-параметра (`useParams`).
Текущий `share_token` сцены — получать от sync service или отдельным запросом
`GET /api/v1/scenes/{id}` при открытии диалога.

Иконку подобрать из `lucide-react` (например `Share2`).

В `SceneRibbon.tsx` добавь `<ShareButton />` перед `<SaveStatusIndicator />`.

## 6. Ограничения / не делать сейчас

- Не добавлять срок действия ссылки.
- Не добавлять парольную защиту ссылки.
- Не показывать кнопку «Открыть в редакторе» на странице просмотра.
- Не адаптировать viewer под мобильные экраны (те же требования 1024px).
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
| TASK-009 | Хоткеи | Хоткеи (Ctrl+Z/Y, useKeyboard) | M | ✅ |
| TASK-015 | Хоткеи | Подключение Undo/Redo к хоткеям | S | ✅ |
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
| TASK-037 | Файлы | Frontend: страница /files + мультисценовая навигация | XL | ✅ |
| TASK-038 | Сцена | Настройка размеров комнаты (Ribbon + store + валидация) | L | ⬜ |
| TASK-039 | Шаринг | Backend: share token API (migration + enable/disable/public get) | M | ⬜ |
| TASK-040 | Шаринг | Frontend: ShareViewerPage + ShareDialog + Ribbon/SceneCard UI | L | ⬜ |

**S** = ~30–60 мин · **M** = ~1–2 ч · **L** = ~2–4 ч · **XL** = ~4–8 ч
