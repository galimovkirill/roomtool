# Техническая архитектура MVP — RoomTool

> Роль: CTO стартапа  
> Дата: 2026-05-31  
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
| UI-примитивы | **Radix UI** | Доступные Popover, Tooltip без стилей |
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
- **Sonner вместо самописного** — нотификации о коллизиях нужны вне React-дерева (из store). Sonner вызывается напрямую через `toast()`.

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
│   └── scene.ts                   # Параметры комнаты, камеры
├── components/
│   ├── scene/
│   │   ├── SceneCanvas.tsx        # R3F Canvas обёртка
│   │   ├── Room.tsx               # Комната: пол + 2 стены
│   │   ├── SceneElement.tsx       # Один элемент мебели на сцене
│   │   ├── SceneControls.tsx      # OrbitControls
│   │   └── SceneOverlay.tsx       # Кнопки 2D/3D поверх canvas
│   ├── panels/
│   │   ├── RightPanel.tsx         # Контейнер: каталог или свойства
│   │   ├── CatalogPanel.tsx       # Список элементов каталога
│   │   ├── CatalogCategory.tsx    # Категория (accordion)
│   │   ├── PropertiesPanel.tsx    # Свойства выбранного элемента
│   │   └── PropertyField.tsx      # Поле ввода одного свойства
│   └── ui/
│       ├── AppLayout.tsx          # Корневой layout
│       └── ScreenGuard.tsx        # Заглушка для экранов < 1024px
├── store/
│   ├── sceneStore.ts              # Элементы на сцене, история, выбор
│   ├── uiStore.ts                 # Режим (2D/3D)
│   └── index.ts                   # Реэкспорт
├── catalog/
│   └── items.ts                   # Каталог мебельных элементов
├── types/
│   └── index.ts                   # Общие типы
├── hooks/
│   └── useKeyboard.ts             # Подписка на keydown
└── main.tsx
```

### Модели данных

```typescript
// Элемент в каталоге (тип мебели)
interface CatalogItem {
  id: string
  name: string
  category: string
  defaultDimensions: { width: number; height: number; depth: number }  // мм
  properties: PropertyDef[]
  render?: { type: 'gltf'; src: string }  // если задан — рендерится GLTF-моделью (src относительно /public)
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
  id: string                                  // uuid
  catalogId: string                           // ссылка на CatalogItem
  name: string
  position: [number, number, number]          // x, y, z в мм
  rotationY: number                           // поворот по оси Y (рад)
  dimensions: { width: number; height: number; depth: number }  // мм
  properties: Record<string, number | string>
  groupId: string | null                      // null = не в группе (TASK-021)
}

// Группа элементов (Photoshop-style layers) — TASK-021
interface SceneGroup {
  id: string           // uuid
  name: string         // 'Группа 1', 'Шкаф' и т.д.
  itemIds: string[]    // упорядоченный список id элементов в группе
  collapsed: boolean   // свёрнута ли в панели слоёв
}

// Снимок для Undo/Redo (с поддержкой групп)
type HistorySnapshot = { items: SceneItem[]; groups: SceneGroup[] }

// Zustand store — сцена (с поддержкой Undo/Redo)
interface SceneStore {
  items: SceneItem[]
  groups: SceneGroup[]                        // список групп (TASK-021)
  selectedItemId: string | null              // первый из selectedItemIds (для PropertiesPanel)
  selectedItemIds: string[]                  // мультиселект (TASK-021)
  groupCounter: number                       // автоинкремент для имён групп
  history: HistorySnapshot[]                 // стек прошлых состояний (до 50)
  future: HistorySnapshot[]                  // стек для Redo
  addItem: (catalogItem: CatalogItem) => void
  removeItem: (id: string) => void
  updateItem: (id: string, patch: ItemPatch) => void
  selectItem: (id: string | null) => void
  selectItems: (ids: string[]) => void        // TASK-021
  toggleItemSelection: (id: string, add: boolean) => void  // TASK-021
  rotateItem: (id: string, direction: 'left' | 'right') => void
  createGroup: (name: string) => void         // TASK-021 — из selectedItemIds
  ungroupItems: (groupId: string) => void     // TASK-021
  moveGroup: (groupId: string, delta: [number, number, number]) => void  // TASK-021
  removeGroup: (groupId: string) => void      // TASK-021 — удаляет группу и все её элементы
  renameGroup: (groupId: string, name: string) => void  // TASK-021
  toggleGroupCollapse: (groupId: string) => void  // TASK-021 (не в историю)
  undo: () => void
  redo: () => void
}

