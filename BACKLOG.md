# Backlog задач — RoomTool MVP

> Задачи упорядочены для последовательной разработки через Claude Code.  
> Каждый блок — самостоятельная задача с чётким скоупом и готовым промптом.

---

## ФАЗА 1 — Инфраструктура проекта

### TASK-001 — Инициализация проекта Vite + React + TypeScript

**Промпт для Claude Code:**
```
Инициализируй новый проект с помощью Vite. Используй шаблон react-ts.
Менеджер пакетов: pnpm. Название проекта: roomtool.

После инициализации:
1. Удали весь шаблонный код из src/ (App.tsx, App.css, index.css, assets/)
2. Создай минимальный src/main.tsx который рендерит <div id="root"> с текстом "RoomTool"
3. Настрой tsconfig.json: добавь "strict": true, "baseUrl": "src", алиасы paths: { "@/*": ["*"] }
4. В vite.config.ts добавь алиас resolve: { alias: { '@': '/src' } }

Установи зависимости (dependencies):
- three @react-three/fiber @react-three/drei
- zustand
- @radix-ui/react-popover @radix-ui/react-tooltip
- uuid
- sonner

Установи devDependencies:
- @types/three @types/uuid
- tailwindcss @tailwindcss/vite

Настрой Tailwind v4: добавь плагин в vite.config.ts, импортируй @import "tailwindcss" в src/index.css.

Убедись что pnpm dev запускается без ошибок.
```

---

### TASK-002 — Настройка ESLint + Prettier

**Промпт для Claude Code:**
```
Настрой ESLint v9 с flat config (eslint.config.js) для проекта React + TypeScript.

Установи devDependencies:
- eslint @eslint/js
- typescript-eslint
- eslint-plugin-react-hooks
- eslint-plugin-react-refresh
- prettier eslint-config-prettier eslint-plugin-prettier

Создай eslint.config.js с:
- typescript-eslint recommended правилами
- react-hooks правилами
- prettier интеграцией
- игнором dist/ и node_modules/

Создай .prettierrc:
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}

Добавь в package.json scripts:
- "lint": "eslint src/"
- "lint:fix": "eslint src/ --fix"
- "format": "prettier --write src/"

Запусти pnpm lint — должно работать без ошибок.
```

---

### TASK-003 — Настройка Vitest + Testing Library

**Промпт для Claude Code:**
```
Настрой окружение для юнит-тестов в проекте Vite + React + TypeScript.

Установи devDependencies:
- vitest @vitest/ui jsdom
- @testing-library/react @testing-library/user-event @testing-library/jest-dom

В vite.config.ts добавь секцию test:
{
  environment: 'jsdom',
  globals: true,
  setupFiles: ['./src/test/setup.ts']
}

Создай src/test/setup.ts:
import '@testing-library/jest-dom'

В tsconfig.json добавь "types": ["vitest/globals", "@testing-library/jest-dom"] в compilerOptions.

Добавь в package.json:
- "test": "vitest"
- "test:ui": "vitest --ui"

Создай smoke-тест src/test/smoke.test.ts: проверь что 1 + 1 === 2.
Запусти pnpm test — должен пройти.
```

---

## ФАЗА 2 — Сцена

### TASK-004 — Конфиг сцены и базовые типы

**Промпт для Claude Code:**
```
Создай конфигурационный файл сцены и базовые TypeScript типы.

Создай src/config/scene.ts:

export const SCENE_CONFIG = {
  room: {
    width: 4000,   // мм, ось X
    depth: 4000,   // мм, ось Z
    height: 3000,  // мм, ось Y
  },
  camera: {
    initialPosition: [2500, 2500, 2500] as const,
    fov: 50,
    minDistance: 500,
    maxDistance: 8000,
    target: [0, 0, 0] as const,
  },
} as const

Создай src/types/index.ts со следующими интерфейсами:

interface PropertyDef {
  key: string
  label: string
  type: 'number' | 'select'
  unit?: string
  min?: number
  max?: number
  options?: string[]
}

interface CatalogItem {
  id: string
  name: string
  category: string
  defaultDimensions: { width: number; height: number; depth: number }
  properties: PropertyDef[]
}

interface SceneItem {
  id: string
  catalogId: string
  name: string
  position: [number, number, number]
  rotationY: number
  dimensions: { width: number; height: number; depth: number }
  properties: Record<string, number | string>
}

Все размеры в мм (1 unit Three.js = 1 мм).
Создай также пустые директории (с .gitkeep):
src/components/scene/ src/components/panels/ src/components/ui/
src/store/ src/catalog/ src/hooks/

Экспортируй все типы из src/types/index.ts.
```

---

### TASK-005 — Zustand stores

**Промпт для Claude Code:**
```
Создай два Zustand store для приложения. Используй TypeScript с strict типизацией.

Файл src/store/sceneStore.ts:

Состояние:
- items: SceneItem[]
- selectedItemId: string | null
- history: SceneItem[][]  (ограничение: 50 записей)
- future: SceneItem[][]

Вспомогательная функция (не экспортируй):
function pushHistory(state: { items: SceneItem[]; history: SceneItem[][]; future: SceneItem[][] }) {
  — добавляет текущий items в history
  — обрезает history до 50 записей если больше
  — очищает future
}

Методы:
- addItem(catalogItem: CatalogItem): void
  Вызывает pushHistory. Создаёт SceneItem из CatalogItem:
  id = uuid(), position = [0, catalogItem.defaultDimensions.height / 2, 0] (центр комнаты, стоит на полу)
  rotationY = 0, dimensions берёт из defaultDimensions.
  properties инициализирует: для 'number' берёт min, для 'select' берёт первый option.

- removeItem(id: string): void
  Вызывает pushHistory. Удаляет элемент. Если он был выбран — сбрасывает selectedItemId.

- updateItem(id: string, patch): void
  Вызывает pushHistory. Обновляет только position, rotationY, dimensions, properties.

- selectItem(id: string | null): void
  НЕ вызывает pushHistory (выбор не попадает в историю).

- rotateItem(id: string, direction: 'left' | 'right'): void
  Вызывает pushHistory. Поворачивает на Math.PI / 2.

- undo(): void
  Если history пустой — ничего. Берёт последний из history → кладёт items в future → восстанавливает.

- redo(): void
  Если future пустой — ничего. Берёт последний из future → кладёт items в history → восстанавливает.

Файл src/store/uiStore.ts:
- sceneMode: '2d' | '3d', начальное значение '3d'
- setSceneMode(mode: '2d' | '3d'): void

Файл src/store/index.ts:
Реэкспортирует useSceneStore и useUIStore.

Напиши тесты src/store/sceneStore.test.ts:
- addItem добавляет элемент, position.y === height / 2
- removeItem удаляет элемент и сбрасывает selectedItemId если он выбран
- rotateItem поворачивает на PI/2 в нужную сторону
- undo после addItem восстанавливает пустой массив
- redo после undo возвращает добавленный элемент
- история не превышает 50 записей

Используй тестовый CatalogItem: { id: 'test', name: 'Тест', category: 'X',
defaultDimensions: { width: 900, height: 2200, depth: 600 }, properties: [] }
```

---

### TASK-006 — Каталог мебельных элементов

**Промпт для Claude Code:**
```
Создай каталог мебельных элементов в src/catalog/items.ts.

Импортируй CatalogItem из src/types.

Создай массив CATALOG_ITEMS: CatalogItem[] из 7 элементов:

Категория "Корпуса":
1. { id: 'wardrobe-body', name: 'Корпус шкафа',
   defaultDimensions: { width: 900, height: 2200, depth: 600 },
   properties: [
     { key: 'material', label: 'Материал', type: 'select', options: ['ДСП', 'МДФ'] },
     { key: 'color', label: 'Цвет', type: 'select', options: ['Белый', 'Венге', 'Дуб'] }
   ] }

2. { id: 'wardrobe-narrow', name: 'Корпус-пенал',
   defaultDimensions: { width: 450, height: 2200, depth: 600 },
   properties: [
     { key: 'material', label: 'Материал', type: 'select', options: ['ДСП', 'МДФ'] },
     { key: 'color', label: 'Цвет', type: 'select', options: ['Белый', 'Венге', 'Дуб'] }
   ] }

Категория "Наполнение":
3. { id: 'shelf', name: 'Полка',
   defaultDimensions: { width: 878, height: 25, depth: 560 },
   properties: [
     { key: 'thickness', label: 'Толщина', type: 'number', unit: 'мм', min: 16, max: 36 }
   ] }

4. { id: 'drawer', name: 'Ящик выдвижной',
   defaultDimensions: { width: 878, height: 150, depth: 500 },
   properties: [
     { key: 'height', label: 'Высота', type: 'number', unit: 'мм', min: 100, max: 300 }
   ] }

5. { id: 'rod', name: 'Штанга для одежды',
   defaultDimensions: { width: 878, height: 30, depth: 30 },
   properties: [
     { key: 'material', label: 'Материал', type: 'select', options: ['Хром', 'Золото', 'Матовый никель'] }
   ] }

Категория "Двери":
6. { id: 'door-swing', name: 'Дверь распашная',
   defaultDimensions: { width: 450, height: 2200, depth: 22 },
   properties: [
     { key: 'opening', label: 'Открывание', type: 'select', options: ['Влево', 'Вправо'] }
   ] }

7. { id: 'door-slide', name: 'Дверь-купе',
   defaultDimensions: { width: 900, height: 2200, depth: 60 },
   properties: [
     { key: 'panels', label: 'Количество панелей', type: 'number', min: 2, max: 4 }
   ] }

Создай вспомогательные функции:
- getCatalogItemById(id: string): CatalogItem | undefined
- getCatalogByCategory(): Record<string, CatalogItem[]>

Напиши тесты src/catalog/items.test.ts:
- getCatalogByCategory возвращает 3 категории: 'Корпуса', 'Наполнение', 'Двери'
- getCatalogItemById('shelf') возвращает нужный элемент
- getCatalogItemById('nonexistent') возвращает undefined
- все items имеют непустой id, name, category
```

