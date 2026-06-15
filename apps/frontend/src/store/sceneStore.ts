import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import type { CatalogItem, SceneGroup, SceneItem, Vec3 } from '@/types'
import { getDefaultColorForMaterial, MATERIAL_OPTIONS } from '@/catalog/materials'
import { DEFAULT_SCENE_GROUPS, DEFAULT_SCENE_ITEMS } from './defaultScene'
import { useEditorStore } from './editorStore'

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

type HistorySnapshot = { items: SceneItem[]; groups: SceneGroup[] }

function collectDescendantGroupIds(rootId: string, groups: SceneGroup[]): Set<string> {
  const ids = new Set<string>([rootId])
  let changed = true
  while (changed) {
    changed = false
    for (const g of groups) {
      if (g.parentGroupId && ids.has(g.parentGroupId) && !ids.has(g.id)) {
        ids.add(g.id)
        changed = true
      }
    }
  }
  return ids
}

// Transient state of an in-progress gizmo drag. Excluded from history:
// the whole gesture commits as a single history entry on endDrag(true).
// `snapshot` is the full pre-drag state (for undo + rollback on collision);
// `base` holds the start position of each dragged item so live deltas are
// always applied relative to where the drag began, never accumulated.
type DragSession = { snapshot: HistorySnapshot; base: Record<string, Vec3> }
type ResizeSession = { snapshot: HistorySnapshot }

