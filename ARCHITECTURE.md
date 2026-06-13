# Техническая архитектура MVP — RoomTool

> Роль: CTO стартапа  
> Дата обновления: 2026-06-13  
> Контекст: Frontend-only приложение для проектирования шкафов

---

## 1. Обзор продукта

**RoomTool** — браузерный 3D-редактор для дизайнеров мебели. Пользователь видит комнату (две стены + пол), из правой панели добавляет мебельные элементы на сцену, двигает их по трём осям, поворачивает, настраивает размеры. Backend отсутствует намеренно.

Аналог: **Binaroom** — полноценная SaaS-платформа. Мы делаем только 3D-сцену и управление элементами.

---

## 2. Технический стек

### Ядро

| Слой | Решение | Обоснование |
|------|---------|-------------|
| Фреймворк | **React 18 + TypeScript** | Индустриальный стандарт, строгая типизация |
| Сборка | **Vite 6** | Быстрый HMR, нативный ESM, минимальная конфигурация |
| 3D движок | **Three.js + @react-three/fiber** | Декларативный React-рендерер Three.js, огромная экосистема |
| Хелперы R3F | **@react-three/drei** | OrbitControls, TransformControls, Html, Grid — всё готовое |
| Стейт | **Zustand** | Минималистичный, нет бойлерплейта, перфект для 3D-апп |
| Стили | **Tailwind CSS v4** | Утилитарный CSS, быстрая разработка UI |
| UI-примитивы | **shadcn/ui (Base UI)** | Копируемые компоненты поверх @base-ui/react |
| Уведомления | **Sonner** | Лёгкий toast-менеджер, нужен для коллизий и ошибок |

### Качество кода

| Инструмент | Решение |
|------------|---------|
| Линтер | ESLint v9 (flat config) + `eslint-plugin-react-hooks` |
| Форматтер | Prettier |
| Тесты | Vitest + @testing-library/react |
| TypeScript | Strict mode, `"moduleResolution": "bundler"` |
| Менеджер пакетов | pnpm |

### Почему именно этот стек?

- **R3F вместо Babylon.js** — нативная интеграция с React, хуки, стейт не ломает 3D-рендер.
- **Zustand вместо Redux** — 3D-сцена требует частых обновлений (drag, resize). Zustand: `set()` → рендер только подписанных компонентов.
- **Tailwind v4 вместо CSS Modules** — правая панель с формами — чисто утилитарный UI, Tailwind быстрее.
- **shadcn/ui вместо Radix напрямую** — копируемые компоненты в `src/components/ui/`, стилизуются через Tailwind и Base UI атрибуты состояния.
- **Sonner вместо самописного** — нотификации нужны вне React-дерева (из store). Sonner вызывается напрямую через `toast()`.

---

## 3. Единицы измерения и конфигурация

### Единицы измерения

**1 unit в Three.js = 1 мм.** Все размеры в UI и в 3D-сцене в миллиметрах.

Пример: корпус шкафа 900 × 2200 × 600 мм → `BoxGeometry(900, 2200, 600)`.

### Конфигурационный файл сцены

Все параметры комнаты вынесены в `src/config/scene.ts`:

```typescript
export const SCENE_CONFIG = {
  room: {
    width: 4000,   // мм, X
    depth: 4000,   // мм, Z
    height: 3000,  // мм, Y
  },
  camera: {
    initialPosition: [2500, 2500, 2500] as const,
    fov: 50,
    minDistance: 500,
    maxDistance: 8000,
  },
}
```

Разработчик меняет размеры только здесь — компоненты читают из конфига.

---

## 4. Архитектура приложения

### Структура папок

