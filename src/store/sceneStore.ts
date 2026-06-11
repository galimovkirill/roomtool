import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import type { CatalogItem, SceneGroup, SceneItem } from '@/types'
import { MATERIAL_COLORS, MATERIAL_OPTIONS, type MaterialType } from '@/catalog/materials'
import { DEFAULT_SCENE_GROUPS, DEFAULT_SCENE_ITEMS } from './defaultScene'

type ItemPatch = Partial<Pick<SceneItem, 'position' | 'rotationY' | 'dimensions' | 'properties'>>

export type AlignmentType =
  | 'left'
  | 'right'
  | 'centerX'
  | 'top'
  | 'bottom'
  | 'centerY'
  | 'front'
  | 'back'
  | 'centerZ'

type Vec3 = [number, number, number]

type HistorySnapshot = { items: SceneItem[]; groups: SceneGroup[] }

// Transient state of an in-progress gizmo drag. Excluded from history:
// the whole gesture commits as a single history entry on endDrag(true).
// `snapshot` is the full pre-drag state (for undo + rollback on collision);
// `base` holds the start position of each dragged item so live deltas are
// always applied relative to where the drag began, never accumulated.
type DragSession = { snapshot: HistorySnapshot; base: Record<string, Vec3> }

interface SceneState {
  items: SceneItem[]
  groups: SceneGroup[]
  selectedItemId: string | null
  selectedItemIds: string[]
  editingItemId: string | null
  groupCounter: number
  history: HistorySnapshot[]
  future: HistorySnapshot[]
  dragSession: DragSession | null
  addItem: (catalogItem: CatalogItem) => void
  removeItem: (id: string) => void
  updateItem: (id: string, patch: ItemPatch) => void
  selectItem: (id: string | null) => void
  selectItems: (ids: string[]) => void
  toggleItemSelection: (id: string, addToSelection: boolean) => void
  editItem: (id: string) => void
  closeEditing: () => void
  rotateItem: (id: string, direction: 'left' | 'right') => void
  createGroup: () => void
  ungroupItems: (groupId: string) => void
  moveGroup: (groupId: string, delta: [number, number, number]) => void
  beginDrag: (ids: string[]) => void
  dragSelectionBy: (delta: [number, number, number]) => void
  endDrag: (commit: boolean) => void
  removeGroup: (groupId: string) => void
  renameGroup: (groupId: string, name: string) => void
  toggleGroupCollapse: (groupId: string) => void
  alignItems: (alignment: AlignmentType) => void
  undo: () => void
  redo: () => void
}

function pushHistory(state: Pick<SceneState, 'items' | 'groups' | 'history' | 'future'>): {
  history: HistorySnapshot[]
  future: HistorySnapshot[]
} {
  const snapshot: HistorySnapshot = {
    items: [...state.items],
    groups: state.groups.map((g) => ({ ...g, itemIds: [...g.itemIds] })),
  }
  const history = [...state.history, snapshot]
  if (history.length > 50) history.shift()
  return { history, future: [] }
}