---

### TASK-007 — Layout приложения + экранная заглушка

**Промпт для Claude Code:**
```
Создай корневой layout и компонент-заглушку для маленьких экранов.

Создай src/components/ui/ScreenGuard.tsx:
Компонент оборачивает children.
При монтировании и при resize проверяет window.innerWidth.
Если < 1024 — рендерит заглушку вместо children.
Заглушка: центрированный блок с текстом "Приложение доступно только на десктопных устройствах
(минимальная ширина экрана — 1024px)". Стилизовать: bg-gray-100, h-screen, flex items-center
justify-center, text-center, max-w-sm mx-auto, text-gray-600.
Используй useEffect + useState + addEventListener('resize', handler) + cleanup.

Создай src/components/ui/AppLayout.tsx:
- Принимает children (ReactNode)
- Flex layout на всю высоту (h-screen w-screen overflow-hidden)
- Левая часть (flex-1 relative) — слот для сцены
- Правая часть (w-80 flex-col border-l border-gray-200 bg-white overflow-y-auto) — слот для панели
- Тёмный фон сцены (bg-gray-900)

Обнови src/main.tsx:
import './index.css'
import { Toaster } from 'sonner'
Рендери:
<React.StrictMode>
  <ScreenGuard>
    <AppLayout>
      <div className="text-white p-4">Сцена (заглушка)</div>
      <div className="p-4">Панель (заглушка)</div>
    </AppLayout>
  </ScreenGuard>
  <Toaster position="bottom-right" />
</React.StrictMode>

Убедись что pnpm dev показывает корректный layout.
Напиши тест для ScreenGuard: при window.innerWidth < 1024 рендерится заглушка.
(Для теста мокай window.innerWidth через Object.defineProperty)
```

---

### TASK-008 — 3D-сцена: комната и камера

**Промпт для Claude Code:**
```
Создай базовую 3D-сцену с комнатой.

Создай src/components/scene/Room.tsx:
Читает размеры из SCENE_CONFIG (src/config/scene.ts).
Три плоскости:
- Пол: PlaneGeometry(width, depth), rotateX(-PI/2), position [0, 0, 0], цвет #c8b89a
- Задняя стена: PlaneGeometry(width, height), position [0, height/2, -depth/2], цвет #8a8a8a
- Левая стена: PlaneGeometry(depth, height), rotateY(PI/2), position [-width/2, height/2, 0], цвет #767676
Добавь ambientLight intensity={0.6} и directionalLight position={[5000, 8000, 5000]} castShadow.

Создай src/components/scene/SceneControls.tsx:
Экспортирует компонент с forwardRef (ref на OrbitControls).
OrbitControls: minDistance и maxDistance из SCENE_CONFIG.camera.
target — Vector3 из SCENE_CONFIG.camera.target.

Создай src/components/scene/SceneCanvas.tsx:
R3F <Canvas> с camera={{ position: SCENE_CONFIG.camera.initialPosition, fov: SCENE_CONFIG.camera.fov }}.
Внутри: <Room />, <SceneControls />.
Компонент не принимает пропсов.

Обнови AppLayout: левый слот = <SceneCanvas />.

Убедись: в браузере видна 3D-комната с вращением камеры мышью.
```

---

### TASK-010 — Переключатель режимов 2D/3D

**Промпт для Claude Code:**
```
Создай оверлей над сценой с кнопками 2D/3D.

Создай src/components/scene/SceneOverlay.tsx:
Позиционируется абсолютно (absolute top-4 left-4 z-10).
Группа кнопок "3D" и "2D" в виде pill (rounded-lg overflow-hidden shadow-md flex).
Читает sceneMode из useUIStore(). При клике — setSceneMode().
Активная кнопка: bg-blue-600 text-white. Неактивная: bg-white text-gray-700 hover:bg-gray-50.
Каждая кнопка: px-4 py-2 text-sm font-medium transition-colors.

Обнови SceneCanvas.tsx:
При sceneMode === '2d':
- <OrthographicCamera makeDefault position={[0, SCENE_CONFIG.room.height * 2, 0]} zoom={0.3} />
- В SceneControls: enableRotate={false}
- В Room: добавь <Grid args={[SCENE_CONFIG.room.width, SCENE_CONFIG.room.depth]}
  cellColor="#aaaaaa" sectionColor="#666666" position={[0, 1, 0]} fadeDistance={10000} />
При sceneMode === '3d':
- <PerspectiveCamera makeDefault position={SCENE_CONFIG.camera.initialPosition} fov={SCENE_CONFIG.camera.fov} />
- Полный OrbitControls

Оберни корневой контейнер сцены в position: relative, добавь <SceneOverlay />.

Убедись: переключение 2D/3D работает, в 2D вращение недоступно.
```

---

## ФАЗА 3 — Каталог и добавление элементов

### TASK-011 — Правая панель: каталог элементов

**Промпт для Claude Code:**
```
Создай UI правой панели с каталогом мебельных элементов.

Создай src/components/panels/CatalogPanel.tsx:
- Заголовок "Элементы" (text-lg font-semibold px-4 py-3 border-b)
- Input для поиска (w-full border-b px-4 py-2 text-sm placeholder="Поиск...")
  без label, outline-none, focus:bg-blue-50
- Список категорий через getCatalogByCategory()
- Если строка поиска не пустая: показывает плоский список совпадений (case-insensitive по name)
  без группировки по категориям
- Каждая категория — аккордеон (useState isOpen, по умолчанию открыт)
  Заголовок: flex justify-between items-center px-4 py-2 cursor-pointer hover:bg-gray-50
  text-xs font-semibold uppercase tracking-wide text-gray-500
  Иконка ▲/▼ в зависимости от isOpen
- Каждый элемент: button w-full text-left px-4 py-2 text-sm hover:bg-blue-50
  hover:text-blue-700 transition-colors
  При клике: useSceneStore().addItem(catalogItem)

Создай src/components/panels/RightPanel.tsx:
Читает selectedItemId из useSceneStore().
Если null — рендерит <CatalogPanel />.
Если есть — рендерит заглушку <div className="p-4">Свойства (TASK-015)</div>.

Подключи RightPanel в AppLayout вместо заглушки.
```

---

### TASK-012 — Рендер элементов на сцене

**Промпт для Claude Code:**
```
Создай компонент для отображения мебельных элементов в 3D-сцене.

Создай src/components/scene/SceneElement.tsx:
Пропсы: item: SceneItem.

Цвета по catalogId:
const COLORS: Record<string, string> = {
  'wardrobe-body': '#d4a853',
  'wardrobe-narrow': '#d4a853',
  'shelf': '#c49a3c',
  'drawer': '#b8860b',
  'rod': '#C0C0C0',
  'door-swing': '#87CEEB',
  'door-slide': '#4682B4',
}
default: '#cccccc'

Рендерит <group position={item.position} rotation={[0, item.rotationY, 0]}>:
  <mesh
    castShadow
    receiveShadow
    onPointerOver={() => setHovered(true)}
    onPointerOut={() => setHovered(false)}
    onClick={(e) => { e.stopPropagation(); selectItem(item.id) }}
  >
    <boxGeometry args={[item.dimensions.width, item.dimensions.height, item.dimensions.depth]} />
    <meshStandardMaterial color={color} opacity={hovered ? 0.85 : 1} transparent />
  </mesh>
  {isSelected && (() => {
    const edges = new THREE.EdgesGeometry(
      new THREE.BoxGeometry(item.dimensions.width, item.dimensions.height, item.dimensions.depth)
    )
    return (
      <lineSegments geometry={edges}>
        <lineBasicMaterial color="#2563eb" />
      </lineSegments>
    )
  })()}
</group>

isSelected = item.id === useSceneStore(s => s.selectedItemId)

Обнови SceneCanvas.tsx:
Читает items из useSceneStore(s => s.items).
Добавь onPointerMissed={() => selectItem(null)} на Canvas.
Рендерит {items.map(item => <SceneElement key={item.id} item={item} />)}.

Убедись: клик по кнопке в каталоге → элемент появляется в центре сцены (позиция 0, height/2, 0).
Клик по элементу → синяя обводка. Клик на пустое место → обводка пропадает.
```

---

## ФАЗА 4 — Управление элементами

### TASK-013 — TransformControls: перемещение элементов

