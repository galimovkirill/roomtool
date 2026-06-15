import { beforeEach, describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSceneStore } from './sceneStore'
import { useEditorStore } from './editorStore'
import { useKeyboard } from '@/hooks/useKeyboard'
import type { CatalogItem } from '@/types'

const TEST_ITEM: CatalogItem = {
  id: 'side-panel',
  name: 'Боковая панель',
  category: 'Корпус',
  defaultDimensions: { width: 16, height: 2200, depth: 600 },
  properties: [],
}

beforeEach(() => {
  useSceneStore.setState({
    items: [],
    groups: [],
    groupCounter: 0,
    history: [],
    future: [],
    dragSession: null,
    resizeSession: null,
  })
  useEditorStore.setState({ selectedItemId: null, selectedItemIds: [], editingItemId: null })
})

describe('history — basic operations', () => {
  it('addItem → undo → items empty', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().undo()
    expect(useSceneStore.getState().items).toHaveLength(0)
  })

  it('addItem → undo → redo → items has the item', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().undo()
    useSceneStore.getState().redo()
    expect(useSceneStore.getState().items).toHaveLength(1)
  })

  it('5 additions → 5 undos → empty → 5 redos → 5 items', () => {
    for (let i = 0; i < 5; i++) useSceneStore.getState().addItem(TEST_ITEM)
    for (let i = 0; i < 5; i++) useSceneStore.getState().undo()
    expect(useSceneStore.getState().items).toHaveLength(0)
    for (let i = 0; i < 5; i++) useSceneStore.getState().redo()
    expect(useSceneStore.getState().items).toHaveLength(5)
  })

  it('undo on empty history — no crash, items unchanged', () => {
    expect(() => useSceneStore.getState().undo()).not.toThrow()
    expect(useSceneStore.getState().items).toHaveLength(0)
  })

  it('redo on empty future — no crash, items unchanged', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    expect(() => useSceneStore.getState().redo()).not.toThrow()
    expect(useSceneStore.getState().items).toHaveLength(1)
  })
})

describe('history limit', () => {
  it('51 actions → history has exactly 50 entries (oldest evicted)', () => {
    for (let i = 0; i < 51; i++) useSceneStore.getState().addItem(TEST_ITEM)
    expect(useSceneStore.getState().history).toHaveLength(50)
  })
})

describe('clearEditorState after undo/redo', () => {
  it('undo clears selection and editing', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    const id = useSceneStore.getState().items[0].id
    useEditorStore.setState({ selectedItemId: id, selectedItemIds: [id], editingItemId: id })
    useSceneStore.getState().undo()
    const s = useEditorStore.getState()
    expect(s.selectedItemId).toBeNull()
    expect(s.selectedItemIds).toHaveLength(0)
    expect(s.editingItemId).toBeNull()
  })

  it('redo clears selection and editing', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().undo()
    useEditorStore.setState({
      selectedItemId: 'stale-id',
      selectedItemIds: ['stale-id'],
      editingItemId: null,
    })
    useSceneStore.getState().redo()
    const s = useEditorStore.getState()
    expect(s.selectedItemId).toBeNull()
    expect(s.selectedItemIds).toHaveLength(0)
    expect(s.editingItemId).toBeNull()
  })
})

describe('useKeyboard smoke tests', () => {
  function fireKey(
    key: string,
    opts: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean; target?: EventTarget } = {}
  ) {
    const event = new KeyboardEvent('keydown', {
      key,
      ctrlKey: opts.ctrlKey ?? false,
      metaKey: opts.metaKey ?? false,
      shiftKey: opts.shiftKey ?? false,
      bubbles: true,
    })
    if (opts.target) {
      Object.defineProperty(event, 'target', { value: opts.target, writable: false })
    }
    window.dispatchEvent(event)
  }

  function mountShortcuts() {
    return renderHook(() =>
      useKeyboard({
        'ctrl+z': () => useSceneStore.getState().undo(),
        'ctrl+shift+z': () => useSceneStore.getState().redo(),
      })
    )
  }

  it('ctrl+z fires undo — items empty after addItem', () => {
    mountShortcuts()
    useSceneStore.getState().addItem(TEST_ITEM)
    fireKey('z', { ctrlKey: true })
    expect(useSceneStore.getState().items).toHaveLength(0)
  })

  it('ctrl+shift+z fires redo — restores item after undo', () => {
    mountShortcuts()
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().undo()
    fireKey('z', { ctrlKey: true, shiftKey: true })
    expect(useSceneStore.getState().items).toHaveLength(1)
  })

  it('metaKey+z fires undo (macOS Cmd+Z)', () => {
    mountShortcuts()
    useSceneStore.getState().addItem(TEST_ITEM)
    fireKey('z', { metaKey: true })
    expect(useSceneStore.getState().items).toHaveLength(0)
  })

  it('ctrl+z with target=<input> does NOT fire undo (input guard)', () => {
    mountShortcuts()
    useSceneStore.getState().addItem(TEST_ITEM)
    const input = document.createElement('input')
    fireKey('z', { ctrlKey: true, target: input })
    expect(useSceneStore.getState().items).toHaveLength(1)
  })
})
