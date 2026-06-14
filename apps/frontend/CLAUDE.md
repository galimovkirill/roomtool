# Frontend — соглашения и анти-паттерны

Стек: React 19 · TypeScript strict · Vite 6 · Three.js + @react-three/fiber + @react-three/drei · Zustand · Tailwind CSS v4 · shadcn/ui (Base UI) · Sonner · Vitest

Типы и дерево компонентов: [ARCHITECTURE.md](ARCHITECTURE.md)

---

## Ключевые файлы

| Файл | Назначение |
|------|-----------|
| `src/config/scene.ts` | Размеры комнаты и камеры — **менять только здесь** |
| `src/types/index.ts` | CatalogItem, SceneItem, SceneGroup, PropertyDef |
| `src/store/sceneStore.ts` | items, groups, выделение, drag/resize сессии, undo/redo, все мутации |
| `src/store/uiStore.ts` | sceneMode, activeRightPanelTab, showGizmo, showCeilingLight |
| `src/store/defaultScene.ts` | Стартовая сцена (DEFAULT_SCENE_ITEMS / DEFAULT_SCENE_GROUPS) |
| `src/store/persistence.ts` | LocalStorage (key: `roomtool_scene_v1`) |
| `src/catalog/items.ts` | Каталог (~19 деталей, 6 категорий) |
| `src/catalog/materials.ts` | MATERIAL_OPTIONS, MATERIAL_COLORS (материал → цвета) |
| `src/components/scene/SceneCanvas.tsx` | R3F Canvas (3D) + монтирует Scene2DView в 2D |
| `src/components/scene/Scene2DView.tsx` | SVG-план (2D): pan/zoom, сетка, линейки, размерные выноски |
| `src/components/scene/SceneElement.tsx` | Один элемент: mesh/GLTF + drag через useMeshDrag |
| `src/components/scene/TransformProxy.tsx` | Gizmo перемещения (pivot + drag-сессия) |
| `src/components/scene/ResizeHandles.tsx` | 6 ручек по граням для resize одиночного элемента |
| `src/components/scene/useMeshDrag.ts` | Прямой drag по телу элемента (только XZ) |
| `src/components/scene/SceneRibbon.tsx` | Лента над canvas (layout-обёртка) |
| `src/components/scene/ribbon/` | Компоненты ленты: ViewModeToggle, GizmoToggle, AlignmentPopover, ItemActionsGroup, ResetSceneButton |
| `src/components/scene/SceneOverlay.tsx` | W/H/D выделенного; при мультивыборе — bounding box |
| `src/components/scene/ElevationSlider.tsx` | Ползунок высоты (Y); скрыт при showGizmo |
| `src/components/panels/RightPanel.tsx` | Вкладки Каталог/Слои; при editingItemId — PropertiesPanel |
| `src/components/panels/LayersPanel.tsx` | Дерево слоёв, мультивыбор, группы, контекст-меню, visibility |
| `src/components/panels/PropertiesPanel.tsx` | Форма свойств (открывается только явным жестом) |
| `src/components/panels/PropertyField.tsx` | Поле: number / select / material / color |
| `src/components/ui/AppLayout.tsx` | Корневой flex layout + TooltipProvider |
| `src/components/ui/ToolbarToggleButton.tsx` | Toggle-кнопка с тултипом для Ribbon |
| `src/utils/collision.ts` | AABB: clampGroupDelta, clampGroupDeltaAgainstItems, totalOverlapVolume |
| `src/utils/clampToRoom.ts` | Удержание элемента в границах комнаты (чистая функция) |
| `src/utils/groupTransform.ts` | computeGroupCenter, groupDragDelta, pivotPositionOnChange |
| `src/utils/layerTree.ts` | buildLayerTree, getAllItemIdsInGroup, rangeSelection |
| `src/utils/locked.ts` | isItemEffectivelyLocked (прямой флаг + родительские группы) |
| `src/utils/roomCoords.ts` | worldToRoomX/Z — координаты от угла комнаты для UI |
| `src/api/client.ts` | openapi-fetch клиент с типами из types.gen.ts |

---

## Критические инварианты

### 1 unit = 1 мм
`BoxGeometry(900, 2200, 600)` = шкаф 900×2200×600 мм. Без исключений.

### Размеры комнаты — только из конфига
```typescript
import { SCENE_CONFIG } from '@/config/scene'
// SCENE_CONFIG.room.width / .depth / .height
// Никогда не хардкодить числа типа 4000, 3000
```

