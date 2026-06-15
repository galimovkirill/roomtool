# Frontend — соглашения и анти-паттерны

Стек: React 19 · TypeScript strict · Vite 6 · Three.js + @react-three/fiber + @react-three/drei · Zustand · Tailwind CSS v4 · shadcn/ui (Base UI) · Sonner · Vitest

Типы и дерево компонентов: [ARCHITECTURE.md](ARCHITECTURE.md)

---

## Ключевые файлы

| Файл | Назначение |
|------|-----------|
| `src/config/scene.ts` | Размеры комнаты и камеры — **менять только здесь** |
| `src/types/index.ts` | CatalogItem, SceneItem, SceneGroup, PropertyDef |
| `src/store/sceneStore.ts` | items, groups, drag/resize сессии, undo/redo, все мутации сцены |
| `src/store/editorStore.ts` | selectedItemId, selectedItemIds, editingItemId, selectItem/selectItems/editItem/closeEditing |
| `src/store/uiStore.ts` | sceneMode, activeRightPanelTab, showGizmo, showCeilingLight |
| `src/store/defaultScene.ts` | Стартовая сцена (DEFAULT_SCENE_ITEMS / DEFAULT_SCENE_GROUPS) |
| `src/store/syncStore.ts` | SyncStatus ('idle'/'syncing'/'error'), sceneId, sceneName |
| `src/api/syncService.ts` | initScene(sceneId) → 'ok'/'not_found', scheduleSync (debounce 1500ms), syncNow (немедленно); подписывается на sceneStore |
| `src/catalog/items.ts` | Каталог (~19 деталей, 6 категорий) |
| `src/catalog/materials.ts` | MATERIAL_OPTIONS, MATERIAL_COLORS (материал → цвета), MATERIAL_PBR (roughness/metalness per type) |
| `src/components/scene/SceneCanvas.tsx` | R3F Canvas (3D) + монтирует Scene2DView в 2D |
| `src/components/scene/Scene2DView.tsx` | SVG-план (2D): pan/zoom, сетка, линейки, размерные выноски |
| `src/components/scene/SceneElement.tsx` | Один элемент: mesh/GLTF + drag через useMeshDrag |
| `src/components/scene/TransformProxy.tsx` | Gizmo перемещения (pivot + drag-сессия) |
| `src/components/scene/ResizeHandles.tsx` | 6 ручек по граням для resize одиночного элемента |
| `src/components/scene/useMeshDrag.ts` | Прямой drag по телу элемента (только XZ) |
| `src/components/scene/SceneRibbon.tsx` | Лента над canvas: кнопки режимов + абсолютно-центрированное имя сцены из syncStore |
| `src/components/scene/ribbon/` | Компоненты ленты: ViewModeToggle, GizmoToggle, AlignmentPopover, ItemActionsGroup, ResetSceneButton, SaveStatusIndicator |
| `src/components/scene/SceneOverlay.tsx` | W/H/D выделенного; при мультивыборе — bounding box |
| `src/components/scene/ElevationSlider.tsx` | Ползунок высоты (Y); скрыт при showGizmo |
| `src/components/panels/RightPanel.tsx` | Вкладки Каталог/Слои; при editingItemId — PropertiesPanel |
| `src/components/panels/LayersPanel.tsx` | Дерево слоёв, мультивыбор, группы, контекст-меню, visibility |
| `src/components/panels/PropertiesPanel.tsx` | Форма свойств (открывается только явным жестом) |
| `src/components/panels/PropertyField.tsx` | Поле: number / select / material / color |
| `src/components/ui/AppLayout.tsx` | Корневой `flex-col` layout + TooltipProvider; принимает любой `ReactNode` |
| `src/components/ui/AppHeader.tsx` | Шапка с логотипом и дропдауном пользователя (email + Выйти) |
| `src/components/ui/dropdown-menu.tsx` | DropdownMenu на @base-ui/react/menu (аналог context-menu.tsx) |
| `src/components/ui/skeleton.tsx` | Skeleton — `animate-pulse bg-muted` div-заглушка |
| `src/components/ui/ToolbarToggleButton.tsx` | Toggle-кнопка с тултипом для Ribbon |
| `src/components/files/SceneCard.tsx` | Карточка сцены: thumbnail, имя, дата; двойной клик — переименование; DropdownMenu |
| `src/pages/FilesPage.tsx` | Хаб `/files`: список сцен, создание, сортировка, состояния загрузки/ошибки/пусто |
| `src/pages/EditorPage.tsx` | Страница `/editor/:id`: initScene → resetScene при уходе; редирект на `/files` если not_found |
| `src/utils/formatDate.ts` | `formatRelativeDate(dateStr)` — относительные даты на русском (сегодня/вчера/дата) |
| `src/utils/bounds.ts` | `computeItemsBounds(items)` → `{ min: Vec3; max: Vec3 }` — AABB по списку элементов |
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