// Zustand store — UI
interface UIStore {
  sceneMode: '2d' | '3d'
  setSceneMode: (mode: '2d' | '3d') => void
  activeRightPanelTab: 'catalog' | 'layers'  // TASK-021
  setActiveRightPanelTab: (tab: 'catalog' | 'layers') => void  // TASK-021
}
```

### Схема взаимодействия компонентов

```
main.tsx
└── ScreenGuard (проверяет window.innerWidth, рендерит заглушку если < 1024px)
    └── AppLayout
        ├── SceneCanvas (R3F Canvas)
        │   ├── Room (пол + стены, из SCENE_CONFIG)
        │   ├── SceneControls (OrbitControls)
        │   ├── SceneItem[] (из sceneStore.items)
        │   │   └── TransformControls (при одиночном выборе + onDragEnd → collision check)
        │   └── GroupTransformProxy (TASK-021, если выбрана группа → TransformControls на центре AABB)
        ├── SceneOverlay (кнопки 2D/3D, абс. позиция)
        └── RightPanel
            ├── TabBar: [Каталог] [Слои]
            ├── CatalogPanel (если !selectedItemId && tab === 'catalog')
            │   └── CatalogCategory[] → клик → sceneStore.addItem()
            ├── LayersPanel (TASK-021, если tab === 'layers')
            │   ├── SceneGroup[] → коллапсируемые группы + ПКМ-меню
            │   └── SceneItem[] → строки слоёв, click/Ctrl+click/Shift+click
            └── PropertiesPanel (если selectedItemId — перекрывает всё)
                └── PropertyField[] → onChange → sceneStore.updateItem()
```

### Панель слоёв (Photoshop-style, TASK-021)

Логика выделения в LayersPanel:
- Клик → `selectItems([id])` (снимает предыдущий выбор)
- Ctrl/Cmd+клик → `toggleItemSelection(id, true)` (добавить/убрать из выбора)
- Shift+клик → range-select от `lastClickedId` до текущего в видимом порядке списка
- Клик по заголовку группы → `selectItems(group.itemIds)` (выбрать все элементы группы)

Правила контекстного меню (ПКМ):
- "Создать группу" → доступно если `selectedItemIds.length >= 2` → `createGroup('Группа N')`
- "Разгруппировать" → доступно если кликнули на группу или элемент с `groupId !== null`
- "Переименовать" → только для заголовка группы, inline-редактирование
- "Удалить" → `removeItem()` для элемента или `removeGroup()` для группы

### Перемещение группы в 3D (GroupTransformProxy, TASK-021)

`GroupTransformProxy` рендерится в SceneCanvas когда все `selectedItemIds` принадлежат одной группе.

Алгоритм:
1. Вычисляет AABB центр всех элементов группы
2. Крепит невидимый pivot-mesh в центре AABB
3. TransformControls на pivot
4. `onMouseDown`: запоминает `initialCenter` в ref
5. `onChange`: только запоминает текущую позицию пивота (live preview не делает — слишком дорого с историей)
6. `onMouseUp`: `delta = finalPos - initialCenter` → `hasGroupCollision()` → если OK → `moveGroup(groupId, delta)`, если нет → `toast.warning()` + пивот возвращается на initialCenter

⚠️ AABB для групп не учитывает поворот отдельных элементов (как и для одиночных элементов).

---

## 5. Каталог элементов

Хардкод в `src/catalog/items.ts`. Четыре категории, 8 элементов.

### Категория «Корпуса»

| Элемент | Размеры по умолчанию (ш × в × г, мм) | Параметры |
|---------|--------------------------------------|-----------|
| Корпус шкафа | 900 × 2200 × 600 | материал (ДСП / МДФ), цвет |
| Корпус-пенал | 450 × 2200 × 600 | материал, цвет |

### Категория «Наполнение»

| Элемент | Размеры по умолчанию (мм) | Параметры |
|---------|---------------------------|-----------|
| Полка | 878 × 25 × 560 | толщина 16–36 мм |
| Ящик выдвижной | 878 × 150 × 500 | высота 100–300 мм |
| Штанга для одежды | 878 × 30 × 30 | материал (Хром / Золото / Матовый никель) |

### Категория «Двери»

| Элемент | Размеры по умолчанию (мм) | Параметры |
|---------|---------------------------|-----------|
| Дверь распашная | 450 × 2200 × 22 | открывание (Влево / Вправо) |
| Дверь-купе | 900 × 2200 × 60 | количество панелей 2–4 |

### Категория «Декорации»

| Элемент | Размеры bounding box по умолчанию (мм) | Параметры |
|---------|----------------------------------------|-----------|
| Комнатный цветок | 600 × 1200 × 600 | scale 10–200%, default 100% |

Элементы этой категории рендерятся через GLTF-модели (поле `render.type === 'gltf'`).
GLB-файлы хранятся в `public/models/`. В PropertiesPanel вместо W/H/D — единый ползунок **Размер (%)**.

Цвета мебельных элементов в 3D (BoxGeometry): корпуса — `#d4a853`, наполнение — `#c49a3c`, двери — `#87CEEB`.