```
src/
├── config/
│   └── scene.ts                     # Параметры комнаты и камеры — менять только здесь
├── types/
│   └── index.ts                     # CatalogItem, SceneItem, SceneGroup, PropertyDef
├── catalog/
│   ├── items.ts                     # Хардкод каталога (~19 деталей, 6 категорий)
│   └── materials.ts                 # MATERIAL_OPTIONS, MATERIAL_COLORS (материал → цвета)
├── store/
│   ├── sceneStore.ts                # items, groups, выделение, drag/resize сессии, history/future
│   ├── uiStore.ts                   # sceneMode, activeRightPanelTab, showGizmo, showCeilingLight
│   ├── defaultScene.ts              # DEFAULT_SCENE_ITEMS / DEFAULT_SCENE_GROUPS — стартовая сцена
│   └── index.ts                     # Реэкспорт
├── components/
│   ├── scene/
│   │   ├── SceneCanvas.tsx          # R3F Canvas (3D) + монтирует Scene2DView в 2D
│   │   ├── Scene2DView.tsx          # Чистый SVG-план (2D): pan/zoom, сетка, линейки
│   │   ├── Room.tsx                 # Пол + стены (только в 3D)
│   │   ├── SceneElement.tsx         # Один элемент: mesh/GLTF + drag через useMeshDrag
│   │   ├── useMeshDrag.ts           # Хук: прямой drag элемента мышью (без гизмо)
│   │   ├── TransformProxy.tsx       # Gizmo перемещения для 1..N выделенных
│   │   ├── ResizeHandles.tsx        # 6 ручек по граням для resize одиночного элемента
│   │   ├── SceneControls.tsx        # OrbitControls (forwardRef)
│   │   ├── SceneRibbon.tsx          # Горизонтальная лента над canvas
│   │   ├── ribbon/
│   │   │   ├── ViewModeToggle.tsx   # Переключатель 2D / 3D
│   │   │   ├── GizmoToggle.tsx      # Toggle гизмо
│   │   │   ├── CeilingLightToggle.tsx
│   │   │   ├── AlignmentPopover.tsx # 9 кнопок выравнивания
│   │   │   └── ItemActionsGroup.tsx # Поворот + удаление
│   │   └── SceneOverlay.tsx         # Координаты и размеры выделенного элемента
│   ├── panels/
│   │   ├── RightPanel.tsx           # Вкладки Каталог/Слои; при редактировании — PropertiesPanel
│   │   ├── CatalogPanel.tsx         # Каталог с поиском и аккордеоном
│   │   ├── LayersPanel.tsx          # Дерево слоёв, мультивыбор, группы, контекст-меню
│   │   ├── PropertiesPanel.tsx      # Форма свойств редактируемого элемента
│   │   └── PropertyField.tsx        # Поле (number / select / material / color)
│   └── ui/
│       ├── AppLayout.tsx            # Корневой flex layout + TooltipProvider
│       ├── ScreenGuard.tsx          # Заглушка для экранов < 1024px
│       ├── ToolbarToggleButton.tsx  # Toggle-кнопка с тултипом для Ribbon
│       └── (shadcn-компоненты: button, select, tooltip, toggle, context-menu, …)
├── utils/
│   ├── collision.ts                 # totalOverlapVolume / hasGroupCollision / clampGroupDelta / clampGroupDeltaAgainstItems
│   ├── clampToRoom.ts               # Удержание элемента в границах комнаты
│   ├── groupTransform.ts            # computeGroupCenter / groupDragDelta / pivotPositionOnChange
│   ├── layerTree.ts                 # buildLayerTree / flattenLayerTree / getAllItemIdsInGroup / buildFlatOrder / rangeSelection
│   ├── locked.ts                    # isItemEffectivelyLocked (прямой флаг + родительские группы)
│   └── roomCoords.ts                # worldToRoomX/Z / roomToWorldX/Z — координаты от угла комнаты
├── lib/
│   └── utils.ts                     # cn() helper (clsx + tailwind-merge)
├── test/
│   └── setup.ts                     # @testing-library/jest-dom
└── main.tsx
```

### Модели данных