**Промпт для Claude Code:**
```
Добавь перемещение элементов по трём осям через TransformControls.

Обнови src/components/scene/SceneElement.tsx:
Добавь ref на mesh (useRef<THREE.Mesh>).
Добавь локальный state: lastValidPosition: [number, number, number].
Инициализируй из item.position при монтировании (useEffect).

Если item.id === selectedItemId: рендери внутри группы:
<TransformControls
  object={meshRef}
  mode="translate"
  onMouseDown={() => window.dispatchEvent(new CustomEvent('transform-start'))}
  onMouseUp={() => window.dispatchEvent(new CustomEvent('transform-end'))}
  onChange={() => {
    if (!meshRef.current) return
    const pos = meshRef.current.position
    // Ограничение: y не меньше height/2 (не уходит под пол)
    const clampedY = Math.max(item.dimensions.height / 2, pos.y)
    updateItem(item.id, { position: [pos.x, clampedY, pos.z] })
  }}
/>

В SceneControls.tsx:
useEffect(() => {
  const disable = () => { orbitRef.current.enabled = false }
  const enable = () => { orbitRef.current.enabled = true }
  window.addEventListener('transform-start', disable)
  window.addEventListener('transform-end', enable)
  return () => { ... removeEventListener ... }
}, [])

Убедись: выбранный элемент показывает гизмо. Перетаскивание работает.
Камера не двигается во время drag. Элемент не уходит под пол.
```

---

### TASK-014 — Popover действий над элементом

**Промпт для Claude Code:**
```
Создай popover с кнопками управления выбранным элементом.

Создай src/components/ui/ElementPopover.tsx:
Принимает item: SceneItem.
Отображается только когда item.id === selectedItemId.

Использует Html из @react-three/drei для рендера HTML в 3D-пространстве.
Position: [0, item.dimensions.height / 2 + 80, 0] (над элементом).
distanceFactor={200}.

Содержимое — горизонтальный ряд кнопок (flex gap-1 bg-white rounded-lg shadow-lg border border-gray-200 p-1):

Кнопки (каждая p-2 rounded hover:bg-gray-100 transition-colors text-sm):
- "↺" title="Повернуть влево" → rotateItem(id, 'left')
- "↻" title="Повернуть вправо" → rotateItem(id, 'right')
- "🗑" title="Удалить" → removeItem(id)

Добавь <ElementPopover item={item} /> внутри SceneElement (в group, после mesh).

Убедись: при выборе элемента появляются кнопки, повороты работают на 90°, удаление убирает элемент.
```

---

## ФАЗА 5 — Свойства элементов

### TASK-016 — Панель свойств выбранного элемента

**Промпт для Claude Code:**
```
Создай панель редактирования свойств выбранного элемента.

Создай src/components/panels/PropertyField.tsx:
Пропсы: def: PropertyDef, value: number | string, onChange: (v: number | string) => void.

Если def.type === 'number':
  <label> с def.label + (def.unit ? def.unit : '')
  <input type="number" min={def.min} max={def.max} value={value}
    onChange={e => onChange(Number(e.target.value))} />
Если def.type === 'select':
  <label> с def.label
  <select value={value} onChange={e => onChange(e.target.value)}>
    {def.options?.map(opt => <option key={opt}>{opt}</option>)}
  </select>

Стилизация: label text-xs text-gray-500 mb-1, input/select border rounded px-2 py-1.5 w-full text-sm.

Создай src/components/panels/PropertiesPanel.tsx:
Принимает itemId: string.
Получает item = useSceneStore(s => s.items.find(i => i.id === itemId)).
Получает catalogItem = getCatalogItemById(item?.catalogId ?? '').
Если item/catalogItem не найден → null.

Структура панели (overflow-y-auto h-full):
1. Шапка: flex items-center justify-between px-4 py-3 border-b
   - item.name (font-semibold)
   - кнопка "✕" → selectItem(null), title="Закрыть"

2. Секция "Размеры" (px-4 py-3 border-b):
   Три PropertyField (тип number):
   - { key: 'width', label: 'Ширина', unit: 'мм', min: 1, max: 10000 } → item.dimensions.width
   - { key: 'height', label: 'Высота', unit: 'мм', min: 1, max: 10000 } → item.dimensions.height
   - { key: 'depth', label: 'Глубина', unit: 'мм', min: 1, max: 10000 } → item.dimensions.depth
   onChange: updateItem(id, { dimensions: { ...item.dimensions, width: v } }) etc.

3. Если catalogItem.properties.length > 0:
   Секция "Свойства" (px-4 py-3):
   PropertyField для каждого PropertyDef.
   onChange: updateItem(id, { properties: { ...item.properties, [def.key]: v } })

Обнови RightPanel.tsx: вместо заглушки рендери <PropertiesPanel itemId={selectedItemId} />.

Убедись: изменение ширины в форме немедленно отражается в 3D-сцене.
```

---

## ФАЗА 6 — Коллизии

### TASK-017 — Проверка и запрет коллизий

**Промпт для Claude Code:**
```
Реализуй проверку AABB-коллизий при перемещении элементов.

Создай src/utils/collision.ts:

export function hasCollision(movedItem: SceneItem, allItems: SceneItem[]): boolean {
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

Обнови SceneElement.tsx:
Добавь state: lastValidPosition (инициализируй из item.position).
При onMouseDown на TransformControls: сохраняй текущую item.position в lastValidPosition.
При onMouseUp (кастомное событие 'transform-end'):
  - Проверяй hasCollision(currentItem, allItems) (currentItem берёт актуальный items из store)
  - Если коллизия:
    updateItem(id, { position: lastValidPosition }) // откат
    toast.warning('Элементы не могут пересекаться', { duration: 2000 })
  - Если нет коллизии:
    lastValidPosition = currentItem.position // обновляем валидную позицию

Установи зависимость sonner если не установлена. Импортируй { toast } from 'sonner'.
Убедись что <Toaster /> подключён в main.tsx.

Напиши тесты для hasCollision в src/utils/collision.test.ts:
- два совпадающих элемента → true
- два несовпадающих элемента → false
- элемент частично пересекающий другой → true
- элемент вплотную к другому (без пересечения) → false
```

---

## ФАЗА 7 — 2D-режим

### TASK-018 — Полноценный 2D-режим с размерами

**Промпт для Claude Code:**
```
Реализуй полноценный 2D-режим сцены (ортографический вид сверху).

Обнови SceneElement.tsx:
При sceneMode === '2d' (читай из useUIStore()):
  Добавь <Html center distanceFactor={500} position={[0, item.dimensions.height / 2 + 20, 0]}>
    <div className="text-xs bg-white/80 px-1 py-0.5 rounded border border-gray-400 whitespace-nowrap pointer-events-none">
      {item.dimensions.width} × {item.dimensions.depth} мм
    </div>
  </Html>

Обнови Room.tsx:
При sceneMode === '2d':
  - Стены делай невидимыми: material.visible = false (используй ref + useEffect)
  - Убери тени (directionalLight castShadow={false})
  - <Grid /> показывается всегда в 2D

При sceneMode === '3d':
  - Стены видимы, тени есть, Grid скрыт

Обнови SceneCanvas.tsx:
Условный рендер камер:
- '3d': <PerspectiveCamera makeDefault position={SCENE_CONFIG.camera.initialPosition} fov={SCENE_CONFIG.camera.fov} />
- '2d': <OrthographicCamera makeDefault position={[0, SCENE_CONFIG.room.height * 2, 0]} zoom={0.25} up={[0, 1, 0]} />

TransformControls в 2D: ограничь режим translate только по осям X и Z (не Y).
Добавь на TransformControls: showY={sceneMode === '3d'}.

Убедись:
- В 2D: вид сверху, Grid, размеры на элементах, нет вращения
- Переключение 2D↔3D плавное
```

---

## ФАЗА 8 — Полировка

### TASK-019 — Финальная проверка и README

**Промпт для Claude Code:**
```
Проведи финальную проверку приложения.

1. pnpm lint — исправь все ESLint ошибки
2. pnpm test — все тесты должны проходить
3. pnpm build — сборка без TypeScript ошибок

Проверь в браузере полный пользовательский сценарий:
- Открытие приложения → видна 3D-комната
- Добавление "Корпус шкафа" из каталога → появляется в центре
- Добавление "Полки" → появляется там же (коллизия!)
- Перемещение полки в сторону → гизмо работает
- Попытка переместить один элемент поверх другого → уведомление о коллизии
- Ctrl+Z → undo перемещения
- Ctrl+Y → redo
- Выбор элемента → правая панель показывает свойства
- Изменение ширины → элемент меняет размер в 3D
- Поворот через кнопку ↺ → элемент поворачивается
- Удаление → элемент исчезает, панель возвращается к каталогу
- Переключение в 2D → вид сверху с размерами
- Сужение браузера до < 1024px → заглушка отображается

Создай README.md в корне проекта с описанием стека и таблицей управления.
```

---

## ФАЗА 9 — Хоткеи

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

Компонент KeyboardShortcuts уже создан в TASK-009 и живёт в src/main.tsx.
Убедись что он там есть и содержит:
- 'ctrl+z' → useSceneStore.getState().undo()
- 'ctrl+y' → useSceneStore.getState().redo()

Добавь визуальную подсказку в UI: в правой панели под заголовком мелким текстом
"Ctrl+Z — отмена  ·  Ctrl+Y — повтор" (text-xs text-gray-400 px-4 pb-2).

