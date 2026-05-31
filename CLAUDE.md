# RoomTool — Project Guide for Claude Code

Frontend-only 3D-редактор для проектирования шкафов. Пользователь добавляет мебельные элементы на сцену, перемещает, поворачивает и настраивает их размеры. Бэкенд, авторизация и сохранение сцены — вне скоупа.

---

## Команды

```bash
pnpm dev          # запуск dev-сервера
pnpm build        # production сборка
pnpm test         # запуск тестов (Vitest)
pnpm lint         # ESLint проверка
pnpm lint:fix     # ESLint автоисправление
pnpm format       # Prettier форматирование
```

---

## Стек

| Слой | Инструмент |
|------|-----------|
| Фреймворк | React 18 + TypeScript (strict) |
| Сборка | Vite 6 |
| 3D | Three.js + @react-three/fiber + @react-three/drei |
| Стейт | Zustand |
| Стили | Tailwind CSS v4 |
| UI-примитивы | Radix UI |
| Уведомления | Sonner (`toast()`) |
| Тесты | Vitest + @testing-library/react |
| Пакеты | pnpm |

---

## Структура проекта

```
src/
├── config/
│   └── scene.ts          # Размеры комнаты и камеры — менять только здесь
├── types/
│   └── index.ts          # CatalogItem, SceneItem, PropertyDef
├── catalog/
│   └── items.ts          # Хардкод каталога (8 элементов, 4 категории)
├── store/
│   ├── sceneStore.ts     # items, selectedItemId, history/future, все мутации
│   ├── uiStore.ts        # sceneMode: '2d' | '3d'
│   └── index.ts          # реэкспорт
├── components/
│   ├── scene/
│   │   ├── SceneCanvas.tsx       # R3F Canvas, переключение камер
│   │   ├── Room.tsx              # Пол + стены (размеры из config)
│   │   ├── SceneElement.tsx      # Один элемент: mesh/GLTF + TransformControls + Popover
│   │   ├── SceneControls.tsx     # OrbitControls (forwardRef)
│   │   └── SceneOverlay.tsx      # Кнопки 2D/3D поверх canvas
│   ├── panels/
│   │   ├── RightPanel.tsx        # Переключает между CatalogPanel и PropertiesPanel
│   │   ├── CatalogPanel.tsx      # Каталог с поиском и аккордеоном
│   │   ├── PropertiesPanel.tsx   # Форма свойств выбранного элемента
│   │   └── PropertyField.tsx     # Поле (number input или select)
│   └── ui/
│       ├── AppLayout.tsx         # Корневой flex layout (сцена + панель)
│       ├── ElementPopover.tsx    # Popover над элементом (поворот, удаление)
│       └── ScreenGuard.tsx       # Заглушка для экранов < 1024px
├── hooks/
│   └── useKeyboard.ts    # Подписка на keydown, ключи формата 'ctrl+z'
├── utils/
│   └── collision.ts      # hasCollision() — AABB-проверка пересечений
└── main.tsx              # Рендер: ScreenGuard > AppLayout + Toaster + KeyboardShortcuts
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

### Конфликт TransformControls и OrbitControls
Решается через `window.dispatchEvent`:
```typescript
// В SceneElement при начале drag:
window.dispatchEvent(new CustomEvent('transform-start'))
// В SceneElement при отпускании:
window.dispatchEvent(new CustomEvent('transform-end'))
// В SceneControls — подписка на эти события для enable/disable OrbitControls
```

### Горячие клавиши
Все хоткеи подключаются через `useKeyboard` в компоненте `KeyboardShortcuts` внутри `main.tsx`.
Формат ключей: `'ctrl+z'`, `'ctrl+y'`, `'arrowleft'` (lowercase).

### Undo/Redo
Реализован в `sceneStore` через два стека (`history`, `future`, лимит 50).
Каждая мутирующая операция (add/remove/update/rotate) вызывает `pushHistory` перед изменением.
`selectItem` — **не** попадает в историю.

### Проверка коллизий
Вызывается **только при отпускании** TransformControls (`onMouseUp`).
При коллизии: откат на `lastValidPosition` + `toast.warning(...)`.

⚠️ **Известное ограничение:** AABB-проверка не учитывает поворот элементов.
Повёрнутый на 90° корпус 900×600 мм будет проверяться как 900×600, а не 600×900.
Это допустимо для MVP, усложнять не нужно.

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

| | 3D | 2D |
|--|----|----|
| Камера | PerspectiveCamera | OrthographicCamera (вид сверху) |
| OrbitControls | rotate + pan + zoom | только pan + zoom |
| Стены | видимы | скрыты |
| Grid | скрыт | показан |
| Размеры на элементах | нет | есть (`Html` из drei) |

---

## Каталог элементов

Четыре категории, 8 элементов. Добавлять новые — в `src/catalog/items.ts`.

| Категория | id | Размеры (мм) |
|-----------|-----|-------------|
| Корпуса | `wardrobe-body` | 900 × 2200 × 600 |
| Корпуса | `wardrobe-narrow` | 450 × 2200 × 600 |
| Наполнение | `shelf` | 878 × 25 × 560 |
| Наполнение | `drawer` | 878 × 150 × 500 |
| Наполнение | `rod` | 878 × 30 × 30 |
| Двери | `door-swing` | 450 × 2200 × 22 |
| Двери | `door-slide` | 900 × 2200 × 60 |
| Декорации | `house-plant-1` | 600 × 1200 × 600 (bounding box по умолчанию, 100%) |

### GLTF-элементы (категория «Декорации»)

Элементы с `render: { type: 'gltf'; src: string }` рендерятся через `useGLTF` + `<primitive>` вместо `BoxGeometry`.
GLB-файлы хранятся в `public/models/`.

Масштабирование: модель равномерно масштабируется, чтобы вписаться в `defaultDimensions * (scale/100)`.
В PropertiesPanel такие элементы показывают ползунок **Размер (%)** вместо отдельных W/H/D полей.
При изменении scale пересчитываются `dimensions` в SceneItem — AABB-коллизия работает корректно.

⚠️ Масштабирование равномерное (`Math.min` по трём осям) — модель сохраняет пропорции, но может не заполнять весь bounding box.

---

## Тесты

Тестируется юнит-тестами: `sceneStore` (undo/redo, add/remove), `catalog/items`, `collision`, `useKeyboard`, `ScreenGuard`.
Компоненты 3D-сцены (R3F) **не тестируются** — Three.js не работает в jsdom.
Запуск: `pnpm test`. Файлы тестов рядом с источником: `*.test.ts`.

## Playwright / браузерная проверка

Скриншоты Playwright сохранять **только в `/tmp/`** — никогда в корень проекта и не в `src/`.
Пример: `browser_take_screenshot({ filename: '/tmp/task010-check.png' })`.

---

## Что не делаем (скоуп MVP)

- Бэкенд, API, авторизация
- Сохранение сцены (перезагрузка = сброс)
- Смена текстур и материалов
- Скрытие элементов (только удаление)
- Множественный выбор
- Импорт/экспорт 3D-моделей
- Мобильные устройства (< 1024px → заглушка)

---

## Навигация по документации

| Документ | Назначение |
|----------|-----------|
| `docs/mvp.md` | Требования, must/nice/не делать |
| `docs/user-flows.md` | Пользовательские сценарии |
| `docs/roadmap.md` | Этапы реализации |
| `docs/TODO.md` | Отложенные решения (вернуться позже) |
| `ARCHITECTURE.md` | Детальная архитектура, типы, алгоритмы |
| `BACKLOG.md` | 19 задач с промптами для последовательной разработки |