```typescript
// Элемент в каталоге (тип детали)
interface CatalogItem {
  id: string
  name: string
  category: string
  defaultDimensions: { width: number; height: number; depth: number }  // мм
  properties: PropertyDef[]
  render?: { type: 'gltf'; src: string }  // GLTF-модель из /public/models/
}

interface PropertyDef {
  key: string
  label: string
  type: 'number' | 'select' | 'material' | 'color'
  unit?: string
  min?: number
  max?: number
  default?: number | string
  options?: { label: string; value: string }[]
  dependsOnMaterial?: string  // для type === 'color': ключ поля материала
}

// Экземпляр элемента на сцене
interface SceneItem {
  id: string                                   // uuid
  catalogId: string                            // ссылка на CatalogItem
  name: string
  position: [number, number, number]           // x, y, z в мм (мировые координаты, центр объекта)
  rotationY: number                            // поворот по оси Y (рад)
  dimensions: { width: number; height: number; depth: number }  // мм
  properties: Record<string, number | string>
  groupId: string | null                       // null = не в группе
  hidden?: boolean                             // скрыт в сцене (всё ещё участвует в коллизиях)
  locked?: boolean                             // нельзя перемещать/редактировать
}

// Группа элементов (Photoshop-style layers)
interface SceneGroup {
  id: string                 // uuid
  name: string               // 'Группа 1', 'Шкаф' и т.д.
  itemIds: string[]          // прямые участники (не рекурсивно)
  collapsed: boolean         // свёрнута ли в панели слоёв
  hidden?: boolean           // скрыта ли группа и все вложенные элементы
  locked?: boolean           // заблокирована ли группа
  parentGroupId?: string | null  // id родительской группы; null/undefined = корневой уровень
}

// Снимок для Undo/Redo
type HistorySnapshot = { items: SceneItem[]; groups: SceneGroup[] }

// Drag-сессия (начинается в beginDrag, заканчивается в endDrag)
interface DragSession {
  snapshot: HistorySnapshot          // состояние до начала drag
  startPositions: Record<string, [number, number, number]>  // позиции до drag
}

// Resize-сессия (начинается в beginResize, заканчивается в endResize)
interface ResizeSession {
  snapshot: HistorySnapshot
}

// Zustand store — сцена
interface SceneStore {
  items: SceneItem[]
  groups: SceneGroup[]
  selectedItemId: string | null        // = selectedItemIds[0] ?? null
  selectedItemIds: string[]            // мультивыбор
  editingItemId: string | null         // кто открыт в PropertiesPanel
  groupCounter: number                 // автоинкремент для имён групп
  history: HistorySnapshot[]           // стек прошлых состояний (до 50)
  future: HistorySnapshot[]
  dragSession: DragSession | null
  resizeSession: ResizeSession | null

  // Мутации (пишут в историю)
  addItem: (catalogItem: CatalogItem) => void
  removeItem: (id: string) => void
  removeItems: (ids: string[]) => void
  updateItem: (id: string, patch: Partial<Pick<SceneItem, 'position'|'rotationY'|'dimensions'|'properties'>>) => void
  rotateItem: (id: string, direction: 'left' | 'right') => void
  createGroup: () => void                  // из selectedItemIds, требует ≥ 2
  ungroupItems: (groupId: string) => void
  moveGroup: (groupId: string, delta: [number, number, number]) => void
  removeGroup: (groupId: string) => void
  alignItems: (alignment: AlignmentType) => void

  // Drag-сессия (начало → каждый кадр → конец)
  beginDrag: (ids: string[]) => void
  dragSelectionBy: (delta: [number, number, number]) => void  // без истории
  endDrag: (commit: boolean) => void

  // Resize-сессия
  beginResize: () => void
  resizeLive: (id: string, dimensions: Dimensions, position: Vec3) => void  // без истории
  endResize: (commit: boolean) => void

  // UI-состояние (не пишут в историю)
  selectItem: (id: string | null) => void
  selectItems: (ids: string[]) => void
  toggleItemSelection: (id: string, add: boolean) => void
  editItem: (id: string) => void
  closeEditing: () => void
  renameGroup: (groupId: string, name: string) => void
  toggleGroupCollapse: (groupId: string) => void
  toggleItemVisibility: (id: string) => void
  toggleGroupVisibility: (groupId: string) => void
  toggleItemLocked: (id: string) => void
  toggleGroupLocked: (groupId: string) => void

  undo: () => void
  redo: () => void
}

// Zustand store — UI
interface UIStore {
  sceneMode: '2d' | '3d'
  activeRightPanelTab: 'catalog' | 'layers'
  showGizmo: boolean
  showCeilingLight: boolean
  setSceneMode: (mode: '2d' | '3d') => void
  setActiveRightPanelTab: (tab: 'catalog' | 'layers') => void
  toggleGizmo: () => void
  toggleCeilingLight: () => void
}

type AlignmentType = 'left' | 'right' | 'centerX' | 'top' | 'bottom' | 'centerY' | 'front' | 'back' | 'centerZ'
```

