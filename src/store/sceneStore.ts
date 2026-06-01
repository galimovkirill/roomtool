import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import type { CatalogItem, SceneGroup, SceneItem } from '@/types'
import { MATERIAL_COLORS, MATERIAL_OPTIONS, type MaterialType } from '@/catalog/materials'
import { DEFAULT_SCENE_GROUPS, DEFAULT_SCENE_ITEMS } from './defaultScene'

type ItemPatch = Partial<Pick<SceneItem, 'position' | 'rotationY' | 'dimensions' | 'properties'>>

type HistorySnapshot = { items: SceneItem[]; groups: SceneGroup[] }

interface SceneState {
  items: SceneItem[]
  groups: SceneGroup[]
  selectedItemId: string | null
  selectedItemIds: string[]
  groupCounter: number
  history: HistorySnapshot[]
  future: HistorySnapshot[]
  addItem: (catalogItem: CatalogItem) => void
  removeItem: (id: string) => void
  updateItem: (id: string, patch: ItemPatch) => void
  selectItem: (id: string | null) => void
  selectItems: (ids: string[]) => void
  toggleItemSelection: (id: string, addToSelection: boolean) => void
  rotateItem: (id: string, direction: 'left' | 'right') => void
  createGroup: () => void
  ungroupItems: (groupId: string) => void
  moveGroup: (groupId: string, delta: [number, number, number]) => void
  removeGroup: (groupId: string) => void
  renameGroup: (groupId: string, name: string) => void
  toggleGroupCollapse: (groupId: string) => void
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
  groupCounter: 0,
  history: [],
  future: [],

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
    set({
      selectedItemId: id,
      selectedItemIds: id ? [id] : [],
    })
  },

  selectItems(ids) {
    // Only updates multi-selection — does NOT open PropertiesPanel.
    // PropertiesPanel opens only via selectItem() (3D click).
    set({
      selectedItemIds: ids,
      selectedItemId: null,
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
    })
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
          if (g.itemIds.length === 1) { soloMembers.add(g.itemIds[0]); return false }
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

  removeGroup(groupId) {
    set((state) => ({
      ...pushHistory(state),
      items: state.items.filter((item) => item.groupId !== groupId),
      groups: state.groups.filter((g) => g.id !== groupId),
      selectedItemId: null,
      selectedItemIds: [],
    }))
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
}))

