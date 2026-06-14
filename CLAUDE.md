# RoomTool — Project Guide for Claude Code

Монорепозиторий: 3D-редактор для проектирования шкафов (frontend) + REST API (backend).

```
apps/
├── frontend/   React + Three.js
└── backend/    Go + PostgreSQL
```

---

## Структура монорепозитория

| Слой | Путь | Стек |
|------|------|------|
| Frontend | `apps/frontend/` | React 19, TypeScript, Vite, Three.js, Zustand |
| Backend | `apps/backend/` | Go 1.23, PostgreSQL |
| Оркестрация | `docker-compose.yml` | frontend + backend + postgres |
| CI | `.github/workflows/ci.yml` | GitHub Actions |

---

## Команды

### Из корня (проксируют во frontend)

```bash
pnpm dev           # запуск frontend dev-сервера (Vite)
pnpm build         # production сборка frontend
pnpm test          # тесты frontend в watch-режиме (Vitest)
pnpm test:run      # одиночный прогон тестов
pnpm test:coverage # прогон с отчётом покрытия + проверка порогов
pnpm typecheck     # TypeScript без сборки
pnpm lint          # ESLint
pnpm lint:fix      # ESLint автоисправление
pnpm format        # Prettier
```

### Backend (из `apps/backend/`)

```bash
go run ./cmd/server           # запуск сервера
air                           # hot-reload (требует: go install github.com/air-verse/air@latest)
go test ./...                 # тесты
go vet ./...                  # линт
go build -o ./dist/server ./cmd/server  # production сборка
```

### Docker Compose (полный стек)

```bash
docker compose up             # поднять всё (frontend + backend + postgres)
docker compose up db -d       # только postgres (для локального dev бэкенда)
docker compose up --build     # пересобрать образы
```

> **Pre-commit гейт.** На каждый `git commit` husky запускает:
> frontend: `lint-staged → typecheck → test:run`;
> backend (только если staged .go файлы): `go vet → go test`.
> Хук — в `.husky/pre-commit`.

---

## Стек

### Frontend (`apps/frontend/`)

| Слой | Инструмент |
|------|-----------|
| Фреймворк | React 19 + TypeScript (strict) |
| Сборка | Vite 6 |
| 3D | Three.js + @react-three/fiber + @react-three/drei |
| Стейт | Zustand |
| Стили | Tailwind CSS v4 |
| UI-примитивы | shadcn/ui (Base UI) |
| Уведомления | Sonner (`toast()`) |
| Тесты | Vitest + @testing-library/react |
| Пакеты | pnpm workspaces |

### Backend (`apps/backend/`)

| Слой | Инструмент |
|------|-----------|
| Язык | Go 1.23 |
| HTTP | `net/http` (stdlib) |
| База данных | PostgreSQL 17 |
| Hot-reload | air |
| Конфиг | env vars (`.env.example` в `apps/backend/`) |

---

### UI-примитивы

shadcn/ui — единственный источник готовых компонентов в проекте. Компоненты хранятся в
`src/components/ui/` (копируются `npx shadcn@latest add <name>`). Под капотом — `@base-ui/react`
(следующее поколение Radix UI, тот же автор).

| Задача | shadcn-компонент | Импорт |
|--------|-----------------|--------|
| Выпадающий список | Select | `@/components/ui/select` |
| Тултип | Tooltip | `@/components/ui/tooltip` |
| Поповер (DOM) | Popover | `@/components/ui/popover` |
| Контекстное меню | ContextMenu | `@/components/ui/context-menu` |
| Переключатель (toggle) | Toggle | `@/components/ui/toggle` |
| Группа переключателей | ToggleGroup | `@/components/ui/toggle-group` |
| Разделитель | Separator | `@/components/ui/separator` |
| Label | Label | `@/components/ui/label` |

⚠️ **Не создавай собственные реализации** для компонентов, которые shadcn покрывает.
Кастомный код — только для того, чего нет (цветовая палитра `type === 'color'` в PropertyField,
или Html-поповер над 3D-объектом через `@react-three/drei`).

Стилизация shadcn — через Tailwind-классы (`className` на компонентах) и через атрибуты
состояния Base UI: `aria-pressed:` (вместо Radix `data-[state=on]`), `data-[highlighted]`,
`data-[disabled]`, `data-[side=...]`. ContextMenu.Item использует `onClick` (не `onSelect`).