### Схема взаимодействия компонентов

```
main.tsx
└── ScreenGuard (проверяет window.innerWidth; < 1024px → заглушка)
    └── AppLayout (flex layout, TooltipProvider)
        ├── [area: сцена]
        │   ├── SceneRibbon (горизонтальная лента ~40px над canvas)
        │   │   ├── ViewModeToggle (2D / 3D)
        │   │   ├── GizmoToggle
        │   │   ├── CeilingLightToggle
        │   │   ├── AlignmentPopover (disabled при < 2 выделенных)
        │   │   └── ItemActionsGroup (поворот + удаление; disabled при ≠ 1 выделенном)
        │   ├── SceneCanvas (3D-режим: R3F Canvas + PerspectiveCamera)
        │   │   ├── Room (пол + стены, из SCENE_CONFIG)
        │   │   ├── SceneControls (OrbitControls)
        │   │   ├── SceneElement[] (из sceneStore.items)
        │   │   │   └── useMeshDrag — прямой drag по телу элемента (XZ)
        │   │   ├── TransformProxy (гизмо; при одиночном выделении или полной группе)
        │   │   └── ResizeHandles (6 ручек; при одиночном выборе не-GLTF элемента)
        │   ├── Scene2DView (2D-режим: чистый SVG, без R3F)
        │   │   ├── SVG-сетка с адаптивным шагом
        │   │   ├── Линейки (горизонтальная + вертикальная)
        │   │   └── SceneItem[] → клик → selectItem
        │   └── SceneOverlay (abs поверх canvas: координаты выбранного элемента)
        └── RightPanel
            ├── TabBar: [Каталог] [Слои]
            ├── CatalogPanel (если tab === 'catalog' && !editingItemId)
            │   └── CatalogCategory[] → клик → sceneStore.addItem()
            ├── LayersPanel (если tab === 'layers' && !editingItemId)
            │   ├── SceneGroup[] → коллапсируемые группы + ПКМ-меню
            │   │   (Ctrl+клик, Shift+клик — мультивыбор)
            │   └── SceneItem[] → строки слоёв
            └── PropertiesPanel (если editingItemId !== null — перекрывает вкладки)
                └── PropertyField[] → onChange → sceneStore.updateItem()
```

### Панель слоёв (Photoshop-style)

Логика выделения в LayersPanel:
- Клик → `selectItems([id])` (снимает предыдущий выбор)
- Ctrl/Cmd+клик → `toggleItemSelection(id, true)` (добавить/убрать из выбора)
- Shift+клик → range-select через `rangeSelection()` из `utils/layerTree.ts`
- Клик по заголовку группы → `selectItems(getAllItemIdsInGroup(groupId, ...))` (рекурсивно)

Правила контекстного меню (ПКМ):
- "Редактировать" → `editItem(id)` (открывает PropertiesPanel)
- "Создать группу" → доступно если `selectedItemIds.length >= 2` → `createGroup()`
- "Разгруппировать" → `ungroupItems(groupId)`
- "Переименовать" → только для заголовка группы, inline-редактирование
- "Удалить" → `removeItem()` для элемента или `removeGroup()` для группы

### Вложенные группы

`SceneGroup.parentGroupId` определяет иерархию. Вложенность неограничена.
`LayersPanel` рендерит дерево рекурсивно через `buildLayerTree()` из `utils/layerTree.ts`.
`createGroup()`: если все выделенные элементы имеют одинаковый прямой `groupId` — создаёт вложенную группу.
`moveGroup()` / `removeGroup()` работают рекурсивно по всему поддереву.

---

## 5. Каталог элементов

Хардкод в `src/catalog/items.ts`. Шесть категорий, ~19 деталей. Каталог материалов и цветов — в `src/catalog/materials.ts`.

**Все размеры редактируемы** — нет фиксированных значений. Числа ниже — умолчания при добавлении детали.

### Категория «Корпус»