Напиши интеграционный тест:
- Добавь элемент → undo → items пустой
- Добавь элемент → undo → redo → items содержит элемент
- 5 действий → 5 undo → items пустой → 5 redo → items содержит все 5 элементов
```

---

---

## ФАЗА 10 — Перепроектирование каталога

### TASK-020 — Каталог деталей шкафа + система материалов и цветов

**Промпт для Claude Code:**
```
Перепроектируй каталог: замени готовые шкафы на отдельные детали, из которых пользователь сам собирает шкаф.
Все размеры деталей редактируемы — нет фиксированных значений, только умолчания.

---

### 1. Обнови src/types/index.ts

Расширь PropertyDef двумя новыми типами и полем dependsOnMaterial:

```typescript
interface PropertyDef {
  key: string
  label: string
  type: 'number' | 'select' | 'material' | 'color'
  unit?: string
  min?: number
  max?: number
  options?: { label: string; value: string }[]
  dependsOnMaterial?: string  // только для type === 'color': ключ поля материала в properties
}
```

---

### 2. Создай src/catalog/materials.ts

```typescript
export const MATERIAL_OPTIONS = ['ЛДСП', 'МДФ', 'Массив', 'ДВП', 'Стекло', 'Металл'] as const
export type MaterialType = (typeof MATERIAL_OPTIONS)[number]

export const MATERIAL_COLORS: Record<MaterialType, { label: string; value: string }[]> = {
  'ЛДСП': [
    { label: 'Белый',      value: '#F5F5F0' },
    { label: 'Серый',      value: '#9E9E9E' },
    { label: 'Бетон',      value: '#8A8A8A' },
    { label: 'Дуб сонома', value: '#C8A97E' },
    { label: 'Венге',      value: '#3D2314' },
  ],
  'МДФ': [
    { label: 'Белый',  value: '#F5F5F0' },
    { label: 'Серый',  value: '#9E9E9E' },
    { label: 'Чёрный', value: '#1A1A1A' },
  ],
  'Массив': [
    { label: 'Сосна', value: '#D4A853' },
    { label: 'Дуб',   value: '#A0784A' },
    { label: 'Бук',   value: '#C4965A' },
    { label: 'Орех',  value: '#5C3D2E' },
  ],
  'ДВП': [
    { label: 'Белый', value: '#F5F5F0' },
    { label: 'Серый', value: '#B0B0B0' },
  ],
  'Стекло': [
    { label: 'Прозрачное',   value: '#ADD8E6' },
    { label: 'Матовое',      value: '#E0F0F8' },
    { label: 'Зеркало',      value: '#C8D8E0' },
    { label: 'Тонированное', value: '#6B8FA0' },
  ],
  'Металл': [
    { label: 'Хром',          value: '#C0C0C0' },
    { label: 'Матовый никель',value: '#A8A8A0' },
    { label: 'Чёрный',        value: '#1A1A1A' },
    { label: 'Золото',        value: '#CFB53B' },
  ],
}
```

---

### 3. Перепиши src/catalog/items.ts

Удали старые элементы: wardrobe-body, wardrobe-narrow, shelf (старый), drawer, rod, door-swing, door-slide.
Оставь house-plant-1 без изменений.

Для краткости: `matProps` и `matColorProps` — вспомогательные массивы:
```typescript
const matProps: PropertyDef[] = [
  { key: 'material', label: 'Материал', type: 'material' },
  { key: 'color',    label: 'Цвет',     type: 'color', dependsOnMaterial: 'material' },
]
```

**Категория "Корпус"** — 4 детали:

{ id: 'side-panel',    name: 'Боковая панель',  defaultDimensions: { width: 16,  height: 2200, depth: 600 }, properties: matProps }
{ id: 'top-panel',     name: 'Верхняя панель',  defaultDimensions: { width: 868, height: 16,   depth: 600 }, properties: matProps }
{ id: 'bottom-panel',  name: 'Нижняя панель',   defaultDimensions: { width: 868, height: 16,   depth: 600 }, properties: matProps }
{ id: 'back-panel',    name: 'Задняя стенка',   defaultDimensions: { width: 900, height: 2200, depth: 8   },
  properties: [
    { key: 'material', label: 'Материал', type: 'select',
      options: [{ label: 'ДВП', value: 'ДВП' }, { label: 'ЛДСП', value: 'ЛДСП' }] },
    { key: 'color', label: 'Цвет', type: 'color', dependsOnMaterial: 'material' },
  ] }

**Категория "Наполнение"** — 5 деталей:

{ id: 'shelf',           name: 'Полка',                  defaultDimensions: { width: 860, height: 16,  depth: 560 }, properties: matProps }
{ id: 'divider-vertical',name: 'Вертикальный разделитель',defaultDimensions: { width: 16,  height: 2168,depth: 560 }, properties: matProps }

{ id: 'hanging-rod', name: 'Штанга', defaultDimensions: { width: 860, height: 25, depth: 25 },
  properties: [
    { key: 'material', label: 'Материал', type: 'select', options: [{ label: 'Металл', value: 'Металл' }] },
    { key: 'color',    label: 'Финиш',    type: 'color', dependsOnMaterial: 'material' },
  ] }

{ id: 'drawer-box', name: 'Корпус ящика', defaultDimensions: { width: 860, height: 180, depth: 500 },
  properties: [
    ...matProps,
    { key: 'slides', label: 'Направляющие', type: 'select',
      options: [
        { label: 'Роликовые',   value: 'roller' },
        { label: 'Шариковые',   value: 'ball'   },
        { label: 'Push-to-open',value: 'push'   },
      ] },
  ] }

{ id: 'trouser-rack', name: 'Брючница', defaultDimensions: { width: 860, height: 50, depth: 300 },
  properties: [
    { key: 'material', label: 'Материал', type: 'select', options: [{ label: 'Металл', value: 'Металл' }] },
    { key: 'color',    label: 'Финиш',    type: 'color', dependsOnMaterial: 'material' },
  ] }

**Категория "Двери и фасады"** — 3 детали:

{ id: 'door-hinged', name: 'Дверь распашная', defaultDimensions: { width: 450, height: 2200, depth: 18 },
  properties: [
    { key: 'material', label: 'Материал', type: 'select',
      options: [{ label: 'ЛДСП', value: 'ЛДСП' }, { label: 'МДФ', value: 'МДФ' }, { label: 'Стекло', value: 'Стекло' }] },
    { key: 'color',    label: 'Цвет',     type: 'color', dependsOnMaterial: 'material' },
    { key: 'opening',  label: 'Открывание', type: 'select',
      options: [{ label: 'Влево', value: 'left' }, { label: 'Вправо', value: 'right' }] },
  ] }

{ id: 'door-sliding', name: 'Дверь раздвижная', defaultDimensions: { width: 900, height: 2200, depth: 22 },
  properties: [
    { key: 'material', label: 'Материал', type: 'select',
      options: [{ label: 'ЛДСП', value: 'ЛДСП' }, { label: 'Стекло', value: 'Стекло' }] },
    { key: 'color', label: 'Цвет', type: 'color', dependsOnMaterial: 'material' },
  ] }

{ id: 'drawer-front', name: 'Фасад ящика', defaultDimensions: { width: 860, height: 196, depth: 18 }, properties: matProps }

**Категория "Основание"** — 3 детали:

{ id: 'plinth',  name: 'Цоколь',  defaultDimensions: { width: 900, height: 100, depth: 16 }, properties: matProps }
{ id: 'cornice', name: 'Карниз',  defaultDimensions: { width: 900, height: 60,  depth: 60 }, properties: matProps }

{ id: 'leg', name: 'Ножка', defaultDimensions: { width: 30, height: 100, depth: 30 },
  properties: [
    { key: 'material', label: 'Материал', type: 'select',
      options: [{ label: 'Пластик', value: 'plastic' }, { label: 'Металл', value: 'Металл' }] },
    { key: 'color', label: 'Цвет', type: 'color', dependsOnMaterial: 'material' },
  ] }

**Категория "Фурнитура"** — 3 детали:

{ id: 'handle-bar', name: 'Ручка-скоба', defaultDimensions: { width: 128, height: 12, depth: 30 },
  properties: [
    { key: 'spacing', label: 'Межосевое', type: 'select',
      options: [
        { label: '96 мм',  value: '96'  },
        { label: '128 мм', value: '128' },
        { label: '160 мм', value: '160' },
        { label: '224 мм', value: '224' },
      ] },
    { key: 'material', label: 'Материал', type: 'select', options: [{ label: 'Металл', value: 'Металл' }] },
    { key: 'color',    label: 'Финиш',    type: 'color', dependsOnMaterial: 'material' },
  ] }

{ id: 'handle-knob', name: 'Ручка-кнопка', defaultDimensions: { width: 30, height: 30, depth: 25 },
  properties: [
    { key: 'material', label: 'Материал', type: 'select', options: [{ label: 'Металл', value: 'Металл' }] },
    { key: 'color',    label: 'Финиш',    type: 'color', dependsOnMaterial: 'material' },
  ] }

{ id: 'hinge', name: 'Петля', defaultDimensions: { width: 35, height: 13, depth: 50 },
  properties: [
    { key: 'angle', label: 'Угол', type: 'select',
      options: [{ label: '90°', value: '90' }, { label: '110°', value: '110' }, { label: '170°', value: '170' }] },
    { key: 'mount', label: 'Монтаж', type: 'select',
      options: [
        { label: 'Накладная',     value: 'overlay' },
        { label: 'Полунакладная', value: 'half'    },
        { label: 'Внутренняя',    value: 'inset'   },
      ] },
  ] }