**ToggleGroup (Base UI):** value всегда массив (`value: string[]`), нет `type="single"`.
Для single-select: `value={[activeValue]} onValueChange={(vals) => vals.length > 0 && set(vals[0])}`.

**TooltipProvider** должен быть один на всё приложение — добавлен в `AppLayout.tsx`.
Для Tooltip+Toggle в риббоне используется `render` prop на `TooltipTrigger` (не `asChild`).

**Тестирование shadcn Select:** `@/components/ui/select` мокируется нативным `<select>` в тест-файлах
через `vi.mock('@/components/ui/select', ...)` — экспортирует `Select`, `SelectTrigger`,
`SelectValue`, `SelectContent`, `SelectItem`. Это позволяет использовать `getByRole('combobox')`,
`getByRole('option')` и `fireEvent.change`.

**Добавить новый компонент:** `npx shadcn@latest add <name>` — файл появится в `src/components/ui/`.
Конфиг shadcn — `components.json` в `apps/frontend/`.

---

## Структура проекта

### Монорепозиторий (корень)

```
roomtool/
├── apps/
│   ├── frontend/            # React-приложение (Vite)
│   └── backend/             # Go API-сервер
├── .github/workflows/ci.yml # GitHub Actions CI
├── docker-compose.yml       # frontend + backend + postgres
├── pnpm-workspace.yaml      # pnpm workspaces: apps/*
└── package.json             # workspace root (scripts → frontend)
```

### Backend (`apps/backend/`)

```
apps/backend/
├── cmd/
│   └── server/
│       └── main.go          # точка входа: HTTP-сервер на :8080
├── internal/                # бизнес-логика (пусто, заполнять здесь)
├── Dockerfile               # multi-stage: golang:1.23-alpine → alpine:3.21
├── .air.toml                # hot-reload конфиг
├── .env.example             # PORT, DATABASE_URL
└── go.mod                   # module github.com/kirillgalimov/roomtool/backend
```

### Frontend (`apps/frontend/`)

