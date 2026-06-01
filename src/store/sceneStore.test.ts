import { beforeEach, describe, expect, it } from 'vitest'
import { useSceneStore } from './sceneStore'
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
    selectedItemId: null,
    selectedItemIds: [],
    groupCounter: 0,
    history: [],
    future: [],
  })
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

  it('creates item with groupId null', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    expect(useSceneStore.getState().items[0].groupId).toBeNull()
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

  it('initialises select property to first option value', () => {
    const cat: CatalogItem = {
      ...TEST_ITEM,
      properties: [
        {
          key: 'color',
          label: 'Цвет',
          type: 'select',
          options: [
            { label: 'Белый', value: 'Белый' },
            { label: 'Венге', value: 'Венге' },
          ],
        },
      ],
    }
    useSceneStore.getState().addItem(cat)
    expect(useSceneStore.getState().items[0].properties.color).toBe('Белый')
  })

  it('initialises number property to default when set, ignoring min', () => {
    const cat: CatalogItem = {
      ...TEST_ITEM,
      properties: [
        {
          key: 'scale',
          label: 'Размер',
          type: 'number',
          unit: '%',
          min: 10,
          max: 200,
          default: 100,
        },
      ],
    }
    useSceneStore.getState().addItem(cat)
    expect(useSceneStore.getState().items[0].properties.scale).toBe(100)
  })

  it('initialises select property to default when set, ignoring first option', () => {
    const cat: CatalogItem = {
      ...TEST_ITEM,
      properties: [
        {
          key: 'color',
          label: 'Цвет',
          type: 'select',
          options: [
            { label: 'Белый', value: 'Белый' },
            { label: 'Венге', value: 'Венге' },
          ],
          default: 'Венге',
        },
      ],
    }
    useSceneStore.getState().addItem(cat)
    expect(useSceneStore.getState().items[0].properties.color).toBe('Венге')
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

  it('auto-ungroups when removing item leaves group with 1 member', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a, b] = useSceneStore.getState().items
    useSceneStore.getState().selectItems([a.id, b.id])
    useSceneStore.getState().createGroup('G')
    useSceneStore.getState().removeItem(a.id)
    const { groups, items } = useSceneStore.getState()
    expect(groups).toHaveLength(0)
    expect(items.find((i) => i.id === b.id)?.groupId).toBeNull()
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

describe('groups', () => {
  it('createGroup groups two selected items', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a, b] = useSceneStore.getState().items
    useSceneStore.getState().selectItems([a.id, b.id])
    useSceneStore.getState().createGroup('Группа 1')
    const { groups, items } = useSceneStore.getState()
    expect(groups).toHaveLength(1)
    expect(groups[0].itemIds).toContain(a.id)
    expect(groups[0].itemIds).toContain(b.id)
    expect(items.find((i) => i.id === a.id)?.groupId).toBe(groups[0].id)
    expect(items.find((i) => i.id === b.id)?.groupId).toBe(groups[0].id)
  })

  it('createGroup does nothing when fewer than 2 items selected', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a] = useSceneStore.getState().items
    useSceneStore.getState().selectItems([a.id])
    useSceneStore.getState().createGroup('Группа 1')
    expect(useSceneStore.getState().groups).toHaveLength(0)
  })

  it('ungroupItems clears groupId on all group members', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a, b] = useSceneStore.getState().items
    useSceneStore.getState().selectItems([a.id, b.id])
    useSceneStore.getState().createGroup('Группа 1')
    const groupId = useSceneStore.getState().groups[0].id
    useSceneStore.getState().ungroupItems(groupId)
    const { items, groups } = useSceneStore.getState()
    expect(groups).toHaveLength(0)
    expect(items.find((i) => i.id === a.id)?.groupId).toBeNull()
    expect(items.find((i) => i.id === b.id)?.groupId).toBeNull()
  })

  it('moveGroup shifts all group members by delta', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a, b] = useSceneStore.getState().items
    useSceneStore.getState().selectItems([a.id, b.id])
    useSceneStore.getState().createGroup('Группа 1')
    const groupId = useSceneStore.getState().groups[0].id
    const posA = useSceneStore.getState().items.find((i) => i.id === a.id)!.position
    useSceneStore.getState().moveGroup(groupId, [100, 0, 50])
    const newA = useSceneStore.getState().items.find((i) => i.id === a.id)!
    expect(newA.position[0]).toBeCloseTo(posA[0] + 100)
    expect(newA.position[2]).toBeCloseTo(posA[2] + 50)
  })

  it('removeGroup deletes group and all its items', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM) // third item, not in group
    const [a, b] = useSceneStore.getState().items
    useSceneStore.getState().selectItems([a.id, b.id])
    useSceneStore.getState().createGroup('Группа 1')
    const groupId = useSceneStore.getState().groups[0].id
    useSceneStore.getState().removeGroup(groupId)
    const { items, groups } = useSceneStore.getState()
    expect(groups).toHaveLength(0)
    expect(items.find((i) => i.id === a.id)).toBeUndefined()
    expect(items.find((i) => i.id === b.id)).toBeUndefined()
    expect(items).toHaveLength(1) // third item survives
  })

  it('undo after createGroup restores ungrouped state', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a, b] = useSceneStore.getState().items
    useSceneStore.getState().selectItems([a.id, b.id])
    useSceneStore.getState().createGroup('Группа 1')
    useSceneStore.getState().undo()
    const { groups, items } = useSceneStore.getState()
    expect(groups).toHaveLength(0)
    expect(items.find((i) => i.id === a.id)?.groupId).toBeNull()
  })

  it('undo after moveGroup restores positions', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a] = useSceneStore.getState().items
    const origPos = [...useSceneStore.getState().items.find((i) => i.id === a.id)!.position]
    useSceneStore.getState().selectItems(useSceneStore.getState().items.map((i) => i.id))
    useSceneStore.getState().createGroup('G')
    const groupId = useSceneStore.getState().groups[0].id
    useSceneStore.getState().moveGroup(groupId, [500, 0, 0])
    useSceneStore.getState().undo()
    const restoredPos = useSceneStore.getState().items.find((i) => i.id === a.id)!.position
    expect(restoredPos[0]).toBeCloseTo(origPos[0])
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