---

### 4. Обнови src/components/panels/PropertyField.tsx

Добавь два новых рендера. Компонент получает новый необязательный проп:
`allProperties?: Record<string, string | number>` — для определения активного материала.

**type === 'material'**:
Рендери как стандартный `<select>`. Опции берутся из `def.options` (переданы в CatalogItem).
Если `def.options` пуст — берётся весь MATERIAL_OPTIONS из materials.ts.

**type === 'color'**:
```typescript
const materialKey = def.dependsOnMaterial ?? 'material'
const currentMaterial = allProperties?.[materialKey] as string | undefined
const colorOptions = currentMaterial ? (MATERIAL_COLORS[currentMaterial as MaterialType] ?? []) : []

// Рендер: flex flex-wrap gap-1.5 mt-1
// Каждый кружок: w-6 h-6 rounded-full border-2 cursor-pointer transition-all
// Активный: border-blue-600 scale-110, неактивный: border-transparent hover:border-gray-400
// title={opt.label}, style={{ backgroundColor: opt.value }}
// Если colorOptions пустой — не рендерить ничего
```

---

### 5. Обнови src/components/panels/PropertiesPanel.tsx

Пробрасывай `allProperties={item.properties}` в каждый `<PropertyField />`.

При изменении поля с `type === 'material'` — одновременно сбрасывай цвет на первый цвет нового материала:
```typescript
const handleChange = (def: PropertyDef, v: string | number) => {
  if (def.type === 'material') {
    const firstColor = MATERIAL_COLORS[v as MaterialType]?.[0]?.value ?? ''
    updateItem(id, { properties: { ...item.properties, [def.key]: v, color: firstColor } })
  } else {
    updateItem(id, { properties: { ...item.properties, [def.key]: v } })
  }
}
```

---

### 6. Обнови src/components/scene/SceneElement.tsx

Для всех деталей, кроме GLTF, цвет берётся из item.properties.color:
```typescript
const propColor = item.properties?.color as string | undefined
const color = propColor?.startsWith('#') ? propColor : (COLORS[item.catalogId] ?? '#cccccc')
```

Для стекла добавь прозрачность:
```typescript
const isGlass = item.properties?.material === 'Стекло'
// <meshStandardMaterial color={color} opacity={isGlass ? 0.4 : 1} transparent={isGlass} />
```

Удали из COLORS старые ключи (wardrobe-body, wardrobe-narrow, drawer, rod, door-swing, door-slide).
Оставь fallback цвет '#cccccc' для неизвестных деталей.

---

### 7. Обнови sceneStore.ts — инициализация properties

В `addItem`: при инициализации properties для `type === 'material'` бери первый `def.options[0].value`.
Для `type === 'color'` — найди соответствующий материал и бери `MATERIAL_COLORS[material][0].value`.

---

### 8. Обнови тесты

**src/catalog/items.test.ts**:
- getCatalogByCategory возвращает 6 категорий: 'Корпус', 'Наполнение', 'Двери и фасады', 'Основание', 'Фурнитура', 'Декорации'
- house-plant-1 остался в категории 'Декорации'
- Все items имеют непустые id, name, category и defaultDimensions
- getCatalogItemById('side-panel') возвращает нужный элемент

**src/store/sceneStore.test.ts**:
Замени тестовый CatalogItem на side-panel:
{ id: 'side-panel', name: 'Боковая панель', category: 'Корпус',
  defaultDimensions: { width: 16, height: 2200, depth: 600 }, properties: [] }

---

### Проверь в браузере (Playwright):

- Каталог показывает 6 категорий, ~19 деталей
- Добавление "Боковой панели" → тонкая вертикальная панель появляется в центре сцены
- PropertiesPanel: все три поля размеров (ширина/высота/глубина) редактируемы
- Выбор материала → список цветов перестраивается, первый цвет выбирается автоматически
- Клик по кружку цвета → деталь в 3D меняет цвет немедленно
- Добавление "Стекло" как материал двери → деталь становится полупрозрачной
- house-plant-1 работает как прежде (GLTF, ползунок %)
- Undo/Redo работает для всех операций
```

---

## ФАЗА 11 — Система слоёв и группировка

### TASK-021 — Панель слоёв, мульти-выбор и группировка элементов

**Промпт для Claude Code:**
```
Реализуй систему слоёв в стиле Adobe Photoshop: правая панель получает вкладки
"Каталог" и "Слои", в панели слоёв отображаются все элементы сцены, пользователь
может выделить несколько элементов, сгруппировать их через ПКМ-меню и перемещать
группу целиком в 3D.

---

## 1. Обнови src/types/index.ts

Добавь тип SceneGroup:

```typescript
export interface SceneGroup {
  id: string           // uuid
  name: string         // 'Группа 1', 'Шкаф' и т.д.
  itemIds: string[]    // упорядоченный список id элементов в группе
  collapsed: boolean   // свёрнута ли в панели слоёв
}
```

В SceneItem добавь поле (не ломает существующий код — поле опциональное при чтении, обязательное при создании):
```typescript
groupId: string | null  // null = не в группе
```

---

## 2. Обнови src/store/sceneStore.ts

### 2a. Изменить тип HistorySnapshot

Замени `SceneItem[][]` в `history` и `future` на `HistorySnapshot[]`, где:
```typescript
type HistorySnapshot = { items: SceneItem[]; groups: SceneGroup[] }
```

Обнови `pushHistory` — теперь он снимает и `items`, и `groups`:
```typescript
function pushHistory(state: Pick<SceneState, 'items' | 'groups' | 'history' | 'future'>) {
  const snapshot: HistorySnapshot = {
    items: [...state.items],
    groups: [...state.groups],
  }
  const history = [...state.history, snapshot]
  if (history.length > 50) history.shift()
  return { history, future: [] as HistorySnapshot[] }
}
```

Обнови `undo()` и `redo()` — восстанавливают и `items`, и `groups`:
```typescript
undo() {
  const { history, items, groups, future } = get()
  if (history.length === 0) return
  const prev = history[history.length - 1]
  set({
    items: prev.items,
    groups: prev.groups,
    history: history.slice(0, -1),
    future: [{ items, groups }, ...future],
    selectedItemId: null,
    selectedItemIds: [],
  })
},
redo() {
  const { future, items, groups, history } = get()
  if (future.length === 0) return
  const next = future[0]
  set({
    items: next.items,
    groups: next.groups,
    history: [...history, { items, groups }],
    future: future.slice(1),
    selectedItemId: null,
    selectedItemIds: [],
  })
},
```

### 2b. Добавить в состояние

```typescript
groups: SceneGroup[]        // начальное значение []
selectedItemIds: string[]   // начальное значение []
groupCounter: number        // начальное значение 0, для автоимён "Группа N"
```

`selectedItemId` оставить — синхронизируется с `selectedItemIds[0] ?? null`.

### 2c. Обновить существующие методы

`addItem`: добавлять `groupId: null` в создаваемый `SceneItem`.

`removeItem`: если `item.groupId !== null` — убирать `item.id` из `group.itemIds`;
если после этого в группе остался 0 или 1 элемент → `ungroupItems` для этой группы
(реализовать как инлайн-логику, не как рекурсию).

`selectItem(id)`: теперь также обновляет `selectedItemIds = id ? [id] : []`.

### 2d. Новые методы

```typescript
selectItems(ids: string[]): void
  // НЕ в историю
  // selectedItemIds = ids
  // selectedItemId = ids[0] ?? null

toggleItemSelection(id: string, addToSelection: boolean): void
  // НЕ в историю
  // если addToSelection:
  //   если id уже в selectedItemIds → убрать его (toggle off)
  //   иначе → добавить
  // если !addToSelection → selectedItemIds = [id]
  // selectedItemId = selectedItemIds[0] ?? null

createGroup(name: string): void
  // Требует selectedItemIds.length >= 2; если нет — return
  // pushHistory
  // groupCounter++
  // создаёт SceneGroup { id: uuid(), name, itemIds: [...selectedItemIds], collapsed: false }
  // у каждого item из selectedItemIds устанавливает groupId = group.id
  // добавляет в groups
  // selectedItemIds = [], selectedItemId = null

ungroupItems(groupId: string): void
  // pushHistory
  // у всех items с groupId = groupId устанавливает groupId = null
  // удаляет группу из groups

moveGroup(groupId: string, delta: [number, number, number]): void
  // pushHistory
  // для каждого item в groups.find(g => g.id === groupId).itemIds:
  //   item.position[0] += delta[0]
  //   item.position[1] = Math.max(item.dimensions.height / 2, item.position[1] + delta[1])
  //   item.position[2] += delta[2]

removeGroup(groupId: string): void
  // pushHistory
  // удаляет из items все элементы с groupId === groupId
  // удаляет группу из groups
  // сбрасывает selectedItemId, selectedItemIds

renameGroup(groupId: string, name: string): void
  // НЕ в историю (UI-операция)
  // обновляет name у группы в groups

toggleGroupCollapse(groupId: string): void
  // НЕ в историю
  // переключает collapsed у группы в groups
```