```
src/
├── config/
│   └── scene.ts          # Размеры комнаты и камеры — менять только здесь
├── types/
│   └── index.ts          # CatalogItem, SceneItem, PropertyDef (types: number|select|material|color)
├── catalog/
│   ├── items.ts          # Хардкод каталога (~19 деталей, 6 категорий)
│   └── materials.ts      # MATERIAL_OPTIONS, MATERIAL_COLORS (материал → цвета)
├── store/
│   ├── sceneStore.ts     # items, groups, выделение, history/future, все мутации
│   ├── uiStore.ts        # sceneMode '2d'|'3d', activeRightPanelTab 'catalog'|'layers', showGizmo, showCeilingLight
│   ├── defaultScene.ts   # DEFAULT_SCENE_ITEMS / DEFAULT_SCENE_GROUPS — стартовая сцена
│   └── index.ts          # реэкспорт
├── components/
│   ├── scene/
│   │   ├── SceneCanvas.tsx          # R3F Canvas (только 3D) + монтирует Scene2DView в 2D
│   │   ├── Scene2DView.tsx          # Чистый SVG-план (2D): pan/zoom, сетка, линейки, размерные линии
│   │   ├── Room.tsx                 # Пол + стены (размеры из config; только в 3D-Canvas)
│   │   ├── SceneElement.tsx         # Один элемент: mesh/GLTF + drag через useMeshDrag
│   │   ├── useMeshDrag.ts           # Хук: drag выделенного элемента мышью (без гизмо), тот же store API
│   │   ├── TransformProxy.tsx       # Gizmo перемещения для 1..N выделенных (pivot + drag-сессия)
│   │   ├── ResizeHandles.tsx        # 6 ручек по центрам граней для одиночного выделения (resize-сессия)
│   │   ├── SceneControls.tsx        # OrbitControls (forwardRef)
│   │   ├── SceneRibbon.tsx          # Лента (Ribbon): layout-обёртка, компонует ribbon/
│   │   ├── ribbon/
│   │   │   ├── ViewModeToggle.tsx   # Переключатель 2D / 3D
│   │   │   ├── GizmoToggle.tsx      # Toggle гизмо
│   │   │   ├── CeilingLightToggle.tsx  # Toggle потолочного света
│   │   │   ├── AlignmentPopover.tsx # Кнопка + поповер выравнивания (иконки внутри)
│   │   │   ├── ItemActionsGroup.tsx # Поворот влево/вправо + удаление выделенного элемента
│   │   │   └── ResetSceneButton.tsx # Кнопка сброса сцены с confirm-диалогом
│   │   ├── SceneOverlay.tsx         # Оверлей поверх canvas: W/H/D выделенного элемента; при мультивыборе — bounding box всего выделения
│   │   └── ElevationSlider.tsx      # Вертикальный ползунок высоты (Y) выделения (одного или нескольких); скрыт при showGizmo
│   ├── panels/
│   │   ├── RightPanel.tsx        # Вкладки Каталог/Слои; при выделении — PropertiesPanel
│   │   ├── CatalogPanel.tsx      # Каталог с поиском и аккордеоном
│   │   ├── LayersPanel.tsx       # Дерево слоёв, мультивыбор, группы, контекст-меню, toggle видимости (👁)
│   │   ├── PropertiesPanel.tsx   # Форма свойств выбранного элемента
│   │   └── PropertyField.tsx     # Поле (number / select / material / color)
│   └── ui/
│       ├── AppLayout.tsx              # Корневой flex layout (сцена + панель) + TooltipProvider
│       ├── ScreenGuard.tsx            # Заглушка для экранов < 1024px
│       ├── ToolbarToggleButton.tsx    # Переиспользуемая toggle-кнопка с тултипом для Ribbon
│       ├── button.tsx / label.tsx / select.tsx / separator.tsx  # shadcn-компоненты
│       ├── toggle.tsx / toggle-group.tsx / tooltip.tsx / context-menu.tsx
│       └── (добавлять: npx shadcn@latest add <name>)
├── lib/
│   └── utils.ts          # cn() helper (clsx + tailwind-merge), используется shadcn-компонентами
├── utils/
│   ├── collision.ts      # totalOverlapVolume / hasGroupCollision / clampGroupDelta / clampGroupDeltaAgainstItems (AABB)
│   ├── clampToRoom.ts    # Удержание элемента в границах комнаты (чистая функция)
│   ├── groupTransform.ts # computeGroupCenter / groupDragDelta / pivotPositionOnChange
│   ├── layerTree.ts      # buildLayerTree / flattenLayerTree / getAllItemIdsInGroup / buildFlatOrder / rangeSelection — дерево для LayersPanel
│   ├── locked.ts         # isItemEffectivelyLocked — проверка блокировки элемента (прямой флаг + родительские группы)
│   └── roomCoords.ts     # worldToRoomX/Z / roomToWorldX/Z — перевод мировых координат в систему «от угла комнаты»
├── test/
│   └── setup.ts          # @testing-library/jest-dom
├── store/
│   └── persistence.ts    # LocalStorage-адаптер: saveScene / loadScene / clearScene (SceneSnapshot v1)
└── main.tsx              # Рендер: ScreenGuard > AppLayout (SceneCanvas + RightPanel) + Toaster
```

---

## Ключевые соглашения

### Единицы измерения
**1 unit Three.js = 1 мм.** Все размеры в коде и UI — в миллиметрах.
`BoxGeometry(900, 2200, 600)` = шкаф 900×2200×600 мм.

### Размеры комнаты
Берутся **только** из `src/config/scene.ts`. Не хардкодить числа в компонентах.

```typescript
import { SCENE_CONFIG } from '@/config/scene'
// SCENE_CONFIG.room.width / .depth / .height
```

### Позиция элементов
- Новый элемент: `position = [0, height/2, 0]` (центр комнаты, стоит на полу)
- Ось Y — вертикаль. `y = height/2` означает что низ элемента на полу (y=0)
- **Мировые координаты центрированы** вокруг `(0,0,0)`: комната занимает `[-width/2, width/2]`
  по X и `[-depth/2, depth/2]` по Z. В этой системе живут стор, gizmo, коллизии, `clampToRoom`.
- **Пользователю** X/Z показываются **от дальнего угла комнаты** (где сходятся задняя и левая
  стены) через `utils/roomCoords.ts` — так координаты положительны и читаются как смещение от
  угла. Y показывается от пола (вычитанием `height/2`). Мировую систему ради этого не сдвигаем.