| id | Деталь | Размеры по умолчанию (мм) |
|----|--------|--------------------------|
| `side-panel` | Боковая панель | 16 × 2200 × 600 |
| `top-panel` | Верхняя панель | 868 × 16 × 600 |
| `bottom-panel` | Нижняя панель | 868 × 16 × 600 |
| `back-panel` | Задняя стенка | 900 × 2200 × 8 |

### Категория «Наполнение»

| id | Деталь | Размеры по умолчанию (мм) |
|----|--------|--------------------------|
| `shelf` | Полка | 860 × 16 × 560 |
| `divider-vertical` | Вертикальный разделитель | 16 × 2168 × 560 |
| `hanging-rod` | Штанга | 860 × 25 × 25 |
| `drawer-box` | Корпус ящика | 860 × 180 × 500 |
| `trouser-rack` | Брючница | 860 × 50 × 300 |

### Категория «Двери и фасады»

| id | Деталь | Размеры по умолчанию (мм) |
|----|--------|--------------------------|
| `door-hinged` | Дверь распашная | 450 × 2200 × 18 |
| `door-sliding` | Дверь раздвижная | 900 × 2200 × 22 |
| `drawer-front` | Фасад ящика | 860 × 196 × 18 |

### Категория «Основание»

| id | Деталь | Размеры по умолчанию (мм) |
|----|--------|--------------------------|
| `plinth` | Цоколь | 900 × 100 × 16 |
| `cornice` | Карниз | 900 × 60 × 60 |
| `leg` | Ножка | 30 × 100 × 30 |

### Категория «Фурнитура»

| id | Деталь | Размеры по умолчанию (мм) |
|----|--------|--------------------------|
| `handle-bar` | Ручка-скоба | 128 × 12 × 30 |
| `handle-knob` | Ручка-кнопка | 30 × 30 × 25 |
| `hinge` | Петля | 35 × 13 × 50 |

### Категория «Декорации»

| id | Деталь | Размеры bounding box (мм) |
|----|--------|--------------------------|
| `house-plant-1` | Комнатный цветок | 600 × 1200 × 600 (100%) |

Элементы этой категории рендерятся через GLTF-модели (`render.type === 'gltf'`).
GLB-файлы хранятся в `public/models/`. В PropertiesPanel вместо W/H/D — единый ползунок **Размер (%)**.

### Система материалов и цветов

Материал → набор цветов хранится в `MATERIAL_COLORS` в `src/catalog/materials.ts`.
`PropertyDef.type === 'material'` рендерится как select; `type === 'color'` — как палитра кружков,
зависящая от выбранного материала (`dependsOnMaterial`).
При смене материала цвет автоматически сбрасывается на первый цвет нового материала.
Для материала «Стекло» в `SceneElement` применяется `opacity={0.4} transparent`.
Цвет детали в 3D: `item.properties.color` — hex-строка, используется как `meshStandardMaterial color`.

---

## 6. Ключевые технические решения

### Перемещение элементов

Два способа перемещения; оба пишут через одни и те же store-примитивы (`beginDrag` / `dragSelectionBy` / `endDrag`):

1. **Гизмо (`TransformProxy`)** — стрелки `TransformControls` на невидимом pivot-меше в центре выделения. Отдаёт дельту в стор через `dragSelectionBy`. Показывается при одиночном выделении или когда выделение точно совпадает с группой.
2. **Прямой drag меша (`useMeshDrag`)** — клик+перетаскивание прямо по телу элемента. Активируется, если элемент уже выбран в момент `pointerdown`. Drag plane горизонтальная (Y фиксирован).

Конфликт с `OrbitControls` решается через `window.dispatchEvent`:

```typescript
window.dispatchEvent(new CustomEvent('transform-start'))  // в TransformProxy при начале
window.dispatchEvent(new CustomEvent('transform-end'))    // в TransformProxy при отпускании
// SceneControls подписывается и отключает/включает OrbitControls
```

**Позиция живёт только в сторе** — Three.js-объекты рендерятся из стора и никогда не мутируются императивно.

### Undo / Redo