---

## 6. Ключевые технические решения

### Перемещение элементов

`TransformControls` из `@react-three/drei`, режим `translate`. Конфликт с `OrbitControls` решается через события:

```tsx
<TransformControls
  onMouseDown={() => { orbitRef.current.enabled = false }}
  onMouseUp={() => {
    orbitRef.current.enabled = true
    checkCollision(item.id)  // проверка только при отпускании
  }}
  onChange={() => updateItem(id, { position: getPosition() })}
/>
```

### Undo / Redo

Простой паттерн с двумя стеками в Zustand. Каждое мутирующее действие (add, remove, update, rotate) перед изменением:
1. Кладёт текущий `items` в `history` (ограничение: 50 записей, самые старые вытесняются)
2. Очищает `future`

`undo()`: перемещает текущий `items` в `future`, восстанавливает последний из `history`.  
`redo()`: обратная операция.

Хоткеи `Ctrl+Z` / `Ctrl+Y` подключены через `useKeyboard` в корне приложения.

### Проверка коллизий (AABB)

Все элементы — прямоугольные параллелепипеды, поэтому достаточно **Axis-Aligned Bounding Box** проверки.

Проверка запускается при отпускании TransformControls (`onMouseUp`). Алгоритм:

```typescript
function hasCollision(movedItem: SceneItem, allItems: SceneItem[]): boolean {
  return allItems
    .filter(item => item.id !== movedItem.id)
    .some(other => {
      const dx = Math.abs(movedItem.position[0] - other.position[0])
      const dy = Math.abs(movedItem.position[1] - other.position[1])
      const dz = Math.abs(movedItem.position[2] - other.position[2])
      return (
        dx < (movedItem.dimensions.width + other.dimensions.width) / 2 &&
        dy < (movedItem.dimensions.height + other.dimensions.height) / 2 &&
        dz < (movedItem.dimensions.depth + other.dimensions.depth) / 2
      )
    })
}
```

Если коллизия обнаружена:
- Позиция откатывается на `lastValidPosition` (хранится локально в компоненте до начала drag)
- Вызывается `toast.warning('Элементы не могут пересекаться')` через Sonner

### Экранная заглушка

`ScreenGuard.tsx` проверяет `window.innerWidth` при монтировании и подписывается на `resize`. Если ширина < 1024px — рендерит заглушку вместо приложения. Не использует медиа-запросы CSS намеренно: JS-проверка нужна для корректной работы 3D (Three.js не должен инициализироваться на маленьких экранах).

### Геометрия элементов

По умолчанию все элементы — `BoxGeometry(width, height, depth)` + `MeshStandardMaterial` с цветом по категории. Позиция `y = height / 2` — элемент стоит на полу.

Если в `CatalogItem` задано поле `render: { type: 'gltf'; src }`, элемент рендерится через внутренний компонент `GltfMesh` (`useGLTF` + `<primitive>`). Модель равномерно масштабируется так, чтобы её bounding box вписался в `dimensions` (`Math.min` по трём осям — пропорции сохраняются). Y-позиция корректируется так, чтобы нижняя точка модели совпадала с полом (y = 0).

### Режим 2D

При переключении в 2D:
- `OrthographicCamera`: позиция `[0, ROOM_HEIGHT * 2, 0]`, `lookAt(0, 0, 0)`
- `OrbitControls`: `enableRotate={false}`, только pan и zoom
- `<Grid />` из drei поверх пола (чертёжная сетка)
- Элементы рендерят `<Html>` с размерами `{width} × {depth}` мм

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