### Перемещение элементов — единый источник истины
⚠️ **Ключевая договорённость.** Позиция элемента живёт **только** в сторе (`item.position`).
Three.js-объекты рендерятся из стора (`<group position={item.position}>`) и **никогда** не
мутируются императивно. Это убирает класс багов «стор разошёлся с визуалом» (элемент
снапится назад / теряет индивидуальное перемещение).

Два способа запустить drag-сессию — оба пишут через одни и те же store-примитивы:

1. **Гизмо (`TransformProxy`)** — стрелки TransformControls. Pivot прицеплен к невидимому
   мешу в центре выделения; отдаёт дельту → `dragSelectionBy()` → перерисовка.
   Показывается при одиночном выделении или когда выделение точно совпадает с группой.

2. **Прямой drag меша (`useMeshDrag`)** — клик+перетаскивание прямо по телу элемента.
   Активируется, если элемент уже выбран в момент `pointerdown`. Drag plane горизонтальная
   (Y = Y-координата точки клика), поэтому элемент движется только по XZ. Если
   TransformProxy уже взял сессию (`dragSession !== null`), хук отступает.

- **Не добавляй второй TransformControls на сам элемент** и не возвращай теневые ref-копии
  позиции (`lastFramePos` и т.п.) — это источник прошлых регрессий.

### Drag-сессия в сторе
Интерактивное перемещение — это `beginDrag(ids)` → `dragSelectionBy(delta)` (каждый кадр,
**без** истории) → `endDrag(commit)`. `beginDrag` снимает полный pre-drag снапшот; `dragSelectionBy`
применяет дельту относительно стартовых позиций; `endDrag(true)` коммитит **один** undo-шаг на
весь жест, `endDrag(false)` откатывает только при нулевом смещении. Дельта клампится по стенам
(`clampGroupDelta`) и затем по другим элементам (`clampGroupDeltaAgainstItems`) — и в
`TransformProxy`, и в `useMeshDrag` (оба вызывают `groupDragDelta`) — see «Проверка коллизий». `moveGroup()` остаётся отдельным one-shot
delta+история примитивом (тесты, потенциальные хоткеи).

### Resize-сессия в сторе
Интерактивное изменение размеров — `beginResize()` → `resizeLive(id, dimensions, position)` (каждый
кадр, **без** истории) → `endResize(commit)`. Точно зеркалит паттерн drag-сессии. `ResizeHandles`
монтируется в SceneCanvas при одиночном выделении видимого не-GLTF элемента; показывает 6 ручек
по центрам граней (±X красные, ±Y зелёные, ±Z синие). Противоположная грань зафиксирована как
якорь — при перетаскивании ручки изменяется размер **и** центр объекта. Ограничения: мин 10 мм,
макс 10 000 мм; нижняя грань не уходит ниже пола, верхняя — выше потолка. ESC откатывает.
Resize-сессия несовместима с активной drag-сессией: `onHandleDown` проверяет `dragSession !== null`.
При unmount компонента (снятие выделения во время drag) `useEffect`-cleanup откатывает сессию.

### Конфликт TransformControls и OrbitControls
Решается через `window.dispatchEvent`:
```typescript
// В TransformProxy при начале drag:
window.dispatchEvent(new CustomEvent('transform-start'))
// В TransformProxy при отпускании:
window.dispatchEvent(new CustomEvent('transform-end'))
// В SceneControls — подписка на эти события для enable/disable OrbitControls
```

### Клавиатура
Глобальной системы хоткеев нет (прежний `useKeyboard`/`KeyboardShortcuts` удалён).
Клавиатура используется точечно:
- **LayersPanel**, инпут переименования группы: `Enter` — подтвердить, `Escape` — отменить.
- **Мультивыбор кликом** в LayersPanel: `Ctrl`/`Cmd` — добавить/убрать из выделения, `Shift` — выбрать диапазон.

⚠️ `undo`/`redo` реализованы в сторе, но **сейчас ни к чему не привязаны** (нет ни кнопки, ни хоткея). Если добавляешь привязку — делай её здесь.

