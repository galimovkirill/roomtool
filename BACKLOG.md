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
| TASK-016 | Свойства | PropertiesPanel + PropertyField | M | ⬜ |
| TASK-017 | Коллизии | AABB-проверка + откат + уведомление | L | ⬜ |
| TASK-018 | 2D-режим | Ортографическая камера + размеры | L | ⬜ |
| TASK-019 | Полировка | Финальная проверка + README | S | ⬜ |
| TASK-009 | Хоткеи | Хоткеи (Ctrl+Z/Y, useKeyboard) | M | ⬜ |
| TASK-015 | Хоткеи | Подключение Undo/Redo к хоткеям | S | ⬜ |

**S** = ~30–60 мин · **M** = ~1–2 ч · **L** = ~2–4 ч  
Общая оценка: **~2–2.5 недели** при разработке через Claude Code.
