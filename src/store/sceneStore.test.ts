import { beforeEach, describe, expect, it } from 'vitest'
import { useSceneStore } from './sceneStore'
import { MATERIAL_COLORS, MATERIAL_OPTIONS, type MaterialType } from '@/catalog/materials'
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

  it('initialises material property to first MATERIAL_OPTIONS value when no options', () => {
    const cat: CatalogItem = {
      ...TEST_ITEM,
      properties: [{ key: 'material', label: 'Материал', type: 'material' }],
    }
    useSceneStore.getState().addItem(cat)
    expect(useSceneStore.getState().items[0].properties.material).toBe(MATERIAL_OPTIONS[0])
  })

  it('initialises material property to first explicit option when options provided', () => {
    const cat: CatalogItem = {
      ...TEST_ITEM,
      properties: [
        {
          key: 'material',
          label: 'Материал',
          type: 'material',
          options: [
            { label: 'Стекло', value: 'Стекло' },
            { label: 'Металл', value: 'Металл' },
          ],
        },
      ],
    }
    useSceneStore.getState().addItem(cat)
    expect(useSceneStore.getState().items[0].properties.material).toBe('Стекло')
  })

  it('initialises color to the first color of the chosen material', () => {
    const cat: CatalogItem = {
      ...TEST_ITEM,
      properties: [
        { key: 'material', label: 'Материал', type: 'material' },
        { key: 'color', label: 'Цвет', type: 'color', dependsOnMaterial: 'material' },
      ],
    }
    useSceneStore.getState().addItem(cat)
    const props = useSceneStore.getState().items[0].properties
    const firstColor = MATERIAL_COLORS[props.material as MaterialType][0].value
    expect(props.color).toBe(firstColor)
  })

  it('resolves color against material when material is declared before color', () => {
    const cat: CatalogItem = {
      ...TEST_ITEM,
      properties: [
        {
          key: 'material',
          label: 'Материал',
          type: 'material',
          options: [{ label: 'Массив', value: 'Массив' }],
        },
        { key: 'color', label: 'Цвет', type: 'color', dependsOnMaterial: 'material' },
      ],
    }
    useSceneStore.getState().addItem(cat)
    expect(useSceneStore.getState().items[0].properties.color).toBe(
      MATERIAL_COLORS['Массив'][0].value
    )
  })

  it('falls back to default material colors when color is declared before its material', () => {
    // Documents the init ordering dependency: at the color field's turn the material
    // value is not yet in `properties`, so it falls back to MATERIAL_OPTIONS[0] colors.
    const cat: CatalogItem = {
      ...TEST_ITEM,
      properties: [
        { key: 'color', label: 'Цвет', type: 'color', dependsOnMaterial: 'material' },
        {
          key: 'material',
          label: 'Материал',
          type: 'material',
          options: [{ label: 'Массив', value: 'Массив' }],
        },
      ],
    }
    useSceneStore.getState().addItem(cat)
    const props = useSceneStore.getState().items[0].properties
    expect(props.material).toBe('Массив')
    expect(props.color).toBe(MATERIAL_COLORS[MATERIAL_OPTIONS[0]][0].value)
  })

  it('falls back to default color when dependsOnMaterial points to an unknown material', () => {
    const cat: CatalogItem = {
      ...TEST_ITEM,
      properties: [{ key: 'color', label: 'Цвет', type: 'color', dependsOnMaterial: 'absent' }],
    }
    useSceneStore.getState().addItem(cat)
    // no 'material' key resolved → falls back to first option of MATERIAL_OPTIONS[0]
    expect(typeof useSceneStore.getState().items[0].properties.color).toBe('string')
    expect(useSceneStore.getState().items[0].properties.color).toMatch(/^#/)
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
    useSceneStore.getState().createGroup()
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

describe('updateItem', () => {
  it('applies a position patch to the targeted item only', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a, b] = useSceneStore.getState().items
    useSceneStore.getState().updateItem(a.id, { position: [10, 20, 30] })
    const items = useSceneStore.getState().items
    expect(items.find((i) => i.id === a.id)?.position).toEqual([10, 20, 30])
    expect(items.find((i) => i.id === b.id)?.position).toEqual(b.position)
  })

  it('merges dimensions patch and pushes history', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a] = useSceneStore.getState().items
    useSceneStore.getState().updateItem(a.id, { dimensions: { width: 50, height: 60, depth: 70 } })
    expect(useSceneStore.getState().items[0].dimensions).toEqual({
      width: 50,
      height: 60,
      depth: 70,
    })
    useSceneStore.getState().undo()
    expect(useSceneStore.getState().items[0].dimensions).toEqual(TEST_ITEM.defaultDimensions)
  })
})