### Позиция живёт только в сторе
⚠️ Three.js-объекты рендерятся из `item.position` стора и **никогда** не мутируются императивно.
Не добавлять `lastFramePos`, теневые ref-копии позиции и т.п. — это источник регрессии «стор расходится с визуалом» (элемент снапится назад или теряет перемещение).

### Не добавлять второй TransformControls на SceneElement
`TransformProxy` — единственный TransformControls в сцене. Второй на SceneElement сломает drag.

### Координатная система
- Мировые координаты центрированы: комната занимает `[-width/2, width/2]` по X, `[-depth/2, depth/2]` по Z.
- Y-ось вертикальная. Новый элемент: `position = [0, height/2, 0]` (стоит на полу).
- **Пользователю** X/Z показываются от дальнего угла комнаты через `utils/roomCoords.ts` — мировую систему не сдвигаем.

---

## Drag-сессия (перемещение)

Два входа, один и тот же API стора:

1. **Гизмо (`TransformProxy`)** — стрелки TransformControls на невидимом pivot-меше. Показывается при одиночном выделении или при полном совпадении выделения с группой.
2. **Прямой drag (`useMeshDrag`)** — по телу элемента, только если элемент уже выбран в `pointerdown`. Отступает если `dragSession !== null`.

Паттерн:
```
beginDrag(ids) → dragSelectionBy(delta) [каждый кадр, без записи в историю] → endDrag(commit)
```
- `beginDrag` снимает pre-drag снапшот; `dragSelectionBy` применяет дельту относительно стартовых позиций.
- `endDrag(true)` кладёт один undo-шаг; `endDrag(false)` откатывает при нулевом смещении.
- Дельта клампится: `clampGroupDelta` (по стенам) → `clampGroupDeltaAgainstItems` (по другим элементам).

`moveGroup()` — отдельный one-shot примитив (тесты, хоткеи). Для интерактивного drag не использовать.

### Конфликт TransformControls / OrbitControls
```typescript
window.dispatchEvent(new CustomEvent('transform-start'))  // OrbitControls.enabled = false
window.dispatchEvent(new CustomEvent('transform-end'))    // OrbitControls.enabled = true
// SceneControls подписывается на эти события
```

---

## Resize-сессия

```
beginResize() → resizeLive(id, dimensions, position) [каждый кадр, без историю] → endResize(commit)
```
Зеркалит паттерн drag-сессии. `ResizeHandles` монтируется только для одиночного выделения видимого не-GLTF элемента. Проверяет `dragSession !== null` — не запускается поверх drag. При unmount — cleanup откатывает сессию.

---

## Undo/Redo

В `sceneStore` через два стека (`history`, `future`, лимит 50). **Сейчас ни к чему не привязаны** — нет кнопки, нет хоткея. При добавлении использовать `useSceneStore.getState().undo()`.

Что **не** попадает в историю: `selectItem`, `selectItems`, `editItem`, `closeEditing`, `renameGroup`, `toggleGroupCollapse`, `toggleItemVisibility`, `toggleGroupVisibility`, `toggleItemLocked`, `toggleGroupLocked`.

Что **попадает**: все мутации items/groups (add/remove/update/rotate/group/ungroup/moveGroup/removeGroup), `endDrag(true)`, `endResize(true)`, `alignItems`.

---

## Выделение и редактирование

Три независимых поля состояния:
- `selectedItemId` — одиночное выделение (= gizmo)
- `selectedItemIds` — мультивыбор
- `editingItemId` — кто открыт в PropertiesPanel

**PropertiesPanel открывается только явным жестом:**
- Дабл-клик по элементу в 3D → `editItem(id)`
- ПКМ в LayersPanel → «Редактировать» → `editItem(id)`
- Обычный одиночный клик НЕ открывает свойства.

Закрытие: крестик → `closeEditing()` (сбрасывает только `editingItemId`, выделение и gizmo остаются).

`editingItemId` автосбрасывается если редактируемый элемент удалён (`removeItem`/`removeGroup`/`undo`/`redo`) или выделение уходит на другой элемент.

---

## Группы

- `createGroup()` требует ≥ 2 выделенных. Элемент состоит максимум в одной группе.
- Вложенные группы через `SceneGroup.parentGroupId`. Вложенность неограничена.
- `moveGroup()` / `removeGroup()` работают рекурсивно по всему поддереву.
- `ungroupItems()` поднимает прямых участников к родительской группе (или в корень).
- Группа авто-распускается при ≤1 прямом участнике **и** нет дочерних групп.
- **Блокировка:** `isItemEffectivelyLocked(item, groups)` — `true` если `item.locked` OR любая родительская группа `locked`. `SceneElement` получает `locked` пропом от `SceneCanvas`, не подписывается на `groups` сам (иначе лишние re-render).

