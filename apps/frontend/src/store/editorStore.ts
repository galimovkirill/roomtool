import { create } from 'zustand'

interface EditorState {
  selectedItemId: string | null
  selectedItemIds: string[]
  editingItemId: string | null

  selectItem(id: string | null): void
  selectItems(ids: string[]): void
  toggleItemSelection(id: string, addToSelection: boolean): void
  editItem(id: string): void
  closeEditing(): void

  // Called by sceneStore after mutations that affect selection
  clearEditorState(): void
  removeFromSelection(id: string): void
  removeItemsFromSelection(ids: Set<string>): void
}

export const useEditorStore = create<EditorState>((set, get) => ({
  selectedItemId: null,
  selectedItemIds: [],
  editingItemId: null,

  selectItem(id) {
    set((state) => ({
      selectedItemId: id,
      selectedItemIds: id ? [id] : [],
      editingItemId: state.editingItemId === id ? state.editingItemId : null,
    }))
  },

  selectItems(ids) {
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
    set({
      selectedItemIds: next,
      selectedItemId: null,
      editingItemId: null,
    })
  },

  editItem(id) {
    set({
      editingItemId: id,
      selectedItemId: id,
      selectedItemIds: [id],
    })
  },

  closeEditing() {
    set({ editingItemId: null })
  },

  clearEditorState() {
    set({ selectedItemId: null, selectedItemIds: [], editingItemId: null })
  },

  removeFromSelection(id) {
    set((s) => ({
      selectedItemId: s.selectedItemId === id ? null : s.selectedItemId,
      selectedItemIds: s.selectedItemIds.filter((sid) => sid !== id),
      editingItemId: s.editingItemId === id ? null : s.editingItemId,
    }))
  },

  removeItemsFromSelection(ids) {
    set((s) => ({
      selectedItemId: s.selectedItemId && ids.has(s.selectedItemId) ? null : s.selectedItemId,
      selectedItemIds: s.selectedItemIds.filter((sid) => !ids.has(sid)),
      editingItemId: s.editingItemId && ids.has(s.editingItemId) ? null : s.editingItemId,
    }))
  },
}))