Два стека в Zustand. Снимок хранит и `items`, и `groups` (`HistorySnapshot`). Каждая мутирующая операция вызывает `pushHistory` перед изменением (лимит 50). Интерактивный drag — особый случай: `beginDrag` снимает снапшот, `endDrag(true)` кладёт его в историю одним undo-шагом, а `dragSelectionBy` в историю не пишет. Аналогично для resize-сессии.

Операции, которые **не** попадают в историю: `selectItem`/`selectItems`/`editItem`/`closeEditing`/`renameGroup`/`toggleGroupCollapse`/`toggleItemVisibility`/`toggleGroupVisibility`/`toggleItemLocked`/`toggleGroupLocked`.

⚠️ `undo`/`redo` реализованы в сторе, но **сейчас ни к чему не привязаны** (нет хоткея). При добавлении привязки — использовать `useSceneStore.getState().undo()`.

### Проверка коллизий (AABB)

Все элементы — прямоугольные параллелепипеды, используется **Axis-Aligned Bounding Box**.

Клампинг происходит **во время drag** (per-frame, в `TransformProxy` и `useMeshDrag`):
1. `clampGroupDelta()` — ограничивает дельту по стенам комнаты
2. `clampGroupDeltaAgainstItems()` — скользящий клампинг по другим элементам (ось блокируется только если на двух других осях уже есть перекрытие)

Пары с пред-существующим полным 3D-перекрытием пропускаются — иначе конструктивно примыкающие элементы залипали бы при drag.

⚠️ AABB-проверка не учитывает поворот элементов. Скрытые элементы (`hidden: true`) участвуют в коллизии.

### Экранная заглушка

`ScreenGuard.tsx` проверяет `window.innerWidth` при монтировании и подписывается на `resize`. Если ширина < 1024px — рендерит заглушку вместо приложения. Не использует медиа-запросы CSS намеренно: JS-проверка нужна для корректной работы 3D (Three.js не должен инициализироваться на маленьких экранах).

### Геометрия элементов

По умолчанию все элементы — `BoxGeometry(width, height, depth)` + `MeshStandardMaterial` с цветом по категории. Позиция `y = height / 2` — элемент стоит на полу.

Если в `CatalogItem` задано поле `render: { type: 'gltf'; src }`, элемент рендерится через внутренний компонент `GltfMesh` (`useGLTF` + `<primitive>`). Модель равномерно масштабируется так, чтобы её bounding box вписался в `dimensions` (`Math.min` по трём осям — пропорции сохраняются). Y-позиция корректируется так, чтобы нижняя точка модели совпадала с полом (y = 0).

### Режим 2D

В 2D-режиме R3F Canvas не монтируется — вместо него рендерится `Scene2DView`, чистый SVG:
- Pan мышью + zoom колёсиком (нативные события)
- Адаптивная SVG-сетка (шаг 100/500/1000 мм в зависимости от масштаба)
- Горизонтальная и вертикальная линейки (мм от угла комнаты)
- Элементы — SVG-прямоугольники, клик → `selectItem`
- При выделении одного элемента — архитектурные размерные выноски

---

## 7. Этапы реализации

| Фаза | Содержание | Оценка |
|------|-----------|--------|
| 1 — Инфраструктура | Vite + TS, ESLint, Prettier, Vitest | 1–2 дня |
| 2 — Сцена | Конфиг, комната, камера, SceneGuard | 2–3 дня |
| 3 — Каталог | Правая панель, добавление элементов | 2 дня |
| 4 — Управление | TransformControls, поворот, удаление, Undo/Redo | 3 дня |
| 5 — Свойства | PropertiesPanel, PropertyField, форма | 1–2 дня |
| 6 — Коллизии | AABB-проверка, откат позиции, уведомление | 1–2 дня |
| 7 — 2D-режим | Ортографическая камера, сетка, размеры | 1–2 дня |
| 8 — Полировка | Снятие выделения, README, финальные тесты | 1 день |

Итого: **~2–2.5 недели** при разработке через Claude Code.

---

## 8. Не делаем в MVP

- Backend / API
- Авторизация / регистрация
- Смена текстур
- Скрытие элементов (только удаление)
- Сохранение сцены между сессиями (при перезагрузке сцена сбрасывается)
- Импорт/экспорт 3D-моделей пользователем (OBJ/GLTF через UI)
- Множественный выбор элементов