---

## Коллизии (AABB)

Скользящий клампинг: ось X блокируется только если Y и Z уже перекрываются.
Пары с пред-существующим полным 3D-перекрытием пропускаются (anti-lockout для конструктивных примыканий).

⚠️ **Известные ограничения (MVP):**
- Поворот не учитывается в AABB. Повёрнутый на 90° корпус 900×600 проверяется как 900×600.
- Скрытые элементы (`hidden: true`) всё равно участвуют в коллизии.

Не удалять `hasGroupCollision` и `totalOverlapVolume` из `collision.ts` — используются в тестах.

---

## Режим 2D

В 2D `SceneCanvas` (R3F Canvas) не монтируется — рендерится `Scene2DView` (чистый SVG без Three.js).
Нет OrbitControls, нет TransformControls, нет R3F. Pan + zoom через нативные DOM-события.

---

## shadcn/ui — важные особенности

**Не создавать собственные реализации** для компонентов, которые shadcn покрывает.
Кастомный код — только для отсутствующего (цветовая палитра `type === 'color'`, Html-поповер над 3D через drei).
Добавить новый компонент: `npx shadcn@latest add <name>` → файл в `src/components/ui/`.

**ToggleGroup (Base UI):** value всегда массив `string[]`, нет `type="single"`.
Single-select: `value={[active]} onValueChange={vals => vals.length > 0 && set(vals[0])}`.

**Tooltip + Toggle:** нельзя `TooltipTrigger asChild` напрямую на `Toggle.Root` — Tooltip перезаписывает `data-state` кнопки своим (`"closed"`/`"open"`), и стили `aria-pressed:` ломаются.
Правильно: обернуть `Toggle.Root` в `<span tabIndex={-1}>` и делать `asChild` на span.

**TooltipProvider:** один на всё приложение, уже в `AppLayout.tsx`.

**ContextMenu.Item:** использует `onClick` (не `onSelect`).

**Стилизация Base UI:** `aria-pressed:` (не `data-[state=on]`), `data-[highlighted]`, `data-[disabled]`, `data-[side=...]`.

---

## Тесты

Юнит-тесты (Vitest + @testing-library/react). Файлы рядом с источником: `*.test.ts(x)`.

**R3F-компоненты не тестируются** — Three.js не работает в jsdom. Чистую логику выносить в `utils/` и покрывать там (паттерн: `clampToRoom` вынесен из `SceneElement`).

**Тест инициализации стора из localStorage** (`sceneStore.persistence-init.test.ts`) — отдельный файл с `vi.mock('./persistence')`. `loadScene()` вызывается на уровне модуля при первом импорте, поэтому нужны `vi.resetModules()` + динамический `import('./sceneStore')` внутри теста.

**Мокирование shadcn Select:** `vi.mock('@/components/ui/select', ...)` — заменяет на нативный `<select>` для работы `getByRole('combobox')` и `fireEvent.change`.

**Покрытие:** пороги в `vite.config.ts → test.coverage.thresholds`. Снижать нельзя.

---

## Персистентность

LocalStorage key: `roomtool_scene_v1`. Не сохраняется: undo-история, выделение, uiStore.
`loadScene()` вызывается один раз на уровне модуля — не в хуке, не в компоненте.

⚠️ `clearScene()` вызывать **снаружи** `set()`, не внутри updater — side effect в updater нарушает idempotency.

`resetScene()` пишет в историю (undo работает), очищает localStorage, сбрасывает `dragSession`/`resizeSession`.

---

## Каталог деталей

6 категорий, ~19 деталей. Добавлять в `src/catalog/items.ts`.
Материалы и цвета — в `src/catalog/materials.ts` (`MATERIAL_OPTIONS`, `MATERIAL_COLORS`).

При смене материала цвет сбрасывается на первый цвет нового материала (`PropertiesPanel.handleChange`).
GLTF-элементы (`render: { type: 'gltf'; src }`) — GLB в `public/models/`. PropertiesPanel показывает ползунок **Размер (%)** вместо W/H/D.

---

## Уведомления

```typescript
import { toast } from 'sonner'
toast.warning('...')  // <Toaster /> подключён в main.tsx
```

---

## Playwright

Скриншоты — **только в `tmp/`** (в `.gitignore`):
```typescript
browser_take_screenshot({ filename: 'tmp/check.png' })
```