Что **не** попадает в историю: все методы `editorStore` (`selectItem`, `selectItems`, `editItem`, `closeEditing`), а также `renameGroup`, `toggleGroupCollapse`, `toggleItemVisibility`, `toggleGroupVisibility`, `toggleItemLocked`, `toggleGroupLocked`.

Что **попадает**: все мутации items/groups (add/remove/update/rotate/group/ungroup/moveGroup/removeGroup), `endDrag(true)`, `endResize(true)`, `alignItems`.

---

## Выделение и редактирование

Три независимых поля состояния — живут в **`editorStore`** (не в `sceneStore`):
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

**Мокирование shadcn Select:** `vi.mock('@/components/ui/select', ...)` — заменяет на нативный `<select>` для работы `getByRole('combobox')` и `fireEvent.change`.

**Покрытие:** пороги в `vite.config.ts → test.coverage.thresholds`. Снижать нельзя.

---

## Роутинг

```
/           → redirect /files
/files      → FilesPage (ProtectedRoute)
/editor/:id → EditorPage (ProtectedRoute + ScreenGuard)
*           → redirect /files
```

`ProtectedRoute` — обёртка (children), не Outlet. Проверяет `authStore.status`, редиректит на `/login` если не аутентифицирован.

`EditorPage` вызывает `initScene(id)` при монтировании и `resetScene()` + `setSceneId(null)` при размонтировании (cleanup в useEffect). Используй cancellation флаг (как в FilesPage), чтобы избежать race condition при быстрой навигации.

---

## Персистентность

`resetScene()` **не** пишет в историю — очищает `history` и `future`, сбрасывает `dragSession`/`resizeSession`. После reset undo недоступен.

`loadScene(items, groups)` — загружает данные с сервера без записи в undo-историю. Используется только syncService.

### Backend sync (syncService.ts)

`initScene(sceneId: string)` → `'ok' | 'not_found'`. Вызывается в EditorPage при каждом открытии сцены. Загружает данные с сервера (debounce 1500ms), устанавливает `sceneId` и `sceneName` в syncStore.

`syncStore.sceneName` — читается в `putScene` при каждом PUT, чтобы сохранять актуальное имя сцены.

Подписка в syncService.ts (не в sceneStore.ts) — избегает циркулярной зависимости. Мокируй `@/store/sceneStore` с `subscribe: vi.fn()` в тестах файлов, импортирующих syncService.

---

## Каталог деталей

6 категорий, ~19 деталей. Добавлять в `src/catalog/items.ts`.
Материалы и цвета — в `src/catalog/materials.ts` (`MATERIAL_OPTIONS`, `MATERIAL_COLORS`).

При смене материала цвет сбрасывается на первый цвет нового материала (`PropertiesPanel.handleChange`).
GLTF-элементы (`render: { type: 'gltf'; src }`) — GLB в `public/models/`. PropertiesPanel показывает ползунок **Размер (%)** вместо W/H/D.

---

## Язык интерфейса

**Все тексты, видимые пользователю, должны быть на русском языке** — лейблы, плейсхолдеры, сообщения об ошибках, кнопки, тултипы, уведомления.

Ошибки от backend API приходят на английском — **обязательно переводить** через `translateApiError` в `src/store/authStore.ts` или аналогичный маппинг, не отображать raw API message напрямую.

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