interface SceneState {
  items: SceneItem[]
  groups: SceneGroup[]
  groupCounter: number
  history: HistorySnapshot[]
  future: HistorySnapshot[]
  dragSession: DragSession | null
  resizeSession: ResizeSession | null
  addItem: (catalogItem: CatalogItem) => void
  removeItem: (id: string) => void
  removeItems: (ids: string[]) => void
  updateItem: (id: string, patch: ItemPatch) => void
  rotateItem: (id: string, direction: 'left' | 'right') => void
  createGroup: () => void
  ungroupItems: (groupId: string) => void
  moveGroup: (groupId: string, delta: [number, number, number]) => void
  beginDrag: (ids: string[]) => void
  dragSelectionBy: (delta: [number, number, number]) => void
  endDrag: (commit: boolean) => void
  beginResize: () => void
  resizeLive: (id: string, dimensions: SceneItem['dimensions'], position: Vec3) => void
  endResize: (commit: boolean) => void
  removeGroup: (groupId: string) => void
  renameGroup: (groupId: string, name: string) => void
  toggleGroupCollapse: (groupId: string) => void
  toggleItemVisibility: (id: string) => void
  toggleGroupVisibility: (id: string) => void
  toggleItemLocked: (id: string) => void
  toggleGroupLocked: (id: string) => void
  alignItems: (alignment: AlignmentType) => void
  loadScene: (items: SceneItem[], groups: SceneGroup[]) => void
  resetScene: () => void
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
  items: [],
  groups: [],
  groupCounter: 0,
  history: [],
  future: [],
  dragSession: null,
  resizeSession: null,

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
          properties[def.key] = getDefaultColorForMaterial(mat)
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
          const hasChildGroups = groups.some((g) => g.parentGroupId === groupId)
          if (remaining.length <= 1 && !hasChildGroups) {
            groups = groups.filter((g) => g.id !== groupId)
            const survivors = new Set(remaining)
            return {
              ...pushHistory(state),
              items: state.items
                .filter((i) => i.id !== id)
                .map((i) => (survivors.has(i.id) ? { ...i, groupId: null } : i)),
              groups,
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
      }
    })
    useEditorStore.getState().removeFromSelection(id)
  },

  removeItems(ids) {
    if (ids.length === 0) return
    set((state) => {
      const idSet = new Set(ids)
      const affectedGroupIds = new Set<string>()
      for (const item of state.items) {
        if (idSet.has(item.id) && item.groupId) affectedGroupIds.add(item.groupId)
      }

      const dissolvedGroupIds = new Set<string>()
      let groups = state.groups
      for (const groupId of affectedGroupIds) {
        const group = groups.find((g) => g.id === groupId)
        if (!group) continue
        const remaining = group.itemIds.filter((iid) => !idSet.has(iid))
        const hasChildGroups = groups.some((g) => g.parentGroupId === groupId)
        if (remaining.length <= 1 && !hasChildGroups) {
          dissolvedGroupIds.add(groupId)
          groups = groups.filter((g) => g.id !== groupId)
        } else {
          groups = groups.map((g) => (g.id === groupId ? { ...g, itemIds: remaining } : g))
        }
      }

      const items = state.items
        .filter((i) => !idSet.has(i.id))
        .map((i) => (i.groupId && dissolvedGroupIds.has(i.groupId) ? { ...i, groupId: null } : i))

      return { ...pushHistory(state), items, groups }
    })
    useEditorStore.getState().removeItemsFromSelection(new Set(ids))
  },

  updateItem(id, patch) {
    set((state) => ({
      ...pushHistory(state),
      items: state.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }))
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
    const { selectedItemIds } = useEditorStore.getState()
    set((state) => {
      if (selectedItemIds.length < 2) return {}

      const selectedSet = new Set(selectedItemIds)

      const directGroupIds = selectedItemIds.map(
        (id) => state.items.find((i) => i.id === id)?.groupId ?? null
      )
      const uniqueGroupIds = new Set(directGroupIds)
      const parentGroupId =
        uniqueGroupIds.size === 1 && [...uniqueGroupIds][0] !== null
          ? ([...uniqueGroupIds][0] as string)
          : null

      const newCounter = state.groupCounter + 1
      const group: SceneGroup = {
        id: uuid(),
        name: `Группа ${newCounter}`,
        itemIds: [...selectedItemIds],
        collapsed: false,
        parentGroupId: parentGroupId ?? null,
      }

      const soloMembers = new Set<string>()
      const updatedGroups = state.groups
        .map((g) => ({ ...g, itemIds: g.itemIds.filter((id) => !selectedSet.has(id)) }))
        .filter((g) => {
          const isNewGroupParent = g.id === group.parentGroupId
          const hasExistingChildren = state.groups.some((og) => og.parentGroupId === g.id)
          if (isNewGroupParent || hasExistingChildren) return true
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
      }
    })
    useEditorStore.getState().clearEditorState()
  },

  ungroupItems(groupId) {
    set((state) => {
      const group = state.groups.find((g) => g.id === groupId)
      if (!group) return {}
      const newParentId = group.parentGroupId ?? null

      let groups = state.groups
        .filter((g) => g.id !== groupId)
        .map((g) => (g.parentGroupId === groupId ? { ...g, parentGroupId: newParentId } : g))

      if (newParentId) {
        groups = groups.map((g) =>
          g.id === newParentId ? { ...g, itemIds: [...g.itemIds, ...group.itemIds] } : g
        )
      }

      return {
        ...pushHistory(state),
        groups,
        items: state.items.map((item) =>
          item.groupId === groupId ? { ...item, groupId: newParentId } : item
        ),
      }
    })
  },

  moveGroup(groupId, delta) {
    set((state) => {
      if (!state.groups.find((g) => g.id === groupId)) return state

      const allGroupIds = collectDescendantGroupIds(groupId, state.groups)

      return {
        ...pushHistory(state),
        items: state.items.map((item) => {
          if (!item.groupId || !allGroupIds.has(item.groupId)) return item
          return {
            ...item,
            position: [
              item.position[0] + delta[0],
              Math.max(item.dimensions.height / 2, item.position[1] + delta[1]),
              item.position[2] + delta[2],
            ] as Vec3,
          }
        }),
      }
    })
  },

  // ── Interactive drag (gizmo) ──────────────────────────────────────────────

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
      const nextHistory = [...history, dragSession.snapshot]
      if (nextHistory.length > 50) nextHistory.shift()
      set({ history: nextHistory, future: [], dragSession: null })
    } else {
      set({
        items: dragSession.snapshot.items,
        groups: dragSession.snapshot.groups,
        dragSession: null,
      })
    }
  },

  beginResize() {
    set((state) => ({
      resizeSession: {
        snapshot: {
          items: [...state.items],
          groups: state.groups.map((g) => ({ ...g, itemIds: [...g.itemIds] })),
        },
      },
    }))
  },

  resizeLive(id, dimensions, position) {
    set((state) => ({
      items: state.items.map((item) => (item.id === id ? { ...item, dimensions, position } : item)),
    }))
  },

  endResize(commit) {
    const { resizeSession, history } = get()
    if (!resizeSession) return
    if (commit) {
      const nextHistory = [...history, resizeSession.snapshot]
      if (nextHistory.length > 50) nextHistory.shift()
      set({ history: nextHistory, future: [], resizeSession: null })
    } else {
      set({
        items: resizeSession.snapshot.items,
        groups: resizeSession.snapshot.groups,
        resizeSession: null,
      })
    }
  },

  removeGroup(groupId) {
    // Compute removed item IDs before mutating state so we can update editor selection precisely.
    const allGroupIds = collectDescendantGroupIds(groupId, get().groups)
    const removedIds = new Set(
      get()
        .items.filter((item) => item.groupId && allGroupIds.has(item.groupId))
        .map((item) => item.id)
    )

    set((state) => ({
      ...pushHistory(state),
      items: state.items.filter((item) => !removedIds.has(item.id)),
      groups: state.groups.filter((g) => !allGroupIds.has(g.id)),
    }))
    useEditorStore.getState().removeItemsFromSelection(removedIds)
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

  toggleItemVisibility(id) {
    set((state) => ({
      items: state.items.map((item) => (item.id === id ? { ...item, hidden: !item.hidden } : item)),
    }))
  },

  toggleGroupVisibility(id) {
    set((state) => ({
      groups: state.groups.map((g) => (g.id === id ? { ...g, hidden: !g.hidden } : g)),
    }))
  },

  toggleItemLocked(id) {
    set((state) => ({
      items: state.items.map((item) => (item.id === id ? { ...item, locked: !item.locked } : item)),
    }))
  },

  toggleGroupLocked(id) {
    set((state) => ({
      groups: state.groups.map((g) => (g.id === id ? { ...g, locked: !g.locked } : g)),
    }))
  },

  alignItems(alignment) {
    const { selectedItemIds } = useEditorStore.getState()
    set((state) => {
      const selected = selectedItemIds.flatMap((id) => {
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

      const selectedSet = new Set(selectedItemIds)
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

  loadScene(items, groups) {
    set({ items, groups })
    useEditorStore.getState().clearEditorState()
  },

  resetScene() {
    set({
      items: DEFAULT_SCENE_ITEMS,
      groups: DEFAULT_SCENE_GROUPS,
      history: [],
      future: [],
      dragSession: null,
      resizeSession: null,
    })
    useEditorStore.getState().clearEditorState()
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
    })
    useEditorStore.getState().clearEditorState()
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
    })
    useEditorStore.getState().clearEditorState()
  },
}))