export const useSceneStore = create<SceneState>((set, get) => ({
  items: DEFAULT_SCENE_ITEMS,
  groups: DEFAULT_SCENE_GROUPS,
  selectedItemId: null,
  selectedItemIds: [],
  editingItemId: null,
  groupCounter: 0,
  history: [],
  future: [],
  dragSession: null,

  addItem(catalogItem) {
    set((state) => {
      const { width, height, depth } = catalogItem.defaultDimensions
      const properties: Record<string, number | string> = {}
      for (const def of catalogItem.properties) {
        if (def.type === 'number') {
          properties[def.key] = def.default ?? def.min ?? 0
        } else if (def.type === 'material') {
          properties[def.key] = def.options?.[0]?.value ?? MATERIAL_OPTIONS[0]
        } else if (def.type === 'color') {
          const materialKey = def.dependsOnMaterial ?? 'material'
          const mat = (properties[materialKey] as string) || MATERIAL_OPTIONS[0]
          properties[def.key] = MATERIAL_COLORS[mat as MaterialType]?.[0]?.value ?? '#F5F5F0'
        } else {
          properties[def.key] = def.default ?? def.options?.[0]?.value ?? ''
        }
      }
      const newItem: SceneItem = {
        id: uuid(),
        catalogId: catalogItem.id,
        name: catalogItem.name,
        position: [0, height / 2, 0],
        rotationY: 0,
        dimensions: { width, height, depth },
        properties,
        groupId: null,
      }
      return {
        ...pushHistory(state),
        items: [...state.items, newItem],
      }
    })
  },

  removeItem(id) {
    set((state) => {
      const item = state.items.find((i) => i.id === id)
      let groups = state.groups

      if (item?.groupId) {
        const groupId = item.groupId
        const group = groups.find((g) => g.id === groupId)
        if (group) {
          const remaining = group.itemIds.filter((iid) => iid !== id)
          if (remaining.length <= 1) {
            // ungroup: clear groupId on surviving member, remove group
            groups = groups.filter((g) => g.id !== groupId)
            const survivors = new Set(remaining)
            return {
              ...pushHistory(state),
              items: state.items
                .filter((i) => i.id !== id)
                .map((i) => (survivors.has(i.id) ? { ...i, groupId: null } : i)),
              groups,
              selectedItemId: state.selectedItemId === id ? null : state.selectedItemId,
              selectedItemIds: state.selectedItemIds.filter((sid) => sid !== id),
              editingItemId: state.editingItemId === id ? null : state.editingItemId,
            }
          } else {
            groups = groups.map((g) => (g.id === groupId ? { ...g, itemIds: remaining } : g))
          }
        }
      }

      return {
        ...pushHistory(state),
        items: state.items.filter((i) => i.id !== id),
        groups,
        selectedItemId: state.selectedItemId === id ? null : state.selectedItemId,
        selectedItemIds: state.selectedItemIds.filter((sid) => sid !== id),
        editingItemId: state.editingItemId === id ? null : state.editingItemId,
      }
    })
  },

  updateItem(id, patch) {
    set((state) => ({
      ...pushHistory(state),
      items: state.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }))
  },

  selectItem(id) {
    // Plain selection never opens PropertiesPanel; if it's open for another item,
    // moving the selection away dismisses it so panel and gizmo stay in sync.
    set((state) => ({
      selectedItemId: id,
      selectedItemIds: id ? [id] : [],
      editingItemId: state.editingItemId === id ? state.editingItemId : null,
    }))
  },

  selectItems(ids) {
    // Only updates multi-selection — does NOT open PropertiesPanel, and closes
    // it if it was open (multi-selection has no single subject to edit).
    set({
      selectedItemIds: ids,
      selectedItemId: null,
      editingItemId: null,
    })
  },

  toggleItemSelection(id, addToSelection) {
    const { selectedItemIds } = get()
    let next: string[]
    if (addToSelection) {
      next = selectedItemIds.includes(id)
        ? selectedItemIds.filter((sid) => sid !== id)
        : [...selectedItemIds, id]
    } else {
      next = [id]
    }
    // Only updates multi-selection — does NOT open PropertiesPanel.
    set({
      selectedItemIds: next,
      selectedItemId: null,
      editingItemId: null,
    })
  },

  editItem(id) {
    // Opens PropertiesPanel for a single item. Selecting it too keeps the gizmo
    // and highlight in sync. Triggered only by an explicit gesture (scene
    // double-click or Layers context-menu) — never by plain selection.
    set({
      editingItemId: id,
      selectedItemId: id,
      selectedItemIds: [id],
    })
  },

  closeEditing() {
    set({ editingItemId: null })
  },

  rotateItem(id, direction) {
    set((state) => ({
      ...pushHistory(state),
      items: state.items.map((item) =>
        item.id === id
          ? {
              ...item,
              rotationY: item.rotationY + (direction === 'right' ? Math.PI / 2 : -Math.PI / 2),
            }
          : item
      ),
    }))
  },

  createGroup() {
    set((state) => {
      if (state.selectedItemIds.length < 2) return {}
      const newCounter = state.groupCounter + 1
      const group: SceneGroup = {
        id: uuid(),
        name: `Группа ${newCounter}`,
        itemIds: [...state.selectedItemIds],
        collapsed: false,
      }
      const selectedSet = new Set(state.selectedItemIds)

      // Remove selected items from their existing groups; auto-ungroup if ≤ 1 member remains
      const soloMembers = new Set<string>()
      const updatedGroups = state.groups
        .map((g) => ({ ...g, itemIds: g.itemIds.filter((id) => !selectedSet.has(id)) }))
        .filter((g) => {
          if (g.itemIds.length === 0) return false
          if (g.itemIds.length === 1) {
            soloMembers.add(g.itemIds[0])
            return false
          }
          return true
        })

      return {
        ...pushHistory(state),
        groups: [...updatedGroups, group],
        groupCounter: newCounter,
        items: state.items.map((item) => {
          if (selectedSet.has(item.id)) return { ...item, groupId: group.id }
          if (soloMembers.has(item.id)) return { ...item, groupId: null }
          return item
        }),
        selectedItemIds: [],
        selectedItemId: null,
      }
    })
  },

  ungroupItems(groupId) {
    set((state) => ({
      ...pushHistory(state),
      groups: state.groups.filter((g) => g.id !== groupId),
      items: state.items.map((item) =>
        item.groupId === groupId ? { ...item, groupId: null } : item
      ),
    }))
  },

  moveGroup(groupId, delta) {
    set((state) => {
      const group = state.groups.find((g) => g.id === groupId)
      if (!group) return state
      const memberSet = new Set(group.itemIds)
      return {
        ...pushHistory(state),
        items: state.items.map((item) => {
          if (!memberSet.has(item.id) || item.groupId !== groupId) return item
          return {
            ...item,
            position: [
              item.position[0] + delta[0],
              Math.max(item.dimensions.height / 2, item.position[1] + delta[1]),
              item.position[2] + delta[2],
            ] as [number, number, number],
          }
        }),
      }
    })
  },

  // ── Interactive drag (gizmo) ──────────────────────────────────────────────
  // Single source of truth: positions live only in the store. The gizmo reports
  // a delta which is written here; elements re-render from the store. There is no
  // separate "visual" position to drift out of sync, and no per-frame history.

  beginDrag(ids) {
    set((state) => {
      const idSet = new Set(ids)
      const base: Record<string, Vec3> = {}
      for (const item of state.items) {
        if (idSet.has(item.id)) base[item.id] = [...item.position] as Vec3
      }
      return {
        dragSession: {
          snapshot: {
            items: [...state.items],
            groups: state.groups.map((g) => ({ ...g, itemIds: [...g.itemIds] })),
          },
          base,
        },
      }
    })
  },

  dragSelectionBy(delta) {
    const { dragSession } = get()
    if (!dragSession) return
    const { base } = dragSession
    set((state) => ({
      items: state.items.map((item) => {
        const start = base[item.id]
        if (!start) return item
        return {
          ...item,
          position: [start[0] + delta[0], start[1] + delta[1], start[2] + delta[2]] as Vec3,
        }
      }),
    }))
  },

  endDrag(commit) {
    const { dragSession, history } = get()
    if (!dragSession) return
    if (commit) {
      // Whole gesture becomes one undo step: push the pre-drag snapshot.
      const nextHistory = [...history, dragSession.snapshot]
      if (nextHistory.length > 50) nextHistory.shift()
      set({ history: nextHistory, future: [], dragSession: null })
    } else {
      // Rollback (collision / no-op): restore the pre-drag state untouched.
      set({
        items: dragSession.snapshot.items,
        groups: dragSession.snapshot.groups,
        dragSession: null,
      })
    }
  },

  removeGroup(groupId) {
    set((state) => {
      const removedIds = new Set(
        state.items.filter((item) => item.groupId === groupId).map((item) => item.id)
      )
      return {
        ...pushHistory(state),
        items: state.items.filter((item) => item.groupId !== groupId),
        groups: state.groups.filter((g) => g.id !== groupId),
        selectedItemId: null,
        selectedItemIds: [],
        editingItemId:
          state.editingItemId && removedIds.has(state.editingItemId) ? null : state.editingItemId,
      }
    })
  },

  renameGroup(groupId, name) {
    set((state) => ({
      groups: state.groups.map((g) => (g.id === groupId ? { ...g, name } : g)),
    }))
  },

  toggleGroupCollapse(groupId) {
    set((state) => ({
      groups: state.groups.map((g) => (g.id === groupId ? { ...g, collapsed: !g.collapsed } : g)),
    }))
  },

  alignItems(alignment) {
    set((state) => {
      const selected = state.selectedItemIds.flatMap((id) => {
        const item = state.items.find((i) => i.id === id)
        return item ? [item] : []
      })
      if (selected.length < 2) return {}
      if (state.dragSession) return {}

      let target = 0
      switch (alignment) {
        case 'left':
          target = Math.min(...selected.map((i) => i.position[0] - i.dimensions.width / 2))
          break
        case 'right':
          target = Math.max(...selected.map((i) => i.position[0] + i.dimensions.width / 2))
          break
        case 'centerX':
          target = selected.reduce((sum, i) => sum + i.position[0], 0) / selected.length
          break
        case 'top':
          target = Math.max(...selected.map((i) => i.position[1] + i.dimensions.height / 2))
          break
        case 'bottom':
          target = Math.min(...selected.map((i) => i.position[1] - i.dimensions.height / 2))
          break
        case 'centerY':
          target = selected.reduce((sum, i) => sum + i.position[1], 0) / selected.length
          break
        case 'front':
          target = Math.min(...selected.map((i) => i.position[2] - i.dimensions.depth / 2))
          break
        case 'back':
          target = Math.max(...selected.map((i) => i.position[2] + i.dimensions.depth / 2))
          break
        case 'centerZ':
          target = selected.reduce((sum, i) => sum + i.position[2], 0) / selected.length
          break
      }

      const selectedSet = new Set(state.selectedItemIds)
      const items = state.items.map((item) => {
        if (!selectedSet.has(item.id)) return item
        let pos: Vec3
        switch (alignment) {
          case 'left':
            pos = [target + item.dimensions.width / 2, item.position[1], item.position[2]]
            break
          case 'right':
            pos = [target - item.dimensions.width / 2, item.position[1], item.position[2]]
            break
          case 'centerX':
            pos = [target, item.position[1], item.position[2]]
            break
          case 'top':
            pos = [item.position[0], target - item.dimensions.height / 2, item.position[2]]
            break
          case 'bottom':
            pos = [item.position[0], target + item.dimensions.height / 2, item.position[2]]
            break
          case 'centerY':
            pos = [item.position[0], target, item.position[2]]
            break
          case 'front':
            pos = [item.position[0], item.position[1], target + item.dimensions.depth / 2]
            break
          case 'back':
            pos = [item.position[0], item.position[1], target - item.dimensions.depth / 2]
            break
          case 'centerZ':
            pos = [item.position[0], item.position[1], target]
            break
        }
        return { ...item, position: pos }
      })

      return { ...pushHistory(state), items }
    })
  },

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
      editingItemId: null,
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
      editingItemId: null,
    })
  },
}))
