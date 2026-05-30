import { beforeEach, describe, expect, it } from 'vitest'
import { useSceneStore } from './sceneStore'
import type { CatalogItem } from '@/types'

const TEST_ITEM: CatalogItem = {
  id: 'test',
  name: 'Тест',
  category: 'X',
  defaultDimensions: { width: 900, height: 2200, depth: 600 },
  properties: [],
}

beforeEach(() => {
  useSceneStore.setState({ items: [], selectedItemId: null, history: [], future: [] })
})

describe('addItem', () => {
  it('adds an item to the scene', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    expect(useSceneStore.getState().items).toHaveLength(1)
  })

  it('sets position.y to height / 2', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    const item = useSceneStore.getState().items[0]
    expect(item.position[1]).toBe(TEST_ITEM.defaultDimensions.height / 2)
  })

  it('initialises number property to min value', () => {
    const cat: CatalogItem = {
      ...TEST_ITEM,
      properties: [
        { key: 'thickness', label: 'Толщина', type: 'number', unit: 'мм', min: 16, max: 36 },
      ],
    }
    useSceneStore.getState().addItem(cat)
    expect(useSceneStore.getState().items[0].properties.thickness).toBe(16)
  })

  it('initialises select property to first option', () => {
    const cat: CatalogItem = {
      ...TEST_ITEM,
      properties: [{ key: 'color', label: 'Цвет', type: 'select', options: ['Белый', 'Венге'] }],
    }
    useSceneStore.getState().addItem(cat)
    expect(useSceneStore.getState().items[0].properties.color).toBe('Белый')
  })
})

describe('removeItem', () => {
  it('removes an item', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    const id = useSceneStore.getState().items[0].id
    useSceneStore.getState().removeItem(id)
    expect(useSceneStore.getState().items).toHaveLength(0)
  })

  it('resets selectedItemId when selected item is removed', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    const id = useSceneStore.getState().items[0].id
    useSceneStore.getState().selectItem(id)
    useSceneStore.getState().removeItem(id)
    expect(useSceneStore.getState().selectedItemId).toBeNull()
  })

  it('does not reset selectedItemId when another item is removed', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    const [first, second] = useSceneStore.getState().items
    useSceneStore.getState().selectItem(first.id)
    useSceneStore.getState().removeItem(second.id)
    expect(useSceneStore.getState().selectedItemId).toBe(first.id)
  })
})

describe('rotateItem', () => {
  it('rotates right by PI/2', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    const id = useSceneStore.getState().items[0].id
    useSceneStore.getState().rotateItem(id, 'right')
    expect(useSceneStore.getState().items[0].rotationY).toBeCloseTo(Math.PI / 2)
  })

  it('rotates left by -PI/2', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    const id = useSceneStore.getState().items[0].id
    useSceneStore.getState().rotateItem(id, 'left')
    expect(useSceneStore.getState().items[0].rotationY).toBeCloseTo(-Math.PI / 2)
  })
})

describe('undo / redo', () => {
  it('undo after addItem restores empty items', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().undo()
    expect(useSceneStore.getState().items).toHaveLength(0)
  })

  it('redo after undo restores the added item', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().undo()
    useSceneStore.getState().redo()
    expect(useSceneStore.getState().items).toHaveLength(1)
  })

  it('undo does nothing when history is empty', () => {
    useSceneStore.getState().undo()
    expect(useSceneStore.getState().items).toHaveLength(0)
  })

  it('redo does nothing when future is empty', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().redo()
    expect(useSceneStore.getState().items).toHaveLength(1)
  })

  it('5 actions → 5 undos → empty → 5 redos → 5 items', () => {
    for (let i = 0; i < 5; i++) useSceneStore.getState().addItem(TEST_ITEM)
    for (let i = 0; i < 5; i++) useSceneStore.getState().undo()
    expect(useSceneStore.getState().items).toHaveLength(0)
    for (let i = 0; i < 5; i++) useSceneStore.getState().redo()
    expect(useSceneStore.getState().items).toHaveLength(5)
  })
})

describe('history limit', () => {
  it('does not exceed 50 history records', () => {
    for (let i = 0; i < 55; i++) useSceneStore.getState().addItem(TEST_ITEM)
    expect(useSceneStore.getState().history.length).toBeLessThanOrEqual(50)
  })
})