### Undo/Redo
Реализован в `sceneStore` через два стека (`history`, `future`, лимит 50).
Снимок истории хранит и `items`, и `groups`. Каждая мутирующая операция
(add/remove/removeItems/update/rotate + групповые: createGroup/ungroup/moveGroup/removeGroup)
вызывает `pushHistory` перед изменением. Интерактивный drag — особый случай: `beginDrag`
снимает снапшот, `endDrag(true)` кладёт его в историю **одним** шагом (см. «Drag-сессия»),
а `dragSelectionBy` в историю не пишет. Аналогично: `beginResize()` снимает снапшот,
`endResize(true)` кладёт в историю **одним** шагом, а `resizeLive` в историю не пишет.
`selectItem`/`selectItems`/`editItem`/`closeEditing`/`renameGroup`/`toggleGroupCollapse`/`toggleItemVisibility`/`toggleGroupVisibility`/`toggleItemLocked`/`toggleGroupLocked` — **не** попадают в историю.
`alignItems(alignment)` — **попадает** в историю (один undo-шаг на всё выравнивание).

### Группы, выделение и слои
- Три независимых поля состояния: `selectedItemId` (одиночное выделение → gizmo),
  `selectedItemIds` (мультивыбор) и `editingItemId` (**кого редактируем → открывает
  PropertiesPanel**). Редактирование развязано с выделением: обычный клик НЕ открывает свойства.
- **Открытие PropertiesPanel — только явный жест:** двойной клик по элементу в сцене
  (`SceneElement.onDoubleClick`) или ПКМ в LayersPanel → «Редактировать». Оба зовут
  `editItem(id)` (ставит `editingItemId` + выделяет одиночно). Закрытие — крестик в шапке
  панели → `closeEditing()` (сбрасывает только `editingItemId`, выделение/gizmo остаются).
- `editItem`/`closeEditing` — **не** попадают в историю (UI-состояние, как `selectItem`).
  `editingItemId` сбрасывается, если редактируемый элемент исчезает (`removeItem`/`removeGroup`/
  `undo`/`redo`) либо выделение уходит на другой элемент (`selectItem` другого id /
  `selectItems` / `toggleItemSelection`) — панель и gizmo всегда согласованы.
- 3D-клик по элементу → `selectItem()`. Клик в LayersPanel → `selectItems()`/`toggleItemSelection()`.
- **Блокировка элементов.** `SceneItem.locked` и `SceneGroup.locked` — независимые флаги (не каскадируют
  на уровне стора). Фактическая блокировка: `isItemEffectivelyLocked(item, groups)` из `utils/locked.ts`
  — возвращает `true` если `item.locked` или любая родительская группа `locked`. Заблокированный элемент
  можно выделить, но нельзя: перетащить (useMeshDrag, TransformProxy), изменить размер (ResizeHandles не
  монтируется), открыть PropertiesPanel двойным кликом или через контекстное меню. Гизмо скрывается.
  `SceneElement` получает `locked` как проп от `SceneCanvas` — не подписывается на `groups` самостоятельно,
  чтобы не вызывать лишние re-render всех элементов при любом изменении групп.
  В LayersPanel элементы в заблокированной группе показывают иконку замка (серую, `cursor-not-allowed`) —
  клик по ней не переключает `item.locked` (нужно разблокировать группу).
- `createGroup()` требует ≥2 выделенных; элемент состоит максимум в одной группе.
  Если все выделенные элементы имеют **одинаковый** прямой `groupId`, новая группа создаётся
  вложенной (`parentGroupId = общий родитель`). Иначе — на корневом уровне.
  Группа авто-распускается (solo-member → `groupId: null`) только если у неё ≤1 прямых участников
  **и нет дочерних групп**. Группа с дочерними группами сохраняется, даже если прямых участников нет.
- **Вложенные группы.** `SceneGroup.parentGroupId?: string | null` — определяет иерархию.
  Вложенность неограничена. Клик по заголовку группы выделяет **все** элементы рекурсивно
  (`getAllItemIdsInGroup` из `utils/layerTree.ts`). `LayersPanel` рендерит дерево рекурсивно.
- `moveGroup()` / `removeGroup()` работают рекурсивно по всему поддереву.
  `ungroupItems()` перемещает прямых участников к родительской группе (если есть), иначе в корень;
  дочерние группы поднимаются на уровень выше.
- `moveGroup()` двигает **всех** участников поддерева и клампит по полу (`y ≥ height/2`).

