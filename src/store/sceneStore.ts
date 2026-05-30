import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import type { CatalogItem, SceneItem } from '@/types'

type ItemPatch = Partial<Pick<SceneItem, 'position' | 'rotationY' | 'dimensions' | 'properties'>>

interface SceneState {
  items: SceneItem[]
  selectedItemId: string | null
  history: SceneItem[][]
  future: SceneItem[][]
  addItem: (catalogItem: CatalogItem) => void
  removeItem: (id: string) => void
  updateItem: (id: string, patch: ItemPatch) => void
  selectItem: (id: string | null) => void
  rotateItem: (id: string, direction: 'left' | 'right') => void
  undo: () => void
  redo: () => void
}

function pushHistory(state: Pick<SceneState, 'items' | 'history' | 'future'>): {
  history: SceneItem[][]
  future: SceneItem[][]
} {
  const history = [...state.history, [...state.items]]
  if (history.length > 50) history.shift()
  return { history, future: [] }
}

export const useSceneStore = create<SceneState>((set, get) => ({
  items: [],
  selectedItemId: null,
  history: [],
  future: [],

  addItem(catalogItem) {
    set((state) => {
      const { width, height, depth } = catalogItem.defaultDimensions
      const properties: Record<string, number | string> = {}
      for (const def of catalogItem.properties) {
        if (def.type === 'number') {
          properties[def.key] = def.min ?? 0
        } else {
          properties[def.key] = def.options?.[0] ?? ''
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
      }
      return {
        ...pushHistory(state),
        items: [...state.items, newItem],
      }
    })
  },

  removeItem(id) {
    set((state) => ({
      ...pushHistory(state),
      items: state.items.filter((item) => item.id !== id),
      selectedItemId: state.selectedItemId === id ? null : state.selectedItemId,
    }))
  },

  updateItem(id, patch) {
    set((state) => ({
      ...pushHistory(state),
      items: state.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }))
  },

  selectItem(id) {
    set({ selectedItemId: id })
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

  undo() {
    const { history, items, future } = get()
    if (history.length === 0) return
    const previous = history[history.length - 1]
    set({
      items: previous,
      history: history.slice(0, -1),
      future: [items, ...future],
    })
  },

  redo() {
    const { future, items, history } = get()
    if (future.length === 0) return
    const next = future[0]
    set({
      items: next,
      history: [...history, items],
      future: future.slice(1),
    })
  },
}))