describe('toggleItemSelection', () => {
  it('adds an item to selection when not already selected', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a, b] = useSceneStore.getState().items
    useSceneStore.getState().selectItems([a.id])
    useSceneStore.getState().toggleItemSelection(b.id, true)
    expect(useSceneStore.getState().selectedItemIds).toContain(a.id)
    expect(useSceneStore.getState().selectedItemIds).toContain(b.id)
  })

  it('removes an item from selection when already selected (toggle-off)', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a, b] = useSceneStore.getState().items
    useSceneStore.getState().selectItems([a.id, b.id])
    useSceneStore.getState().toggleItemSelection(a.id, true)
    expect(useSceneStore.getState().selectedItemIds).not.toContain(a.id)
    expect(useSceneStore.getState().selectedItemIds).toContain(b.id)
  })

  it('replaces selection when addToSelection is false', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a, b] = useSceneStore.getState().items
    useSceneStore.getState().selectItems([a.id])
    useSceneStore.getState().toggleItemSelection(b.id, false)
    expect(useSceneStore.getState().selectedItemIds).toEqual([b.id])
  })

  it('does not set selectedItemId (PropertiesPanel stays closed)', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a] = useSceneStore.getState().items
    useSceneStore.getState().toggleItemSelection(a.id, false)
    expect(useSceneStore.getState().selectedItemId).toBeNull()
  })
})

describe('history limit', () => {
  it('does not exceed 50 history records', () => {
    for (let i = 0; i < 55; i++) useSceneStore.getState().addItem(TEST_ITEM)
    expect(useSceneStore.getState().history.length).toBeLessThanOrEqual(50)
  })
})