### Проверка коллизий
`totalOverlapVolume()` из `utils/collision.ts` (AABB) считает суммарный объём пересечения.
Перемещение идёт через `TransformProxy`:
- **во время drag** — дельта сначала клампится по стенам `clampGroupDelta()`, затем по другим
  элементам `clampGroupDeltaAgainstItems()`. Обе функции работают против снапшота позиций на
  старте drag (`startItemsRef`), так что дельта всегда относительна начала жеста;
- **на отпускании** — `endDrag(true)` всегда коммитит; проникновение предотвращено per-frame.

`clampGroupDeltaAgainstItems` — скользящий клампинг: ось X блокируется только если Y и Z уже
перекрываются, и т.д. Это позволяет скользить вдоль поверхности. Пары с пред-существующим
полным 3D-перекрытием (all 3 axes) пропускаются — иначе элементы, размещённые внутри других
(конструктивные примыкания), залипали бы и не могли двигаться.

`clampToRoom()` — отдельная чистая функция (границы комнаты), покрыта тестами.
`hasGroupCollision` и `totalOverlapVolume` сохранены как утилиты (не удалять).

⚠️ **Известные ограничения:**
- AABB-проверка не учитывает поворот элементов. Повёрнутый на 90° корпус 900×600 мм
  проверяется как 900×600, а не 600×900. Допустимо для MVP.
- Пары с конструктивным AABB-перекрытием (например, задняя стенка внутри боковин в дефолтном
  шкафу) не блокируются при drag друг через друга — это цена anti-lockout поведения для
  пред-существующих перекрытий.
- **Скрытые элементы (`hidden: true`) участвуют в коллизии** — `clampGroupDeltaAgainstItems`
  использует снапшот `state.items` целиком, не фильтруя по `hidden`. Скрытый элемент остаётся
  препятствием для движения. Допустимо для MVP.

### Tailwind v4
Используется через Vite-плагин (`@tailwindcss/vite`). Импорт в CSS: `@import "tailwindcss"`.
Нет `tailwind.config.js` — конфигурация через CSS-переменные.

### Уведомления
Sonner подключён через `<Toaster />` в `main.tsx`. Вызов из любого места:
```typescript
import { toast } from 'sonner'
toast.warning('Элементы не могут пересекаться')
```

---

## Режимы сцены

Переключатель 2D/3D находится в `SceneRibbon` (лента над Canvas), а не в `SceneOverlay`.

| | 3D | 2D |
|--|----|----|
| Рендер | R3F Canvas (`PerspectiveCamera`) | Чистый SVG (`Scene2DView`) — без Three.js |
| Навигация | OrbitControls (rotate + pan + zoom) | Pan мышью + zoom колёсиком (нативные события) |
| Стены | видимы | — (R3F Canvas не монтируется) |
| Сетка | нет | SVG-сетка с адаптивным шагом (100/500/1000 мм) |
| Линейки | нет | Горизонтальная + вертикальная (мм от угла комнаты) |
| Размеры элементов | нет | Архитектурные выноски при выделении одного элемента |
| Выбор элемента | клик → `selectItem` | клик → `selectItem` (мультивыбор только в LayersPanel) |

---

## Лента (Ribbon)

`SceneRibbon.tsx` — горизонтальная панель (~40 px) над Canvas. Всегда видима. Является тонкой layout-обёрткой; логика и состояние вынесены в `src/components/scene/ribbon/`.

**Группы кнопок:**
- **Вид**: переключатель 2D/3D; toggle гизмо (`showGizmo`); toggle потолочного освещения (`showCeilingLight`)
- **Выравнивание**: одна кнопка-триггер (disabled при `selectedItemIds.length < 2`) → открывает shadcn Popover с 9 иконками, сгруппированными по осям X / Y / Z (по 3 кнопки в каждой группе); закрытие по клику снаружи и Escape — нативное поведение Base UI
- **Действия над элементом** (`ItemActionsGroup`): поворот влево / вправо / удаление — три кнопки, disabled при `selectedItemIds.length !== 1`; вызывают `rotateItem(id, direction)` и `removeItem(id)` из sceneStore
- **Сброс сцены** (`ResetSceneButton`): всегда активна; показывает `window.confirm`, затем вызывает `resetScene()` из sceneStore

