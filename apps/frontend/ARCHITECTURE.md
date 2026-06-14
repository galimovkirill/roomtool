# RoomTool — Техническая архитектура

> Справочник типов и дерева компонентов. Соглашения и анти-паттерны — в [apps/frontend/CLAUDE.md](apps/frontend/CLAUDE.md).

---

## Стек

| Слой | Решение |
|------|---------|
| Фреймворк | React 19 + TypeScript strict |
| Сборка | Vite 6 |
| 3D | Three.js + @react-three/fiber + @react-three/drei |
| Стейт | Zustand |
| Стили | Tailwind CSS v4 (через Vite-плагин, нет `tailwind.config.js`) |
| UI-примитивы | shadcn/ui (@base-ui/react) |
| Уведомления | Sonner |
| Тесты | Vitest + @testing-library/react |
| Пакеты | pnpm workspaces |
| Backend | Go 1.24 + `net/http` + PostgreSQL 17 |
| API-контракт | OpenAPI 3.0.3 → oapi-codegen v2 (Go) + openapi-typescript v7 (TS) |

---

## Модели данных

```typescript
// Тип детали в каталоге
interface CatalogItem {
  id: string
  name: string
  category: string
  defaultDimensions: { width: number; height: number; depth: number }  // мм
  properties: PropertyDef[]
  render?: { type: 'gltf'; src: string }  // GLB из /public/models/
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

// Экземпляр на сцене
interface SceneItem {
  id: string                                    // uuid
  catalogId: string
  name: string
  position: [number, number, number]            // x, y, z в мм (мировые, центр объекта)
  rotationY: number                             // поворот по Y (рад)
  dimensions: { width: number; height: number; depth: number }  // мм
  properties: Record<string, number | string>
  groupId: string | null
  hidden?: boolean
  locked?: boolean
}

// Группа (Photoshop-style layers)
interface SceneGroup {
  id: string
  name: string
  itemIds: string[]              // прямые участники (не рекурсивно)
  collapsed: boolean
  hidden?: boolean
  locked?: boolean
  parentGroupId?: string | null  // null/undefined = корневой уровень
}

// Снимок для Undo/Redo
type HistorySnapshot = { items: SceneItem[]; groups: SceneGroup[] }

// Drag-сессия
interface DragSession {
  snapshot: HistorySnapshot
  startPositions: Record<string, [number, number, number]>
}

// Resize-сессия
interface ResizeSession {
  snapshot: HistorySnapshot
}

type AlignmentType = 'left' | 'right' | 'centerX' | 'top' | 'bottom' | 'centerY' | 'front' | 'back' | 'centerZ'
```

---

## Zustand Store API

### sceneStore

```typescript
interface SceneStore {
  // Состояние
  items: SceneItem[]
  groups: SceneGroup[]
  selectedItemId: string | null        // = selectedItemIds[0] ?? null
  selectedItemIds: string[]
  editingItemId: string | null         // кто открыт в PropertiesPanel
  groupCounter: number
  history: HistorySnapshot[]           // лимит 50
  future: HistorySnapshot[]
  dragSession: DragSession | null
  resizeSession: ResizeSession | null

  // Мутации (пишут в историю)
  addItem: (catalogItem: CatalogItem) => void
  removeItem: (id: string) => void
  removeItems: (ids: string[]) => void
  updateItem: (id: string, patch: Partial<Pick<SceneItem, 'position'|'rotationY'|'dimensions'|'properties'>>) => void
  rotateItem: (id: string, direction: 'left' | 'right') => void
  createGroup: () => void                          // требует selectedItemIds.length >= 2
  ungroupItems: (groupId: string) => void
  moveGroup: (groupId: string, delta: [number, number, number]) => void
  removeGroup: (groupId: string) => void
  alignItems: (alignment: AlignmentType) => void
  resetScene: () => void

  // Drag-сессия
  beginDrag: (ids: string[]) => void
  dragSelectionBy: (delta: [number, number, number]) => void  // без истории
  endDrag: (commit: boolean) => void

  // Resize-сессия
  beginResize: () => void
  resizeLive: (id: string, dimensions: Dimensions, position: Vec3) => void  // без истории
  endResize: (commit: boolean) => void

  // UI (не пишут в историю)
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
```

### uiStore

```typescript
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
```

---

## Дерево компонентов

```
main.tsx
└── ScreenGuard (< 1024px → заглушка)
    └── AppLayout (flex layout, TooltipProvider)
        ├── [area: сцена]
        │   ├── SceneRibbon (~40px, всегда видима)
        │   │   ├── ViewModeToggle (2D / 3D)
        │   │   ├── GizmoToggle
        │   │   ├── CeilingLightToggle
        │   │   ├── AlignmentPopover (9 кнопок; disabled при < 2 выделенных)
        │   │   ├── ItemActionsGroup (поворот + удаление; disabled при ≠ 1)
        │   │   └── ResetSceneButton
        │   ├── SceneCanvas (3D: R3F Canvas + PerspectiveCamera)
        │   │   ├── Room (пол + стены, из SCENE_CONFIG)
        │   │   ├── SceneControls (OrbitControls)
        │   │   ├── SceneElement[] (из sceneStore.items)
        │   │   │   └── useMeshDrag (прямой drag по телу, только XZ)
        │   │   ├── TransformProxy (гизмо; одиночное выделение или полная группа)
        │   │   └── ResizeHandles (6 ручек; одиночное не-GLTF выделение)
        │   ├── Scene2DView (2D: чистый SVG, без R3F)
        │   │   ├── SVG-сетка (адаптивный шаг 100/500/1000 мм)
        │   │   ├── Линейки (горизонтальная + вертикальная)
        │   │   └── SceneItem[] → клик → selectItem
        │   ├── SceneOverlay (abs поверх canvas: W/H/D выделения)
        │   └── ElevationSlider (ползунок Y; скрыт при showGizmo)
        └── RightPanel
            ├── TabBar: [Каталог] [Слои]
            ├── CatalogPanel (tab=catalog && !editingItemId)
            │   └── CatalogCategory[] → клик → addItem()
            ├── LayersPanel (tab=layers && !editingItemId)
            │   ├── SceneGroup[] → коллапс + ПКМ-меню
            │   └── SceneItem[] → строки (Ctrl/Shift+клик — мультивыбор)
            └── PropertiesPanel (editingItemId !== null — перекрывает вкладки)
                └── PropertyField[] (number / select / material / color)
```

---

## Режимы сцены

| | 3D | 2D |
|--|----|----|
| Рендер | R3F Canvas (PerspectiveCamera) | Чистый SVG (Scene2DView) |
| Навигация | OrbitControls | Pan мышью + zoom колёсиком |
| Стены | видимы | — |
| Сетка | нет | SVG, адаптивный шаг |
| Линейки | нет | мм от угла комнаты |
| Размеры элементов | нет | выноски при одиночном выделении |
| Выбор | клик → selectItem | клик → selectItem |

---

## Лента (Ribbon) — группы кнопок

| Группа | Компонент | Условие активности |
|--------|-----------|-------------------|
| Вид | ViewModeToggle, GizmoToggle, CeilingLightToggle | всегда |
| Выравнивание | AlignmentPopover | `selectedItemIds.length >= 2` |
| Действия | ItemActionsGroup (поворот, удаление) | `selectedItemIds.length === 1` |
| Сброс | ResetSceneButton | всегда |

`AlignmentType`: `left | right | centerX | top | bottom | centerY | front | back | centerZ`

⚠️ `alignItems` не клампит к стенам. `centerX/Y/Z` — среднее арифметическое центров (не центр bounding box).