describe('groups', () => {
  it('createGroup groups two selected items', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a, b] = useSceneStore.getState().items
    useSceneStore.getState().selectItems([a.id, b.id])
    useSceneStore.getState().createGroup()
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
    useSceneStore.getState().createGroup()
    expect(useSceneStore.getState().groups).toHaveLength(0)
  })

  it('ungroupItems clears groupId on all group members', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a, b] = useSceneStore.getState().items
    useSceneStore.getState().selectItems([a.id, b.id])
    useSceneStore.getState().createGroup()
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
    useSceneStore.getState().createGroup()
    const groupId = useSceneStore.getState().groups[0].id
    const posA = useSceneStore.getState().items.find((i) => i.id === a.id)!.position
    useSceneStore.getState().moveGroup(groupId, [100, 0, 50])
    const newA = useSceneStore.getState().items.find((i) => i.id === a.id)!
    expect(newA.position[0]).toBeCloseTo(posA[0] + 100)
    expect(newA.position[2]).toBeCloseTo(posA[2] + 50)
  })

  it('moveGroup clamps members to the floor (y never below height/2)', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a, b] = useSceneStore.getState().items
    useSceneStore.getState().selectItems([a.id, b.id])
    useSceneStore.getState().createGroup()
    const groupId = useSceneStore.getState().groups[0].id
    // large downward delta — members must stop at floor, not sink below
    useSceneStore.getState().moveGroup(groupId, [0, -999999, 0])
    const floor = TEST_ITEM.defaultDimensions.height / 2
    for (const i of useSceneStore.getState().items) {
      expect(i.position[1]).toBe(floor)
    }
  })

  it('moveGroup does nothing for an unknown groupId', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    const before = useSceneStore.getState().items[0].position
    useSceneStore.getState().moveGroup('no-such-group', [100, 0, 0])
    expect(useSceneStore.getState().items[0].position).toEqual(before)
  })

  it('renameGroup updates the group name', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a, b] = useSceneStore.getState().items
    useSceneStore.getState().selectItems([a.id, b.id])
    useSceneStore.getState().createGroup()
    const groupId = useSceneStore.getState().groups[0].id
    useSceneStore.getState().renameGroup(groupId, 'Шкаф слева')
    expect(useSceneStore.getState().groups[0].name).toBe('Шкаф слева')
  })

  it('toggleGroupCollapse flips collapsed flag', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a, b] = useSceneStore.getState().items
    useSceneStore.getState().selectItems([a.id, b.id])
    useSceneStore.getState().createGroup()
    const groupId = useSceneStore.getState().groups[0].id
    expect(useSceneStore.getState().groups[0].collapsed).toBe(false)
    useSceneStore.getState().toggleGroupCollapse(groupId)
    expect(useSceneStore.getState().groups[0].collapsed).toBe(true)
    useSceneStore.getState().toggleGroupCollapse(groupId)
    expect(useSceneStore.getState().groups[0].collapsed).toBe(false)
  })

  it('removeGroup deletes group and all its items', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM) // third item, not in group
    const [a, b] = useSceneStore.getState().items
    useSceneStore.getState().selectItems([a.id, b.id])
    useSceneStore.getState().createGroup()
    const groupId = useSceneStore.getState().groups[0].id
    useSceneStore.getState().removeGroup(groupId)
    const { items, groups } = useSceneStore.getState()
    expect(groups).toHaveLength(0)
    expect(items.find((i) => i.id === a.id)).toBeUndefined()
    expect(items.find((i) => i.id === b.id)).toBeUndefined()
    expect(items).toHaveLength(1) // third item survives
  })

  it('createGroup removes regrouped items from their previous group', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a, b, c] = useSceneStore.getState().items
    // Put a, b, c into first group
    useSceneStore.getState().selectItems([a.id, b.id, c.id])
    useSceneStore.getState().createGroup()
    const g1Id = useSceneStore.getState().groups[0].id
    // Now re-select a and b to create a second group
    useSceneStore.getState().selectItems([a.id, b.id])
    useSceneStore.getState().createGroup()
    const { groups, items } = useSceneStore.getState()
    const g1 = groups.find((g) => g.id === g1Id)
    const g2 = groups.find((g) => g.id !== g1Id)
    // g1 had 3 members; lost a and b → 1 remaining → auto-ungrouped
    expect(g1).toBeUndefined()
    expect(items.find((i) => i.id === c.id)?.groupId).toBeNull()
    // a and b are in the new group
    expect(g2?.itemIds).toContain(a.id)
    expect(g2?.itemIds).toContain(b.id)
    expect(items.find((i) => i.id === a.id)?.groupId).toBe(g2?.id)
  })

  it('createGroup names group using store counter, not stale React snapshot', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a, b, c, d] = useSceneStore.getState().items
    useSceneStore.getState().selectItems([a.id, b.id])
    useSceneStore.getState().createGroup()
    useSceneStore.getState().selectItems([c.id, d.id])
    useSceneStore.getState().createGroup()
    const { groups } = useSceneStore.getState()
    expect(groups[0].name).toBe('Группа 1')
    expect(groups[1].name).toBe('Группа 2')
  })

  it('undo after createGroup restores ungrouped state', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a, b] = useSceneStore.getState().items
    useSceneStore.getState().selectItems([a.id, b.id])
    useSceneStore.getState().createGroup()
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
    useSceneStore.getState().createGroup()
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