**Состояние в uiStore:** `showGizmo: boolean`, `toggleGizmo()`, `showCeilingLight: boolean`, `toggleCeilingLight()`

**`ToolbarToggleButton`** — переиспользуемый компонент (`src/components/ui/ToolbarToggleButton.tsx`) для toggle-кнопок с тултипом в риббоне. Props: `pressed`, `onPressedChange`, `tooltip: string | (pressed) => string`, `aria-label`.

⚠️ **Композиция Tooltip + Toggle (Radix):** нельзя использовать `Tooltip.Trigger asChild` напрямую на `Toggle.Root` — Tooltip перезаписывает `data-state` кнопки своим (`"closed"`/`"open"`), и стили `data-[state=on]` перестают работать. Правильный паттерн: обернуть `Toggle.Root` в `<span tabIndex={-1}>` и сделать `asChild` на нём.

**Экшн в sceneStore:** `alignItems(alignment: AlignmentType)` — выравнивает выделенные элементы по грани/центру, пишет в историю.

`AlignmentType`: `left | right | centerX | top | bottom | centerY | front | back | centerZ`

⚠️ `alignItems` не клампит результат к границам комнаты — элементы могут выйти за стены. `centerX/Y/Z` вычисляют **среднее арифметическое центров** (не центр bounding box выделения). Оба поведения намеренны для MVP.

---

## Каталог деталей

Шесть категорий, ~19 деталей. Добавлять новые — в `src/catalog/items.ts`. Каталог материалов и цветов — в `src/catalog/materials.ts`.

**Все размеры редактируемы** — нет фиксированных значений. Числа ниже — умолчания при добавлении детали.

| Категория | id | Умолчания (мм) |
|-----------|-----|---------------|
| Корпус | `side-panel` | 16 × 2200 × 600 |
| Корпус | `top-panel` | 868 × 16 × 600 |
| Корпус | `bottom-panel` | 868 × 16 × 600 |
| Корпус | `back-panel` | 900 × 2200 × 8 |
| Наполнение | `shelf` | 860 × 16 × 560 |
| Наполнение | `divider-vertical` | 16 × 2168 × 560 |
| Наполнение | `hanging-rod` | 860 × 25 × 25 |
| Наполнение | `drawer-box` | 860 × 180 × 500 |
| Наполнение | `trouser-rack` | 860 × 50 × 300 |
| Двери и фасады | `door-hinged` | 450 × 2200 × 18 |
| Двери и фасады | `door-sliding` | 900 × 2200 × 22 |
| Двери и фасады | `drawer-front` | 860 × 196 × 18 |
| Основание | `plinth` | 900 × 100 × 16 |
| Основание | `cornice` | 900 × 60 × 60 |
| Основание | `leg` | 30 × 100 × 30 |
| Фурнитура | `handle-bar` | 128 × 12 × 30 |
| Фурнитура | `handle-knob` | 30 × 30 × 25 |
| Фурнитура | `hinge` | 35 × 13 × 50 |
| Декорации | `house-plant-1` | 600 × 1200 × 600 (bounding box, 100%) |

### Система материалов и цветов

PropertyDef поддерживает два новых типа — `'material'` и `'color'`. Логика и доступные варианты — в `src/catalog/materials.ts`.

```typescript
// type === 'material': select из доступных для данной детали материалов
// type === 'color': палитра цветов, зависит от выбранного материала
interface PropertyDef {
  key: string
  label: string
  type: 'number' | 'select' | 'material' | 'color'
  dependsOnMaterial?: string  // для type === 'color': ключ поля-материала
  ...
}
```

Карта материал → цвета хранится в `MATERIAL_COLORS` в `src/catalog/materials.ts`.
При смене материала — цвет автоматически сбрасывается на первый цвет нового материала.
Для Стекла в SceneElement применяется `opacity={0.4} transparent`.

Цвет детали в 3D: `item.properties.color` — hex-строка, применяется как `meshStandardMaterial color`.

### GLTF-элементы (категория «Декорации»)

Элементы с `render: { type: 'gltf'; src: string }` рендерятся через `useGLTF` + `<primitive>` вместо `BoxGeometry`.
GLB-файлы хранятся в `public/models/`.