---

## 3. Обнови src/store/uiStore.ts

Добавь:
```typescript
activeRightPanelTab: 'catalog' | 'layers'   // начальное: 'catalog'
setActiveRightPanelTab: (tab: 'catalog' | 'layers') => void
```

---

## 4. Установи зависимость

```bash
pnpm add @radix-ui/react-context-menu
```

---

## 5. Обнови src/components/panels/RightPanel.tsx

Заменить текущую логику на:

```
1. Сверху — TabBar с двумя вкладками "Каталог" и "Слои"
   - flex border-b border-gray-200
   - Каждый таб: кнопка px-4 py-2.5 text-sm font-medium
   - Активный: border-b-2 border-blue-600 text-blue-700 bg-white
   - Неактивный: text-gray-500 hover:text-gray-700

2. Ниже — контент:
   - если selectedItemId !== null → <PropertiesPanel itemId={selectedItemId} />
     (перекрывает любой активный таб)
   - иначе если activeRightPanelTab === 'catalog' → <CatalogPanel />
   - иначе (activeRightPanelTab === 'layers') → <LayersPanel />
```

В PropertiesPanel обнови кнопку закрытия — при клике сбрасывать и `selectItem(null)`, и `selectItems([])`.

---

## 6. Создай src/components/panels/LayersPanel.tsx

Компонент показывает все элементы сцены в порядке "новые сверху" (reverse порядка `items`).

**Логика порядка отображения:**
Элементы внутри группы показываются вложенно под заголовком группы.
Одиночные элементы (groupId === null) показываются между группами по позиции в массиве items.

Упрощённый подход к порядку (достаточно для MVP):
1. Вычисли список "строк верхнего уровня" в обратном порядке items:
   - Если item.groupId === null → одиночная строка
   - Если item.groupId !== null → вставь строку группы (один раз, при первой встрече элемента этой группы)
2. Рендери эти строки сверху вниз

```typescript
// Вспомогательная функция для вычисления порядка в LayersPanel
function buildLayerRows(items: SceneItem[], groups: SceneGroup[]): Array<
  | { type: 'item'; item: SceneItem }
  | { type: 'group'; group: SceneGroup }
> {
  const seen = new Set<string>() // seen group ids
  const rows = []
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i]
    if (item.groupId === null) {
      rows.push({ type: 'item', item })
    } else if (!seen.has(item.groupId)) {
      seen.add(item.groupId)
      const group = groups.find(g => g.id === item.groupId)
      if (group) rows.push({ type: 'group', group })
    }
  }
  return rows
}
```

**Строка одиночного элемента:**
```tsx
<div
  key={item.id}
  className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer select-none
    hover:bg-gray-50 ${selectedItemIds.includes(item.id) ? 'bg-blue-50 text-blue-700' : ''}`}
  onClick={(e) => {
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      toggleItemSelection(item.id, true)
    } else {
      selectItems([item.id])
    }
  }}
  onContextMenu={(e) => { e.preventDefault(); setCtxTarget({ kind: 'item', id: item.id }) }}
>
  <span className="text-gray-400 flex-shrink-0">▪</span>
  <span className="text-sm truncate flex-1">{item.name}</span>
</div>
```

**Строка группы (коллапсируемая):**
```tsx
<div key={group.id}>
  {/* Заголовок группы */}
  <div
    className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer select-none
      hover:bg-gray-50
      ${group.itemIds.every(id => selectedItemIds.includes(id)) ? 'bg-blue-50 text-blue-700' : ''}`}
    onClick={() => selectItems(group.itemIds)}
    onContextMenu={(e) => { e.preventDefault(); setCtxTarget({ kind: 'group', id: group.id }) }}
  >
    <button
      className="text-gray-400 w-3 text-xs"
      onClick={(e) => { e.stopPropagation(); toggleGroupCollapse(group.id) }}
    >
      {group.collapsed ? '▶' : '▼'}
    </button>
    <span className="text-gray-500 flex-shrink-0">⊞</span>
    <span className="text-sm font-medium truncate flex-1">{group.name}</span>
    <span className="text-xs text-gray-400 ml-auto">{group.itemIds.length}</span>
  </div>

  {/* Элементы группы */}
  {!group.collapsed && group.itemIds.map(itemId => {
    const item = items.find(i => i.id === itemId)
    if (!item) return null
    return (
      <div
        key={itemId}
        className={`flex items-center gap-2 pl-8 pr-3 py-1.5 cursor-pointer select-none
          hover:bg-gray-50 ${selectedItemIds.includes(itemId) ? 'bg-blue-50 text-blue-700' : ''}`}
        onClick={(e) => {
          if (e.shiftKey || e.ctrlKey || e.metaKey) {
            toggleItemSelection(itemId, true)
          } else {
            selectItems([itemId])
          }
        }}
        onContextMenu={(e) => { e.preventDefault(); setCtxTarget({ kind: 'item', id: itemId }) }}
      >
        <span className="text-gray-300 flex-shrink-0">▪</span>
        <span className="text-sm truncate">{item.name}</span>
      </div>
    )
  })}
</div>
```

**Пустое состояние (items.length === 0):**
```tsx
<div className="flex flex-col items-center justify-center py-16 text-gray-400 text-sm">
  <span className="text-3xl mb-2">⧄</span>
  <span>Сцена пуста</span>
  <span className="text-xs mt-1 text-gray-300">Добавьте элементы из каталога</span>
</div>
```

---

## 7. Контекстное меню в LayersPanel

Используй Radix UI ContextMenu (`@radix-ui/react-context-menu`).

Состояние в LayersPanel:
```typescript
type CtxTarget =
  | { kind: 'item'; id: string }
  | { kind: 'group'; id: string }
  | null
const [ctxTarget, setCtxTarget] = useState<CtxTarget>(null)
```

Оберни весь список в `<ContextMenu.Root>`. Используй `<ContextMenu.Trigger asChild>` вокруг контейнера списка.

Содержимое `<ContextMenu.Content>` — вычисляется по `ctxTarget`:

**Если ctxTarget.kind === 'item':**
```tsx
{selectedItemIds.length >= 2 && (
  <ContextMenu.Item onSelect={() => {
    createGroup(`Группа ${groupCounter + 1}`)
  }}>
    Создать группу ({selectedItemIds.length} элемента)
  </ContextMenu.Item>
)}
<ContextMenu.Item onSelect={() => removeItem(ctxTarget.id)}>
  Удалить
</ContextMenu.Item>
{/* Если элемент в группе: */}
{items.find(i => i.id === ctxTarget.id)?.groupId && (
  <>
    <ContextMenu.Separator />
    <ContextMenu.Item onSelect={() => {
      const groupId = items.find(i => i.id === ctxTarget.id)?.groupId
      if (groupId) ungroupItems(groupId)
    }}>
      Разгруппировать
    </ContextMenu.Item>
  </>
)}
```

**Если ctxTarget.kind === 'group':**
```tsx
<ContextMenu.Item onSelect={() => {
  // Inline rename: показать input поверх названия группы
  setRenamingGroupId(ctxTarget.id)
}}>
  Переименовать
</ContextMenu.Item>
<ContextMenu.Item onSelect={() => ungroupItems(ctxTarget.id)}>
  Разгруппировать
</ContextMenu.Item>
<ContextMenu.Separator />
<ContextMenu.Item
  className="text-red-600"
  onSelect={() => removeGroup(ctxTarget.id)}
>
  Удалить группу и элементы
</ContextMenu.Item>
```

**Переименование inline:**
Добавь состояние `renamingGroupId: string | null`.
Когда `renamingGroupId` совпадает с `group.id` — рендери `<input>` вместо `<span>` с именем группы.
При `onBlur` или `Enter`: `renameGroup(groupId, newName)`, `setRenamingGroupId(null)`.
При `Escape`: сбросить без сохранения.

Стиль ContextMenu.Content:
```
bg-white rounded-lg shadow-lg border border-gray-200 p-1 min-w-[180px] z-50
```
Стиль ContextMenu.Item:
```
px-3 py-1.5 text-sm cursor-pointer rounded hover:bg-gray-100 outline-none
```
Стиль ContextMenu.Separator:
```
my-1 border-t border-gray-100
```

---

## 8. Выделение в 3D-сцене (SceneElement.tsx)

Обнови логику выделения:

```typescript
const selectedItemIds = useSceneStore(s => s.selectedItemIds)
const isSelected = selectedItemIds.includes(item.id)
// TransformControls показывать только если выбран ровно один элемент
// и у него нет сформированной группы которая вся выделена
const groups = useSceneStore(s => s.groups)
const myGroup = item.groupId ? groups.find(g => g.id === item.groupId) : null
const groupIsFullySelected = myGroup
  ? myGroup.itemIds.every(id => selectedItemIds.includes(id))
  : false
const showTransformControls = isSelected && selectedItemIds.length === 1 && !groupIsFullySelected
```

Синяя обводка (EdgesGeometry): показывать при `isSelected` (как раньше).
TransformControls: показывать только при `showTransformControls === true`.

---

## 9. Создай src/components/scene/GroupTransformProxy.tsx

```typescript
interface Props {
  groupId: string
}
```

Компонент читает группу и её элементы из store. Вычисляет AABB-центр группы:

```typescript
const center = useMemo((): [number, number, number] => {
  const groupItems = items.filter(i => group.itemIds.includes(i.id))
  if (groupItems.length === 0) return [0, 0, 0]
  const xs = groupItems.flatMap(i => [
    i.position[0] - i.dimensions.width / 2,
    i.position[0] + i.dimensions.width / 2,
  ])
  const ys = groupItems.flatMap(i => [
    i.position[1] - i.dimensions.height / 2,
    i.position[1] + i.dimensions.height / 2,
  ])
  const zs = groupItems.flatMap(i => [
    i.position[2] - i.dimensions.depth / 2,
    i.position[2] + i.dimensions.depth / 2,
  ])
  return [
    (Math.min(...xs) + Math.max(...xs)) / 2,
    (Math.min(...ys) + Math.max(...ys)) / 2,
    (Math.min(...zs) + Math.max(...zs)) / 2,
  ]
}, [items, group])
```

Рендерит pivot-mesh и TransformControls:
```tsx
const pivotRef = useRef<THREE.Mesh>(null)
const initialCenterRef = useRef<[number, number, number]>([0, 0, 0])

<mesh ref={pivotRef} position={center} visible={false}>
  <boxGeometry args={[1, 1, 1]} />
  <meshBasicMaterial />
</mesh>

{pivotRef.current && (
  <TransformControls
    object={pivotRef.current}
    mode="translate"
    onMouseDown={() => {
      initialCenterRef.current = center
      window.dispatchEvent(new CustomEvent('transform-start'))
    }}
    onMouseUp={() => {
      window.dispatchEvent(new CustomEvent('transform-end'))
      if (!pivotRef.current) return
      const pos = pivotRef.current.position
      const delta: [number, number, number] = [
        pos.x - initialCenterRef.current[0],
        pos.y - initialCenterRef.current[1],
        pos.z - initialCenterRef.current[2],
      ]
      // Проверяем коллизию
      if (hasGroupCollision(group.itemIds, delta, items)) {
        // Откат пивота
        pivotRef.current.position.set(...initialCenterRef.current)
        toast.warning('Группа не может пересекаться с другими элементами')
        return
      }
      moveGroup(group.id, delta)
    }}
  />
)}
```

**Когда рендерить GroupTransformProxy в SceneCanvas:**

```typescript
// В SceneCanvas:
const selectedItemIds = useSceneStore(s => s.selectedItemIds)
const groups = useSceneStore(s => s.groups)
const activeGroupId = useMemo(() => {
  if (selectedItemIds.length < 2) return null
  const group = groups.find(g =>
    g.itemIds.length === selectedItemIds.length &&
    selectedItemIds.every(id => g.itemIds.includes(id))
  )
  return group?.id ?? null
}, [selectedItemIds, groups])

// В JSX:
{activeGroupId && <GroupTransformProxy groupId={activeGroupId} />}
```

---

## 10. Обнови src/utils/collision.ts

Добавь:

```typescript
export function hasGroupCollision(
  groupItemIds: string[],
  delta: [number, number, number],
  allItems: SceneItem[]
): boolean {
  const groupItems = allItems.filter(i => groupItemIds.includes(i.id))
  const outsideItems = allItems.filter(i => !groupItemIds.includes(i.id))

  return groupItems.some(item => {
    const movedItem: SceneItem = {
      ...item,
      position: [
        item.position[0] + delta[0],
        item.position[1] + delta[1],
        item.position[2] + delta[2],
      ],
    }
    return hasCollision(movedItem, outsideItems)
  })
}
```

Добавь тесты в `src/utils/collision.test.ts`:
- `hasGroupCollision` возвращает true когда хотя бы один элемент группы пересекается с внешним
- `hasGroupCollision` возвращает false когда никто не пересекается

---

## 11. Обнови тесты sceneStore

В `src/store/sceneStore.test.ts`:
- `addItem` создаёт элемент с `groupId: null`
- `createGroup` из двух элементов: создаёт группу, у обоих элементов `groupId === group.id`
- `createGroup` при `selectedItemIds.length < 2`: ничего не делает
- `ungroupItems` сбрасывает `groupId` у всех элементов группы
- `moveGroup` сдвигает все элементы на delta
- `removeGroup` удаляет группу и все её элементы из `items`
- `undo` после `createGroup` восстанавливает состояние без группы
- `undo` после `moveGroup` восстанавливает позиции

---

## 12. Проверь в браузере

1. Табы "Каталог" | "Слои" отображаются, переключение работает
2. В "Слоях" с пустой сценой — пустое состояние с иконкой
3. Добавить 2 элемента из каталога → оба видны в "Слоях" (новый сверху)
4. Клик по строке элемента → выделяется синим в слоях и обводкой в 3D
5. Ctrl+клик по второму → оба выделены
6. ПКМ с двумя выделенными → контекстное меню с "Создать группу (2 элемента)"
7. Нажать "Создать группу" → в слоях появляется строка "Группа 1" с иконкой и числом (2)
8. Стрелка ▼ → группа раскрывается и видны вложенные элементы
9. Клик по заголовку группы → оба элемента выделены в 3D, в сцене появляется TransformControls на центре группы
10. Перетащить TransformControls → оба элемента двигаются вместе
11. Переместить группу поверх третьего элемента → toast.warning, группа откатывается
12. Ctrl+Z → moveGroup откатывается; ещё раз Ctrl+Z → createGroup откатывается (элементы снова одиночные)
13. ПКМ на группе → "Разгруппировать" → элементы снова в общем списке
14. ПКМ на группе → "Удалить группу и элементы" → всё исчезает
15. Одиночный элемент выбран → PropertiesPanel открывается как прежде (перекрывает панель слоёв)
```

---

## ФАЗА 12 — UX-улучшения

### TASK-022 — Координаты выбранного элемента на оверлее сцены

**Промпт для Claude Code:**
```
Добавь отображение X/Y/Z-координат выбранного элемента прямо в SceneOverlay.tsx.

## Что нужно сделать

В src/components/scene/SceneOverlay.tsx:

1. Подпишись на стор:
   ```typescript
   const selectedItemId = useSceneStore(s => s.selectedItemId)
   const selectedItem = useSceneStore(s =>
     s.selectedItemId ? s.items.find(i => i.id === s.selectedItemId) : null
   )
   ```

2. Когда selectedItem не null — рендери блок с координатами рядом с переключателем 2D/3D.
   Позиция в сторе — это центр элемента (Y = height/2 когда элемент стоит на полу).
   Для отображения приводи к позиции нижней грани (Y_отображаемый = position[1] − height/2),
   тогда Y = 0 означает «стоит на полу» — это удобнее для пользователя.

3. Формат координат: три метки в ряд, значения в миллиметрах, округлённые до целых:
   ```
   X  450   Y  0   Z  300
   ```
   Каждая метка — пара `<span className="text-xs text-gray-400">X</span>` +
   `<span className="text-xs font-mono text-white">{Math.round(x)}</span>`.

4. Стилизация блока координат:
   - Размещается рядом с кнопками 2D/3D (в той же строке, через gap или ml-3)
   - bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1.5
   - flex items-center gap-3
   - Анимация появления/исчезания: используй условный рендер (если selectedItem === null — не рендерить)

5. Обновление в реальном времени: поскольку SceneElement вызывает updateItem() при каждом
   onChange TransformControls, Zustand реактивно пересчитает selectedItem — никаких
   дополнительных подписок не нужно.

## Проверь

- Добавь элемент → выдели → координаты появляются рядом с 2D/3D
- Потащи элемент через TransformControls → координаты обновляются в реальном времени
- Щёлкни мимо (снять выделение) → блок исчезает
- Элемент стоит на полу → Y отображается как 0
- Оба режима (2D и 3D) — координаты видны в обоих

## Не нужно

- Никаких новых файлов — только правка SceneOverlay.tsx
- Не добавлять поле ввода — только read-only отображение
- Не тестировать 3D-компоненты (R3F не работает в jsdom)
```

---

### TASK-023 — Блокировка элементов и групп

**Промпт для Claude Code:**
```
Реализуй блокировку элементов и групп — как «lock layer» в Photoshop/Figma.
Заблокированный элемент нельзя переместить, повернуть или изменить свойства.

## 1. Обнови src/types/index.ts

Добавь поле в SceneItem:
```typescript
locked: boolean  // false по умолчанию
```

Добавь поле в SceneGroup:
```typescript
locked: boolean  // false по умолчанию
```

## 2. Обнови src/store/sceneStore.ts

В `addItem` инициализируй `locked: false` в создаваемом SceneItem.

Добавь два новых метода (НЕ попадают в историю — аналог renameGroup):

```typescript
toggleItemLock(id: string): void
  // item.locked = !item.locked

toggleGroupLock(groupId: string): void
  // group.locked = !group.locked
  // устанавливает locked у всех элементов группы = group.locked (синхронизировать)
```

## 3. Обнови src/components/panels/LayersPanel.tsx

В строке одиночного элемента — добавь иконку замка после имени:

```tsx
<button
  className="ml-auto flex-shrink-0 p-0.5 rounded text-gray-300 hover:text-gray-600"
  title={item.locked ? 'Разблокировать' : 'Заблокировать'}
  onClick={(e) => { e.stopPropagation(); toggleItemLock(item.id) }}
>
  {item.locked ? '🔒' : '🔓'}
</button>
```

Аналогично в заголовке группы — иконка замка рядом с числом участников:
```tsx
<button
  className="flex-shrink-0 p-0.5 rounded text-gray-300 hover:text-gray-600"
  title={group.locked ? 'Разблокировать группу' : 'Заблокировать группу'}
  onClick={(e) => { e.stopPropagation(); toggleGroupLock(group.id) }}
>
  {group.locked ? '🔒' : '🔓'}
</button>
```

Заблокированный элемент/группа — подсвечивай имя серым: добавь `text-gray-400` к имени когда `locked === true`.

## 4. Обнови src/components/scene/SceneElement.tsx

```typescript
const isLocked = item.locked === true

// TransformControls — не монтировать:
const showTransformControls = isSelected && selectedItemIds.length === 1 && !groupIsFullySelected && !isLocked

// onClick — клик по заблокированному элементу всё равно выделяет его (для просмотра свойств):
onClick={(e) => { e.stopPropagation(); selectItem(item.id) }}  // без изменений

// Визуальная подсказка: заблокированный элемент — рендери обводку пунктиром вместо сплошной
// (достаточно изменить цвет EdgesGeometry: '#9ca3af' вместо '#2563eb' при isLocked)
```

## 5. Обнови src/components/scene/GroupTransformProxy.tsx

Добавь проверку — не монтируй TransformControls если группа заблокирована:

```typescript
const group = useSceneStore(s => s.groups.find(g => g.id === groupId))
if (!group || group.locked) return null
```

## 6. Обнови src/components/panels/PropertiesPanel.tsx

Когда `item.locked === true` — показывай все `<input>` и `<select>` с `disabled`:

```tsx
// Пробрасывай проп disabled в PropertyField:
<PropertyField ... disabled={item.locked} />
```

В PropertyField добавь проп `disabled?: boolean` и прокидывай его на input/select.
Добавь визуальный индикатор в шапку PropertiesPanel когда элемент заблокирован:
```tsx
{item.locked && (
  <span className="text-xs text-amber-600 font-medium">🔒 Заблокирован</span>
)}
```

## 7. Обнови тесты в src/store/sceneStore.test.ts

- `addItem` создаёт элемент с `locked: false`
- `toggleItemLock` меняет `locked` с false на true и обратно
- `toggleGroupLock` устанавливает `locked` у всех элементов группы

## 8. Обнови тесты в src/components/panels/PropertiesPanel.test.tsx

- при `locked === true` все input/select имеют атрибут disabled

## Проверь в браузере

1. В панели слоёв у каждого элемента иконка замка
2. Клик по иконке — элемент блокируется, имя становится серым, иконка меняется на 🔒
3. Выделить заблокированный элемент → TransformControls не появляется
4. PropertiesPanel открывается, но все поля disabled и есть надпись «Заблокирован»
5. Заблокировать группу → все элементы группы тоже блокируются
6. Разблокировать группу → все элементы разблокируются
7. Ctrl+Z не отменяет блокировку (не в истории)
```

---

### TASK-024 — Баг: элемент группы возвращается на старую позицию после перемещения группы

**Промпт для Claude Code:**
```
## Описание бага

После перемещения группы элементов через GroupTransformProxy, клик на отдельный элемент
этой группы в панели слоёв (LayersPanel) приводит к тому, что этот элемент визуально
возвращается на позицию, которую он занимал ДО перемещения группы.

Шаги воспроизведения:
1. Выделить несколько элементов в LayersPanel, создать группу через ПКМ
2. Выделить группу кликом по заголовку группы
3. Переместить группу гизмо (GroupTransformProxy)
4. Кликнуть на конкретный элемент группы в LayersPanel
5. Элемент визуально снапится обратно на старую позицию

## Корень проблемы

В `src/components/scene/SceneElement.tsx`:

```typescript
const lastFramePos = useRef<[number, number, number]>(item.position)
```

`lastFramePos` инициализируется один раз при монтировании и **никогда не обновляется**,
когда `item.position` изменяется извне (через `moveGroup`).

При клике на отдельный элемент из ранее перемещённой группы:
1. `showTransformControls` переходит из `false` → `true` (группа больше не fully selected)
2. `TransformControls` монтируется для этого элемента
3. Three.js `TransformControls` стреляет spurious «change» событие при монтировании
   (это известная проблема — `GroupTransformProxy` уже решает её через `draggingRef`)
4. В `onChange` выполняется сравнение:
   - `newOverlap` = перекрытие элемента на **новой** позиции со всеми остальными элементами на **новых** позициях
   - `curOverlap` = перекрытие элемента на **старой** позиции (`lastFramePos.current`) со всеми остальными элементами на **новых** позициях

   Для компонентов шкафа по умолчанию это AABB-перекрытие намеренное (задняя стенка
   заходит за боковые панели — overlap ≈ 281 600 mm³). После перемещения группы:
   - `newOverlap` = то же самое перекрытие (относительные позиции сохранились)
   - `curOverlap` = 0 (старая позиция боковой панели уже далеко от новой позиции задней стенки)
   - `newOverlap (281 600) > curOverlap (0) + 1` → **TRUE**

5. Результат: `groupRef.current.position.set(...lastFramePos.current)` — Three.js-объект
   визуально сбрасывается на старую позицию. Стор при этом содержит новую позицию, поэтому
   R3F не выполняет reconciliation (нет нового React commit).

## Правки

### Правка 1 — добавить `draggingRef` и заглушить spurious onChange (главная правка)

Файл: `src/components/scene/SceneElement.tsx`

Добавь `draggingRef` по аналогии с `GroupTransformProxy.tsx` (там уже есть такая защита):

```typescript
const draggingRef = useRef(false)
```

В `onMouseDown`:
```typescript
onMouseDown={() => {
  draggingRef.current = true
  if (groupRef.current)
    lastFramePos.current = groupRef.current.position.toArray() as [number, number, number]
  window.dispatchEvent(new CustomEvent('transform-start'))
}}
```

В `onMouseUp`:
```typescript
onMouseUp={() => {
  draggingRef.current = false
  window.dispatchEvent(new CustomEvent('transform-end'))
  // ...остальной существующий код без изменений
}}
```

В `onChange`:
```typescript
onChange={() => {
  if (!draggingRef.current) return  // игнорировать spurious events при mount
  // ...остальной существующий код без изменений
}}
```

### Правка 2 — синхронизировать `lastFramePos` с `item.position`

Добавь `useEffect` для поддержания `lastFramePos.current` в актуальном состоянии
при изменении позиции элемента извне (например, через moveGroup):

```typescript
useEffect(() => {
  if (!draggingRef.current) {
    lastFramePos.current = item.position
  }
}, [item.position])
```

Этот эффект гарантирует, что даже если spurious onChange каким-то образом пройдёт
(например, `draggingRef.current` не успело сброситься), `lastFramePos.current`
будет указывать на актуальную позицию, а не на позицию момента монтирования компонента.

## Что НЕ надо менять

- Логику `GroupTransformProxy.tsx` — там уже правильно (есть `draggingRef`)
- Логику `onMouseUp` в `SceneElement` — сравнение и откат при реальной коллизии правильные
- Ничего в сторе и других компонентах

## Проверь в браузере (Playwright)

1. Добавить 2 элемента из каталога
2. Выделить оба в LayersPanel (Ctrl+клик), создать группу через ПКМ
3. Кликнуть на заголовок группы → выделиться, должен появиться GroupTransformProxy гизмо
4. Переместить группу гизмо (например, вправо на ~500мм)
5. Кликнуть на отдельный элемент группы в LayersPanel
6. Элемент НЕ должен двигаться — он остаётся на новой позиции ✓
7. Гизмо переключается с группового на индивидуальный ✓
8. Индивидуальный гизмо позволяет дальше перемещать элемент (коллизии работают) ✓
9. Undo возвращает элемент на позицию до перемещения группы ✓

## Тест

3D-компоненты не тестируются в jsdom (нет WebGL). Ручная проверка через Playwright
достаточна. Если захочешь добавить unit-тест — можно покрыть только чистую логику
`clampToRoom`/`totalOverlapVolume`, которая уже покрыта.
```

---

## Сводная таблица задач

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
| TASK-019 | Полировка | Финальная проверка + README | S | ⬜ |
| TASK-009 | Хоткеи | Хоткеи (Ctrl+Z/Y, useKeyboard) | M | ⬜ |
| TASK-015 | Хоткеи | Подключение Undo/Redo к хоткеям | S | ⬜ |
| TASK-020 | Каталог | Перепроектирование каталога: детали шкафа + материалы и цвета | XL | ✅ |
| TASK-021 | Слои | Панель слоёв, мульти-выбор, группировка, перемещение группы в 3D | XL | ✅ |
| TASK-022 | UX | Координаты выбранного элемента на оверлее сцены | S | ✅ |
| TASK-023 | UX | Блокировка элементов и групп (lock layer) | M | ⬜ |
| TASK-024 | Баг | Элемент группы снапится на старую позицию после moveGroup | S | ✅ |

**S** = ~30–60 мин · **M** = ~1–2 ч · **L** = ~2–4 ч · **XL** = ~4–8 ч  
Общая оценка: **~2.5–3 недели** при разработке через Claude Code.