Масштабирование: модель равномерно масштабируется, чтобы вписаться в `defaultDimensions * (scale/100)`.
В PropertiesPanel такие элементы показывают ползунок **Размер (%)** вместо отдельных W/H/D полей.
При изменении scale пересчитываются `dimensions` в SceneItem — AABB-коллизия работает корректно.

⚠️ Масштабирование равномерное (`Math.min` по трём осям) — модель сохраняет пропорции, но может не заполнять весь bounding box.

---

## Тесты

Юнит-тесты (Vitest + @testing-library/react). Файлы рядом с источником: `*.test.ts(x)`.
Покрыто: `sceneStore` (мутации, группы, вложенные группы, undo/redo, drag-сессия, resize-сессия, инициализация material/color, resetScene, инициализация из localStorage),
`persistence` (saveScene, loadScene, clearScene — все edge cases),
`uiStore`, `catalog/items`, `collision`, `clampToRoom`, `groupTransform`, `layerTree`
(`buildLayerTree`, `flattenLayerTree`, `getAllItemIdsInGroup`), `PropertiesPanel`
(форма, сброс цвета, GLTF-scale), `PropertyField`, `ScreenGuard`.

**Тест инициализации стора из localStorage** (`sceneStore.persistence-init.test.ts`) — отдельный файл с `vi.mock('./persistence')`, т.к. `loadScene()` вызывается на уровне модуля при первом импорте. `vi.resetModules()` + динамический `import('./sceneStore')` внутри теста.

**Компоненты 3D-сцены (R3F) не тестируются** — Three.js не работает в jsdom (нет WebGL).
Поэтому чистую логику выноси из R3F-компонентов в `utils/` и покрывай там — как сделано с
`clampToRoom` (вынесен из `SceneElement`). 3D-поведение проверяется вручную через Playwright.

**Покрытие.** `pnpm test:coverage` считает покрытие (v8) по `store/utils/catalog` и проверяет
пороги (`vite.config.ts` → `test.coverage.thresholds`). Пороги — «пол регрессии», снижать нельзя,
поднимать по мере роста покрытия.

## Playwright / браузерная проверка

Скриншоты Playwright сохранять **только в `tmp/`** (папка в корне проекта, добавлена в `.gitignore`) — никогда напрямую в корень проекта и не в `src/`.
Пример: `browser_take_screenshot({ filename: 'tmp/task022-check.png' })`.

---

## Персистентность сцены

`src/store/persistence.ts` — адаптер хранилища. Ключ `roomtool_scene_v1` в localStorage. Формат: `SceneSnapshot { version: 1, items, groups }`.

**Не сохраняется:** `history`/`future` (бессмысленны между сессиями), `selectedItemId*`, `editingItemId`, `groupCounter`, `uiStore`.

**Автосохранение:** `useSceneStore.subscribe(...)` с debounce 500 мс — пишет при любом изменении стора. Первый вызов не происходит при инициализации (subscribe Zustand не реагирует на начальное состояние).

**Инициализация:** `loadScene()` вызывается один раз на уровне модуля (`const _saved = loadScene()`). Если снапшот невалиден или отсутствует — используется `DEFAULT_SCENE_ITEMS/GROUPS`.

**`resetScene()`** — пишет в историю (undo работает), очищает localStorage, сбрасывает `dragSession`/`resizeSession`. Вызов `clearScene()` — **снаружи** `set()`, не внутри updater (side effect в updater нарушает idempotency).

---

## Что не делаем (скоуп MVP)

- Авторизация / аутентификация
- Скрытие элементов (только удаление)
- Импорт/экспорт 3D-моделей
- Мобильные устройства (< 1024px → заглушка)

> Мультивыбор и группы — **уже реализованы** (LayersPanel, см. «Группы, выделение и слои»), из скоупа-исключений убраны.

---

## Навигация по документации

| Документ | Назначение |
|----------|-----------|
| `docs/mvp.md` | Требования, must/nice/не делать |
| `docs/user-flows.md` | Пользовательские сценарии |
| `docs/roadmap.md` | Этапы реализации |
| `docs/TODO.md` | Отложенные решения (вернуться позже) |
| `ARCHITECTURE.md` | Детальная архитектура, типы, алгоритмы |
| `BACKLOG.md` | 20 задач с промптами для последовательной разработки |
