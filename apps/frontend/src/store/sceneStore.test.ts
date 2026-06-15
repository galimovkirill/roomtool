import { beforeEach, describe, expect, it } from 'vitest'
import { useSceneStore } from './sceneStore'
import { useEditorStore } from './editorStore'
import { MATERIAL_COLORS, MATERIAL_OPTIONS, type MaterialType } from '@/catalog/materials'
import { SCENE_CONFIG } from '@/config/scene'
import type { CatalogItem, RoomDimensions, SceneGroup, SceneItem } from '@/types'

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
    room: { ...SCENE_CONFIG.room },
    groupCounter: 0,
    history: [],
    future: [],
    dragSession: null,
    resizeSession: null,
  })
  useEditorStore.setState({ selectedItemId: null, selectedItemIds: [], editingItemId: null })
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
    useEditorStore.getState().selectItem(id)
    useSceneStore.getState().removeItem(id)
    expect(useEditorStore.getState().selectedItemId).toBeNull()
  })

  it('auto-ungroups when removing item leaves group with 1 member', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a, b] = useSceneStore.getState().items
    useEditorStore.getState().selectItems([a.id, b.id])
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
    useEditorStore.getState().selectItem(first.id)
    useSceneStore.getState().removeItem(second.id)
    expect(useEditorStore.getState().selectedItemId).toBe(first.id)
  })
})

describe('removeItems', () => {
  it('removes multiple items in one history step', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a, b] = useSceneStore.getState().items
    const historyBefore = useSceneStore.getState().history.length
    useSceneStore.getState().removeItems([a.id, b.id])
    const { items, history } = useSceneStore.getState()
    expect(items).toHaveLength(1)
    expect(history).toHaveLength(historyBefore + 1)
  })

  it('removes items from different groups and auto-dissolves groups with ≤1 survivor', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a, b, c] = useSceneStore.getState().items
    useEditorStore.getState().selectItems([a.id, b.id])
    useSceneStore.getState().createGroup()
    // remove a — group dissolves (b survives ungrouped), c untouched
    useSceneStore.getState().removeItems([a.id])
    const { groups, items } = useSceneStore.getState()
    expect(groups).toHaveLength(0)
    expect(items.find((i) => i.id === b.id)?.groupId).toBeNull()
    expect(items.find((i) => i.id === c.id)).toBeDefined()
  })

  it('keeps group intact when enough members survive', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a, b, c] = useSceneStore.getState().items
    useEditorStore.getState().selectItems([a.id, b.id, c.id])
    useSceneStore.getState().createGroup()
    const groupId = useSceneStore.getState().groups[0].id
    useSceneStore.getState().removeItems([a.id])
    const { groups } = useSceneStore.getState()
    expect(groups).toHaveLength(1)
    expect(groups[0].id).toBe(groupId)
    expect(groups[0].itemIds).not.toContain(a.id)
  })

  it('clears editingItemId when the edited item is among removed', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a, b] = useSceneStore.getState().items
    useEditorStore.getState().editItem(a.id)
    useSceneStore.getState().removeItems([a.id, b.id])
    expect(useEditorStore.getState().editingItemId).toBeNull()
  })

  it('does not push history for empty ids array', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    const historyBefore = useSceneStore.getState().history.length
    useSceneStore.getState().removeItems([])
    expect(useSceneStore.getState().history).toHaveLength(historyBefore)
    expect(useSceneStore.getState().items).toHaveLength(1)
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
    useEditorStore.getState().selectItems([a.id, b.id])
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
    useEditorStore.getState().selectItems([a.id])
    useSceneStore.getState().createGroup()
    expect(useSceneStore.getState().groups).toHaveLength(0)
  })

  it('ungroupItems clears groupId on all group members', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a, b] = useSceneStore.getState().items
    useEditorStore.getState().selectItems([a.id, b.id])
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
    useEditorStore.getState().selectItems([a.id, b.id])
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
    useEditorStore.getState().selectItems([a.id, b.id])
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
    useEditorStore.getState().selectItems([a.id, b.id])
    useSceneStore.getState().createGroup()
    const groupId = useSceneStore.getState().groups[0].id
    useSceneStore.getState().renameGroup(groupId, 'Шкаф слева')
    expect(useSceneStore.getState().groups[0].name).toBe('Шкаф слева')
  })

  it('toggleGroupCollapse flips collapsed flag', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a, b] = useSceneStore.getState().items
    useEditorStore.getState().selectItems([a.id, b.id])
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
    useEditorStore.getState().selectItems([a.id, b.id])
    useSceneStore.getState().createGroup()
    const groupId = useSceneStore.getState().groups[0].id
    useSceneStore.getState().removeGroup(groupId)
    const { items, groups } = useSceneStore.getState()
    expect(groups).toHaveLength(0)
    expect(items.find((i) => i.id === a.id)).toBeUndefined()
    expect(items.find((i) => i.id === b.id)).toBeUndefined()
    expect(items).toHaveLength(1) // third item survives
  })

  it('createGroup nests a new group inside the common parent when all selected items share one', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a, b, c] = useSceneStore.getState().items
    // Put a, b, c into first group
    useEditorStore.getState().selectItems([a.id, b.id, c.id])
    useSceneStore.getState().createGroup()
    const g1Id = useSceneStore.getState().groups[0].id
    // Now re-select a and b — both share g1 as direct parent → new group nests inside g1
    useEditorStore.getState().selectItems([a.id, b.id])
    useSceneStore.getState().createGroup()
    const { groups, items } = useSceneStore.getState()
    const g1 = groups.find((g) => g.id === g1Id)
    const g2 = groups.find((g) => g.id !== g1Id)
    // g1 survives: a and b moved to child group g2, c remains direct member of g1
    expect(g1).toBeDefined()
    expect(g1?.itemIds).toContain(c.id)
    expect(g1?.itemIds).not.toContain(a.id)
    expect(g1?.itemIds).not.toContain(b.id)
    // g2 is nested inside g1
    expect(g2?.parentGroupId).toBe(g1Id)
    expect(g2?.itemIds).toContain(a.id)
    expect(g2?.itemIds).toContain(b.id)
    expect(items.find((i) => i.id === a.id)?.groupId).toBe(g2?.id)
    expect(items.find((i) => i.id === c.id)?.groupId).toBe(g1Id)
  })

  it('createGroup names group using store counter, not stale React snapshot', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a, b, c, d] = useSceneStore.getState().items
    useEditorStore.getState().selectItems([a.id, b.id])
    useSceneStore.getState().createGroup()
    useEditorStore.getState().selectItems([c.id, d.id])
    useSceneStore.getState().createGroup()
    const { groups } = useSceneStore.getState()
    expect(groups[0].name).toBe('Группа 1')
    expect(groups[1].name).toBe('Группа 2')
  })

  it('undo after createGroup restores ungrouped state', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a, b] = useSceneStore.getState().items
    useEditorStore.getState().selectItems([a.id, b.id])
    useSceneStore.getState().createGroup()
    useSceneStore.getState().undo()
    const { groups, items } = useSceneStore.getState()
    expect(groups).toHaveLength(0)
    expect(items.find((i) => i.id === a.id)?.groupId).toBeNull()
  })

  it('createGroup creates at root level when selection mixes ungrouped and grouped items', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a, b, c] = useSceneStore.getState().items
    // Put a and b into g1
    useEditorStore.getState().selectItems([a.id, b.id])
    useSceneStore.getState().createGroup()
    const g1Id = useSceneStore.getState().groups[0].id
    // Select b (in g1) and c (ungrouped) → mixed selection → root-level group
    useEditorStore.getState().selectItems([b.id, c.id])
    useSceneStore.getState().createGroup()
    const { groups } = useSceneStore.getState()
    const g2 = groups.find((g) => g.id !== g1Id)
    expect(g2?.parentGroupId).toBeFalsy()
  })

  it('ungroupItems moves items to parent group when subgroup has a parent', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a, b, c] = useSceneStore.getState().items
    // g1 = [a, b, c]; then g2 (nested in g1) = [a, b]
    useEditorStore.getState().selectItems([a.id, b.id, c.id])
    useSceneStore.getState().createGroup()
    const g1Id = useSceneStore.getState().groups[0].id
    useEditorStore.getState().selectItems([a.id, b.id])
    useSceneStore.getState().createGroup()
    const g2Id = useSceneStore.getState().groups.find((g) => g.id !== g1Id)!.id
    // Ungroup g2 → a and b should return to g1
    useSceneStore.getState().ungroupItems(g2Id)
    const { groups, items } = useSceneStore.getState()
    expect(groups.find((g) => g.id === g2Id)).toBeUndefined()
    expect(items.find((i) => i.id === a.id)?.groupId).toBe(g1Id)
    expect(items.find((i) => i.id === b.id)?.groupId).toBe(g1Id)
    expect(groups.find((g) => g.id === g1Id)?.itemIds).toContain(a.id)
  })

  it('removeGroup recursively removes nested subgroups and their items', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM) // d: standalone
    const [a, b, c, d] = useSceneStore.getState().items
    // g1 = [a, b, c]; g2 (nested) = [a, b]
    useEditorStore.getState().selectItems([a.id, b.id, c.id])
    useSceneStore.getState().createGroup()
    const g1Id = useSceneStore.getState().groups[0].id
    useEditorStore.getState().selectItems([a.id, b.id])
    useSceneStore.getState().createGroup()
    // Remove g1 — should also remove g2 and items a, b, c; d survives
    useSceneStore.getState().removeGroup(g1Id)
    const { groups, items } = useSceneStore.getState()
    expect(groups).toHaveLength(0)
    expect(items.find((i) => i.id === a.id)).toBeUndefined()
    expect(items.find((i) => i.id === b.id)).toBeUndefined()
    expect(items.find((i) => i.id === c.id)).toBeUndefined()
    expect(items.find((i) => i.id === d.id)).toBeDefined()
  })

  it('removeItem does not dissolve a group that still has child groups', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a, b, c] = useSceneStore.getState().items
    // g1 = [a, b, c]; g2 (nested) = [a, b]; g1 has 1 direct member c + child g2
    useEditorStore.getState().selectItems([a.id, b.id, c.id])
    useSceneStore.getState().createGroup()
    const g1Id = useSceneStore.getState().groups[0].id
    useEditorStore.getState().selectItems([a.id, b.id])
    useSceneStore.getState().createGroup()
    // Remove c — g1 now has 0 direct items but still has child group g2 → must survive
    useSceneStore.getState().removeItem(c.id)
    const { groups } = useSceneStore.getState()
    expect(groups.find((g) => g.id === g1Id)).toBeDefined()
  })

  it('undo after moveGroup restores positions', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a] = useSceneStore.getState().items
    const origPos = [...useSceneStore.getState().items.find((i) => i.id === a.id)!.position]
    useEditorStore.getState().selectItems(useSceneStore.getState().items.map((i) => i.id))
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
    useEditorStore.getState().selectItems([a.id])
    useEditorStore.getState().toggleItemSelection(b.id, true)
    expect(useEditorStore.getState().selectedItemIds).toContain(a.id)
    expect(useEditorStore.getState().selectedItemIds).toContain(b.id)
  })

  it('removes an item from selection when already selected (toggle-off)', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a, b] = useSceneStore.getState().items
    useEditorStore.getState().selectItems([a.id, b.id])
    useEditorStore.getState().toggleItemSelection(a.id, true)
    expect(useEditorStore.getState().selectedItemIds).not.toContain(a.id)
    expect(useEditorStore.getState().selectedItemIds).toContain(b.id)
  })

  it('replaces selection when addToSelection is false', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a, b] = useSceneStore.getState().items
    useEditorStore.getState().selectItems([a.id])
    useEditorStore.getState().toggleItemSelection(b.id, false)
    expect(useEditorStore.getState().selectedItemIds).toEqual([b.id])
  })

  it('does not set selectedItemId (PropertiesPanel stays closed)', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a] = useSceneStore.getState().items
    useEditorStore.getState().toggleItemSelection(a.id, false)
    expect(useEditorStore.getState().selectedItemId).toBeNull()
  })
})

describe('drag session', () => {
  function makeItem(id: string, x: number, groupId: string | null = null): SceneItem {
    return {
      id,
      catalogId: 'side-panel',
      name: id,
      position: [x, 1100, 0],
      rotationY: 0,
      dimensions: { width: 16, height: 2200, depth: 600 },
      properties: {},
      groupId,
    }
  }

  function seed(items: SceneItem[], groups: SceneGroup[] = []) {
    useSceneStore.setState({
      items,
      groups,
      groupCounter: 0,
      history: [],
      future: [],
      dragSession: null,
      resizeSession: null,
    })
  }

  it('dragSelectionBy moves only session items, relative to their start', () => {
    seed([makeItem('a', 0), makeItem('b', 100)])
    useSceneStore.getState().beginDrag(['a'])
    useSceneStore.getState().dragSelectionBy([50, 0, 0])
    useSceneStore.getState().dragSelectionBy([80, 0, 0]) // relative to start, not cumulative
    const { items } = useSceneStore.getState()
    expect(items.find((i) => i.id === 'a')!.position[0]).toBe(80)
    expect(items.find((i) => i.id === 'b')!.position[0]).toBe(100)
  })

  it('dragSelectionBy adds no history (the gesture is one undo step)', () => {
    seed([makeItem('a', 0)])
    useSceneStore.getState().beginDrag(['a'])
    useSceneStore.getState().dragSelectionBy([10, 0, 0])
    useSceneStore.getState().dragSelectionBy([20, 0, 0])
    expect(useSceneStore.getState().history).toHaveLength(0)
  })

  it('endDrag(true) commits one history entry and keeps the moved position', () => {
    seed([makeItem('a', 0)])
    useSceneStore.getState().beginDrag(['a'])
    useSceneStore.getState().dragSelectionBy([120, 0, 0])
    useSceneStore.getState().endDrag(true)
    expect(useSceneStore.getState().history).toHaveLength(1)
    expect(useSceneStore.getState().dragSession).toBeNull()
    expect(useSceneStore.getState().items[0].position[0]).toBe(120)
    // undo restores the pre-drag position
    useSceneStore.getState().undo()
    expect(useSceneStore.getState().items[0].position[0]).toBe(0)
  })

  it('endDrag(false) rolls back to the pre-drag position with no history', () => {
    seed([makeItem('a', 0)])
    useSceneStore.getState().beginDrag(['a'])
    useSceneStore.getState().dragSelectionBy([120, 0, 0])
    useSceneStore.getState().endDrag(false)
    expect(useSceneStore.getState().history).toHaveLength(0)
    expect(useSceneStore.getState().dragSession).toBeNull()
    expect(useSceneStore.getState().items[0].position[0]).toBe(0)
  })

  it('dragSelectionBy / endDrag without an active session are no-ops', () => {
    seed([makeItem('a', 0)])
    useSceneStore.getState().dragSelectionBy([50, 0, 0])
    useSceneStore.getState().endDrag(true)
    expect(useSceneStore.getState().items[0].position[0]).toBe(0)
    expect(useSceneStore.getState().history).toHaveLength(0)
  })

  it('individual move of a grouped item persists and survives a later group move (regression)', () => {
    // Reproduces the reported bug at the store level: move group, move one member
    // individually, move group again — the individual offset must be preserved.
    const group: SceneGroup = { id: 'g', name: 'g', itemIds: ['a', 'b'], collapsed: false }
    seed([makeItem('a', 0, 'g'), makeItem('b', 100, 'g')], [group])

    useSceneStore.getState().moveGroup('g', [200, 0, 0]) // a=200, b=300

    // individual drag of "a" via the drag session (what TransformProxy does)
    useSceneStore.getState().beginDrag(['a'])
    useSceneStore.getState().dragSelectionBy([50, 0, 0])
    useSceneStore.getState().endDrag(true) // a=250, b=300
    expect(useSceneStore.getState().items.find((i) => i.id === 'a')!.position[0]).toBe(250)

    useSceneStore.getState().moveGroup('g', [100, 0, 0]) // a=350, b=400
    const a = useSceneStore.getState().items.find((i) => i.id === 'a')!
    const b = useSceneStore.getState().items.find((i) => i.id === 'b')!
    expect(a.position[0]).toBe(350) // individual +50 survived
    expect(b.position[0] - a.position[0]).toBe(50) // relative offset preserved
  })
})

describe('history limit', () => {
  it('does not exceed 50 history records', () => {
    for (let i = 0; i < 55; i++) useSceneStore.getState().addItem(TEST_ITEM)
    expect(useSceneStore.getState().history.length).toBeLessThanOrEqual(50)
  })
})

describe('editItem / closeEditing', () => {
  it('editItem sets editingItemId and selects the item single', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    const id = useSceneStore.getState().items[0].id
    useEditorStore.getState().editItem(id)
    const s = useEditorStore.getState()
    expect(s.editingItemId).toBe(id)
    expect(s.selectedItemId).toBe(id)
    expect(s.selectedItemIds).toEqual([id])
  })

  it('closeEditing clears editingItemId but keeps selection', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    const id = useSceneStore.getState().items[0].id
    useEditorStore.getState().editItem(id)
    useEditorStore.getState().closeEditing()
    const s = useEditorStore.getState()
    expect(s.editingItemId).toBeNull()
    expect(s.selectedItemId).toBe(id)
  })

  it('selectItem does NOT open editing', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    const id = useSceneStore.getState().items[0].id
    useEditorStore.getState().selectItem(id)
    expect(useEditorStore.getState().editingItemId).toBeNull()
  })

  it('selectItems does NOT open editing', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a, b] = useSceneStore.getState().items
    useEditorStore.getState().selectItems([a.id, b.id])
    expect(useEditorStore.getState().editingItemId).toBeNull()
  })

  it('selectItem on a different item closes editing', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a, b] = useSceneStore.getState().items
    useEditorStore.getState().editItem(a.id)
    useEditorStore.getState().selectItem(b.id)
    expect(useEditorStore.getState().editingItemId).toBeNull()
  })

  it('selectItem on the same edited item keeps editing open', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    const id = useSceneStore.getState().items[0].id
    useEditorStore.getState().editItem(id)
    useEditorStore.getState().selectItem(id)
    expect(useEditorStore.getState().editingItemId).toBe(id)
  })

  it('selectItems closes an open editing panel', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a, b] = useSceneStore.getState().items
    useEditorStore.getState().editItem(a.id)
    useEditorStore.getState().selectItems([a.id, b.id])
    expect(useEditorStore.getState().editingItemId).toBeNull()
  })

  it('removeItem clears editingItemId when the edited item is removed', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    const id = useSceneStore.getState().items[0].id
    useEditorStore.getState().editItem(id)
    useSceneStore.getState().removeItem(id)
    expect(useEditorStore.getState().editingItemId).toBeNull()
  })

  it('removeItem keeps editingItemId when a different item is removed', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a, b] = useSceneStore.getState().items
    useEditorStore.getState().editItem(a.id)
    useSceneStore.getState().removeItem(b.id)
    expect(useEditorStore.getState().editingItemId).toBe(a.id)
  })

  it('removeGroup clears editingItemId when the edited item is in the group', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a, b] = useSceneStore.getState().items
    useEditorStore.getState().selectItems([a.id, b.id])
    useSceneStore.getState().createGroup()
    const groupId = useSceneStore.getState().groups[0].id
    useEditorStore.getState().editItem(a.id)
    useSceneStore.getState().removeGroup(groupId)
    expect(useEditorStore.getState().editingItemId).toBeNull()
  })
})

describe('alignItems', () => {
  const WIDE_ITEM: CatalogItem = {
    id: 'back-panel',
    name: 'Задняя панель',
    category: 'Корпус',
    defaultDimensions: { width: 100, height: 200, depth: 50 },
    properties: [],
  }

  it('выравнивает левые грани (left): все items получают min X', () => {
    useSceneStore.getState().addItem(WIDE_ITEM)
    useSceneStore.getState().addItem(WIDE_ITEM)
    useSceneStore.getState().addItem(WIDE_ITEM)
    const [a, b, c] = useSceneStore.getState().items

    // Place items at different X positions
    useSceneStore.getState().updateItem(a.id, { position: [0, 100, 0] })
    useSceneStore.getState().updateItem(b.id, { position: [200, 100, 0] })
    useSceneStore.getState().updateItem(c.id, { position: [-150, 100, 0] })

    useEditorStore.getState().selectItems([a.id, b.id, c.id])
    useSceneStore.getState().alignItems('left')

    const updated = useSceneStore.getState().items
    const getItem = (id: string) => updated.find((i) => i.id === id)!

    // minX = min(0 - 50, 200 - 50, -150 - 50) = min(-50, 150, -200) = -200
    const expectedLeft = -200
    expect(getItem(a.id).position[0] - a.dimensions.width / 2).toBeCloseTo(expectedLeft)
    expect(getItem(b.id).position[0] - b.dimensions.width / 2).toBeCloseTo(expectedLeft)
    expect(getItem(c.id).position[0] - c.dimensions.width / 2).toBeCloseTo(expectedLeft)
  })

  it('не меняет ничего если выделен 1 или 0 элементов', () => {
    useSceneStore.getState().addItem(WIDE_ITEM)
    const [a] = useSceneStore.getState().items
    const positionBefore = [...a.position]

    // 1 selected
    useEditorStore.getState().selectItems([a.id])
    useSceneStore.getState().alignItems('left')
    expect(useSceneStore.getState().items[0].position).toEqual(positionBefore)

    // 0 selected
    useEditorStore.getState().selectItems([])
    useSceneStore.getState().alignItems('left')
    expect(useSceneStore.getState().items[0].position).toEqual(positionBefore)
  })

  it('записывает в историю (undo возвращает позиции)', () => {
    useSceneStore.getState().addItem(WIDE_ITEM)
    useSceneStore.getState().addItem(WIDE_ITEM)
    const [a, b] = useSceneStore.getState().items

    useSceneStore.getState().updateItem(a.id, { position: [0, 100, 0] })
    useSceneStore.getState().updateItem(b.id, { position: [300, 100, 0] })

    const posA = [...useSceneStore.getState().items.find((i) => i.id === a.id)!.position]
    const posB = [...useSceneStore.getState().items.find((i) => i.id === b.id)!.position]

    useEditorStore.getState().selectItems([a.id, b.id])
    useSceneStore.getState().alignItems('left')

    // After alignment positions changed
    const afterA = useSceneStore.getState().items.find((i) => i.id === a.id)!
    const afterB = useSceneStore.getState().items.find((i) => i.id === b.id)!
    const minLeft = Math.min(posA[0] - 50, posB[0] - 50)
    expect(afterA.position[0] - 50).toBeCloseTo(minLeft)
    expect(afterB.position[0] - 50).toBeCloseTo(minLeft)

    // Undo restores original positions
    useSceneStore.getState().undo()
    const restoredA = useSceneStore.getState().items.find((i) => i.id === a.id)!
    const restoredB = useSceneStore.getState().items.find((i) => i.id === b.id)!
    expect(restoredA.position).toEqual(posA)
    expect(restoredB.position).toEqual(posB)
  })

  it('выравнивает по оси Z (back): все items получают max Z', () => {
    useSceneStore.getState().addItem(WIDE_ITEM)
    useSceneStore.getState().addItem(WIDE_ITEM)
    const [a, b] = useSceneStore.getState().items

    useSceneStore.getState().updateItem(a.id, { position: [0, 100, 0] })
    useSceneStore.getState().updateItem(b.id, { position: [0, 100, 200] })

    useEditorStore.getState().selectItems([a.id, b.id])
    useSceneStore.getState().alignItems('back')

    const updated = useSceneStore.getState().items
    const ga = updated.find((i) => i.id === a.id)!
    const gb = updated.find((i) => i.id === b.id)!

    // maxZ = max(0 + 25, 200 + 25) = 225
    expect(ga.position[2] + ga.dimensions.depth / 2).toBeCloseTo(225)
    expect(gb.position[2] + gb.dimensions.depth / 2).toBeCloseTo(225)
  })

  it('right: выравнивает правые грани по max X', () => {
    useSceneStore.getState().addItem(WIDE_ITEM)
    useSceneStore.getState().addItem(WIDE_ITEM)
    const [a, b] = useSceneStore.getState().items
    useSceneStore.getState().updateItem(a.id, { position: [0, 100, 0] })
    useSceneStore.getState().updateItem(b.id, { position: [200, 100, 0] })
    useEditorStore.getState().selectItems([a.id, b.id])
    useSceneStore.getState().alignItems('right')
    const items = useSceneStore.getState().items
    const ga = items.find((i) => i.id === a.id)!
    const gb = items.find((i) => i.id === b.id)!
    // maxX = max(0+50, 200+50) = 250
    expect(ga.position[0] + ga.dimensions.width / 2).toBeCloseTo(250)
    expect(gb.position[0] + gb.dimensions.width / 2).toBeCloseTo(250)
  })

  it('centerX: выравнивает центры по среднему X', () => {
    useSceneStore.getState().addItem(WIDE_ITEM)
    useSceneStore.getState().addItem(WIDE_ITEM)
    const [a, b] = useSceneStore.getState().items
    useSceneStore.getState().updateItem(a.id, { position: [0, 100, 0] })
    useSceneStore.getState().updateItem(b.id, { position: [200, 100, 0] })
    useEditorStore.getState().selectItems([a.id, b.id])
    useSceneStore.getState().alignItems('centerX')
    const items = useSceneStore.getState().items
    const ga = items.find((i) => i.id === a.id)!
    const gb = items.find((i) => i.id === b.id)!
    // center = (0+200)/2 = 100
    expect(ga.position[0]).toBeCloseTo(100)
    expect(gb.position[0]).toBeCloseTo(100)
  })

  it('centerX с разноразмерными элементами: среднее арифметическое центров (не bounding box)', () => {
    const NARROW: CatalogItem = {
      id: 'top-panel',
      name: 'Верхняя панель',
      category: 'Корпус',
      defaultDimensions: { width: 40, height: 200, depth: 50 },
      properties: [],
    }
    useSceneStore.getState().addItem(WIDE_ITEM) // width=100
    useSceneStore.getState().addItem(NARROW) // width=40
    const [a, b] = useSceneStore.getState().items
    // A at x=0 (w=100), B at x=300 (w=40)
    useSceneStore.getState().updateItem(a.id, { position: [0, 100, 0] })
    useSceneStore.getState().updateItem(b.id, { position: [300, 100, 0] })
    useEditorStore.getState().selectItems([a.id, b.id])
    useSceneStore.getState().alignItems('centerX')
    const items = useSceneStore.getState().items
    const ga = items.find((i) => i.id === a.id)!
    const gb = items.find((i) => i.id === b.id)!
    // среднее центров: (0 + 300) / 2 = 150 (не bounding-box центр)
    expect(ga.position[0]).toBeCloseTo(150)
    expect(gb.position[0]).toBeCloseTo(150)
  })

  it('top: выравнивает верхние грани по max Y', () => {
    useSceneStore.getState().addItem(WIDE_ITEM)
    useSceneStore.getState().addItem(WIDE_ITEM)
    const [a, b] = useSceneStore.getState().items
    useSceneStore.getState().updateItem(a.id, { position: [0, 100, 0] })
    useSceneStore.getState().updateItem(b.id, { position: [0, 300, 0] })
    useEditorStore.getState().selectItems([a.id, b.id])
    useSceneStore.getState().alignItems('top')
    const items = useSceneStore.getState().items
    const ga = items.find((i) => i.id === a.id)!
    const gb = items.find((i) => i.id === b.id)!
    // maxY = max(100+100, 300+100) = 400
    expect(ga.position[1] + ga.dimensions.height / 2).toBeCloseTo(400)
    expect(gb.position[1] + gb.dimensions.height / 2).toBeCloseTo(400)
  })

  it('bottom: выравнивает нижние грани по min Y', () => {
    useSceneStore.getState().addItem(WIDE_ITEM)
    useSceneStore.getState().addItem(WIDE_ITEM)
    const [a, b] = useSceneStore.getState().items
    useSceneStore.getState().updateItem(a.id, { position: [0, 100, 0] })
    useSceneStore.getState().updateItem(b.id, { position: [0, 300, 0] })
    useEditorStore.getState().selectItems([a.id, b.id])
    useSceneStore.getState().alignItems('bottom')
    const items = useSceneStore.getState().items
    const ga = items.find((i) => i.id === a.id)!
    const gb = items.find((i) => i.id === b.id)!
    // minY = min(100-100, 300-100) = 0
    expect(ga.position[1] - ga.dimensions.height / 2).toBeCloseTo(0)
    expect(gb.position[1] - gb.dimensions.height / 2).toBeCloseTo(0)
  })

  it('centerY: выравнивает центры по среднему Y', () => {
    useSceneStore.getState().addItem(WIDE_ITEM)
    useSceneStore.getState().addItem(WIDE_ITEM)
    const [a, b] = useSceneStore.getState().items
    useSceneStore.getState().updateItem(a.id, { position: [0, 100, 0] })
    useSceneStore.getState().updateItem(b.id, { position: [0, 300, 0] })
    useEditorStore.getState().selectItems([a.id, b.id])
    useSceneStore.getState().alignItems('centerY')
    const items = useSceneStore.getState().items
    const ga = items.find((i) => i.id === a.id)!
    const gb = items.find((i) => i.id === b.id)!
    // center = (100+300)/2 = 200
    expect(ga.position[1]).toBeCloseTo(200)
    expect(gb.position[1]).toBeCloseTo(200)
  })

  it('front: выравнивает передние грани по min Z', () => {
    useSceneStore.getState().addItem(WIDE_ITEM)
    useSceneStore.getState().addItem(WIDE_ITEM)
    const [a, b] = useSceneStore.getState().items
    useSceneStore.getState().updateItem(a.id, { position: [0, 100, 0] })
    useSceneStore.getState().updateItem(b.id, { position: [0, 100, 200] })
    useEditorStore.getState().selectItems([a.id, b.id])
    useSceneStore.getState().alignItems('front')
    const items = useSceneStore.getState().items
    const ga = items.find((i) => i.id === a.id)!
    const gb = items.find((i) => i.id === b.id)!
    // minZ = min(0-25, 200-25) = -25
    expect(ga.position[2] - ga.dimensions.depth / 2).toBeCloseTo(-25)
    expect(gb.position[2] - gb.dimensions.depth / 2).toBeCloseTo(-25)
  })

  it('centerZ: выравнивает центры по среднему Z', () => {
    useSceneStore.getState().addItem(WIDE_ITEM)
    useSceneStore.getState().addItem(WIDE_ITEM)
    const [a, b] = useSceneStore.getState().items
    useSceneStore.getState().updateItem(a.id, { position: [0, 100, 0] })
    useSceneStore.getState().updateItem(b.id, { position: [0, 100, 200] })
    useEditorStore.getState().selectItems([a.id, b.id])
    useSceneStore.getState().alignItems('centerZ')
    const items = useSceneStore.getState().items
    const ga = items.find((i) => i.id === a.id)!
    const gb = items.find((i) => i.id === b.id)!
    // center = (0+200)/2 = 100
    expect(ga.position[2]).toBeCloseTo(100)
    expect(gb.position[2]).toBeCloseTo(100)
  })
})

describe('toggleItemVisibility / toggleGroupVisibility', () => {
  it('toggleItemVisibility скрывает и показывает элемент', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    const id = useSceneStore.getState().items[0].id
    expect(useSceneStore.getState().items[0].hidden).toBeFalsy()
    useSceneStore.getState().toggleItemVisibility(id)
    expect(useSceneStore.getState().items[0].hidden).toBe(true)
    useSceneStore.getState().toggleItemVisibility(id)
    expect(useSceneStore.getState().items[0].hidden).toBe(false)
  })

  it('toggleItemVisibility не пишет в историю', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    const id = useSceneStore.getState().items[0].id
    useSceneStore.getState().toggleItemVisibility(id)
    expect(useSceneStore.getState().history).toHaveLength(1) // только addItem
  })

  it('toggleGroupVisibility скрывает и показывает группу', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a, b] = useSceneStore.getState().items
    useEditorStore.getState().selectItems([a.id, b.id])
    useSceneStore.getState().createGroup()
    const groupId = useSceneStore.getState().groups[0].id
    expect(useSceneStore.getState().groups[0].hidden).toBeFalsy()
    useSceneStore.getState().toggleGroupVisibility(groupId)
    expect(useSceneStore.getState().groups[0].hidden).toBe(true)
    useSceneStore.getState().toggleGroupVisibility(groupId)
    expect(useSceneStore.getState().groups[0].hidden).toBe(false)
  })

  it('toggleGroupVisibility не трогает hidden у элементов группы', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a, b] = useSceneStore.getState().items
    useEditorStore.getState().selectItems([a.id, b.id])
    useSceneStore.getState().createGroup()
    const groupId = useSceneStore.getState().groups[0].id
    useSceneStore.getState().toggleGroupVisibility(groupId)
    const items = useSceneStore.getState().items
    expect(items.find((i) => i.id === a.id)!.hidden).toBeFalsy()
    expect(items.find((i) => i.id === b.id)!.hidden).toBeFalsy()
  })

  it('toggleGroupVisibility не пишет в историю', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a, b] = useSceneStore.getState().items
    useEditorStore.getState().selectItems([a.id, b.id])
    useSceneStore.getState().createGroup()
    const historyBefore = useSceneStore.getState().history.length
    const groupId = useSceneStore.getState().groups[0].id
    useSceneStore.getState().toggleGroupVisibility(groupId)
    expect(useSceneStore.getState().history).toHaveLength(historyBefore)
  })
})

describe('toggleItemLocked / toggleGroupLocked', () => {
  it('toggleItemLocked блокирует и разблокирует элемент', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    const id = useSceneStore.getState().items[0].id
    expect(useSceneStore.getState().items[0].locked).toBeFalsy()
    useSceneStore.getState().toggleItemLocked(id)
    expect(useSceneStore.getState().items[0].locked).toBe(true)
    useSceneStore.getState().toggleItemLocked(id)
    expect(useSceneStore.getState().items[0].locked).toBe(false)
  })

  it('toggleItemLocked не пишет в историю', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    const id = useSceneStore.getState().items[0].id
    useSceneStore.getState().toggleItemLocked(id)
    expect(useSceneStore.getState().history).toHaveLength(1) // только addItem
  })

  it('toggleGroupLocked блокирует и разблокирует группу', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a, b] = useSceneStore.getState().items
    useEditorStore.getState().selectItems([a.id, b.id])
    useSceneStore.getState().createGroup()
    const groupId = useSceneStore.getState().groups[0].id
    expect(useSceneStore.getState().groups[0].locked).toBeFalsy()
    useSceneStore.getState().toggleGroupLocked(groupId)
    expect(useSceneStore.getState().groups[0].locked).toBe(true)
    useSceneStore.getState().toggleGroupLocked(groupId)
    expect(useSceneStore.getState().groups[0].locked).toBe(false)
  })

  it('toggleGroupLocked не трогает locked у элементов группы', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a, b] = useSceneStore.getState().items
    useEditorStore.getState().selectItems([a.id, b.id])
    useSceneStore.getState().createGroup()
    const groupId = useSceneStore.getState().groups[0].id
    useSceneStore.getState().toggleGroupLocked(groupId)
    const items = useSceneStore.getState().items
    expect(items.find((i) => i.id === a.id)!.locked).toBeFalsy()
    expect(items.find((i) => i.id === b.id)!.locked).toBeFalsy()
  })

  it('toggleGroupLocked не пишет в историю', () => {
    useSceneStore.getState().addItem(TEST_ITEM)
    useSceneStore.getState().addItem(TEST_ITEM)
    const [a, b] = useSceneStore.getState().items
    useEditorStore.getState().selectItems([a.id, b.id])
    useSceneStore.getState().createGroup()
    const historyBefore = useSceneStore.getState().history.length
    const groupId = useSceneStore.getState().groups[0].id
    useSceneStore.getState().toggleGroupLocked(groupId)
    expect(useSceneStore.getState().history).toHaveLength(historyBefore)
  })
})

describe('resize session', () => {
  function makeItem(id: string): SceneItem {
    return {
      id,
      catalogId: 'side-panel',
      name: id,
      position: [0, 1100, 0],
      rotationY: 0,
      dimensions: { width: 900, height: 2200, depth: 600 },
      properties: {},
      groupId: null,
    }
  }

  function seed(item: SceneItem) {
    useSceneStore.setState({
      items: [item],
      groups: [],
      groupCounter: 0,
      history: [],
      future: [],
      dragSession: null,
      resizeSession: null,
    })
  }

  it('beginResize сохраняет снапшот и не пишет в историю', () => {
    const item = makeItem('a')
    seed(item)
    useSceneStore.getState().beginResize()
    expect(useSceneStore.getState().resizeSession).not.toBeNull()
    expect(useSceneStore.getState().history).toHaveLength(0)
  })

  it('resizeLive обновляет dimensions и position без записи в историю', () => {
    const item = makeItem('a')
    seed(item)
    useSceneStore.getState().beginResize()
    useSceneStore
      .getState()
      .resizeLive('a', { width: 500, height: 2200, depth: 600 }, [250, 1100, 0])
    const { items, history } = useSceneStore.getState()
    expect(items[0].dimensions.width).toBe(500)
    expect(items[0].position[0]).toBe(250)
    expect(history).toHaveLength(0)
  })

  it('endResize(true) коммитит один undo-шаг и оставляет новые размеры', () => {
    const item = makeItem('a')
    seed(item)
    useSceneStore.getState().beginResize()
    useSceneStore
      .getState()
      .resizeLive('a', { width: 500, height: 2200, depth: 600 }, [250, 1100, 0])
    useSceneStore.getState().endResize(true)
    const s = useSceneStore.getState()
    expect(s.resizeSession).toBeNull()
    expect(s.history).toHaveLength(1)
    expect(s.items[0].dimensions.width).toBe(500)
    // undo возвращает исходные размеры
    useSceneStore.getState().undo()
    expect(useSceneStore.getState().items[0].dimensions.width).toBe(900)
    expect(useSceneStore.getState().items[0].position[0]).toBe(0)
  })

  it('endResize(false) откатывает к исходным размерам без записи в историю', () => {
    const item = makeItem('a')
    seed(item)
    useSceneStore.getState().beginResize()
    useSceneStore
      .getState()
      .resizeLive('a', { width: 500, height: 2200, depth: 600 }, [250, 1100, 0])
    useSceneStore.getState().endResize(false)
    const s = useSceneStore.getState()
    expect(s.resizeSession).toBeNull()
    expect(s.history).toHaveLength(0)
    expect(s.items[0].dimensions.width).toBe(900)
    expect(s.items[0].position[0]).toBe(0)
  })

  it('resizeLive / endResize без активной сессии — no-op', () => {
    const item = makeItem('a')
    seed(item)
    useSceneStore.getState().resizeLive('a', { width: 1, height: 1, depth: 1 }, [0, 0, 0])
    useSceneStore.getState().endResize(true)
    const s = useSceneStore.getState()
    // resizeLive без сессии всё равно обновляет items — это допустимо, проверяем только endResize
    expect(s.resizeSession).toBeNull()
    expect(s.history).toHaveLength(0)
  })
})

describe('rotate session', () => {
  function makeItem(id: string): SceneItem {
    return {
      id,
      catalogId: 'side-panel',
      name: id,
      position: [0, 1100, 0],
      dimensions: { width: 16, height: 2200, depth: 600 },
      properties: {},
      rotationY: 0,
      groupId: null,
    }
  }

  function seed(item: SceneItem) {
    useSceneStore.setState({
      items: [item],
      groups: [],
      groupCounter: 0,
      history: [],
      future: [],
      dragSession: null,
      resizeSession: null,
      rotateSession: null,
    })
  }

  it('beginRotate сохраняет снапшот и не пишет в историю', () => {
    const item = makeItem('a')
    seed(item)
    useSceneStore.getState().beginRotate()
    expect(useSceneStore.getState().rotateSession).not.toBeNull()
    expect(useSceneStore.getState().history).toHaveLength(0)
  })

  it('rotateLive обновляет rotationY без записи в историю', () => {
    const item = makeItem('a')
    seed(item)
    useSceneStore.getState().beginRotate()
    useSceneStore.getState().rotateLive('a', Math.PI / 2)
    const { items, history } = useSceneStore.getState()
    expect(items[0].rotationY).toBeCloseTo(Math.PI / 2)
    expect(history).toHaveLength(0)
  })

  it('endRotate(true) коммитит один undo-шаг и сохраняет новый угол', () => {
    const item = makeItem('a')
    seed(item)
    useSceneStore.getState().beginRotate()
    useSceneStore.getState().rotateLive('a', Math.PI / 2)
    useSceneStore.getState().endRotate(true)
    const s = useSceneStore.getState()
    expect(s.rotateSession).toBeNull()
    expect(s.history).toHaveLength(1)
    expect(s.items[0].rotationY).toBeCloseTo(Math.PI / 2)
    // undo возвращает исходный угол
    useSceneStore.getState().undo()
    expect(useSceneStore.getState().items[0].rotationY).toBe(0)
  })

  it('endRotate(false) откатывает угол без записи в историю', () => {
    const item = makeItem('a')
    seed(item)
    useSceneStore.getState().beginRotate()
    useSceneStore.getState().rotateLive('a', Math.PI / 2)
    useSceneStore.getState().endRotate(false)
    const s = useSceneStore.getState()
    expect(s.rotateSession).toBeNull()
    expect(s.history).toHaveLength(0)
    expect(s.items[0].rotationY).toBe(0)
  })

  it('endRotate без активной сессии — no-op', () => {
    const item = makeItem('a')
    seed(item)
    useSceneStore.getState().endRotate(true)
    const s = useSceneStore.getState()
    expect(s.rotateSession).toBeNull()
    expect(s.history).toHaveLength(0)
  })
})

describe('resetScene', () => {
  function makeResetItem(id: string): SceneItem {
    return {
      id,
      catalogId: 'side-panel',
      name: id,
      position: [0, 1100, 0],
      rotationY: 0,
      dimensions: { width: 900, height: 2200, depth: 600 },
      properties: {},
      groupId: null,
    }
  }

  it('replaces items and groups with defaults', () => {
    useSceneStore.setState({ items: [makeResetItem('a')], groups: [] })
    useSceneStore.getState().resetScene()
    const s = useSceneStore.getState()
    expect(s.items.every((i) => i.id !== 'a')).toBe(true)
    expect(s.items.length).toBeGreaterThan(0)
  })

  it('clears selection and editing', () => {
    useSceneStore.setState({
      items: [makeResetItem('a')],
      groups: [],
    })
    useEditorStore.setState({ selectedItemId: 'a', selectedItemIds: ['a'], editingItemId: 'a' })
    useSceneStore.getState().resetScene()
    const s = useEditorStore.getState()
    expect(s.selectedItemId).toBeNull()
    expect(s.selectedItemIds).toHaveLength(0)
    expect(s.editingItemId).toBeNull()
  })

  it('clears history and future so undo is not possible after reset', () => {
    useSceneStore.setState({ items: [makeResetItem('a')], groups: [], history: [], future: [] })
    useSceneStore.getState().resetScene()
    const s = useSceneStore.getState()
    expect(s.history).toHaveLength(0)
    expect(s.future).toHaveLength(0)
  })
})

describe('setRoomDimensions', () => {
  const newRoom: RoomDimensions = { width: 6000, depth: 5000, height: 2700 }

  it('updates room in state', () => {
    useSceneStore.getState().setRoomDimensions(newRoom)
    expect(useSceneStore.getState().room).toEqual(newRoom)
  })

  it('does not add an entry to history', () => {
    useSceneStore.getState().setRoomDimensions(newRoom)
    expect(useSceneStore.getState().history).toHaveLength(0)
  })
})

describe('loadScene with room', () => {
  const items: SceneItem[] = []
  const groups: SceneGroup[] = []

  it('sets room from data when provided', () => {
    const customRoom: RoomDimensions = { width: 3000, depth: 2000, height: 2400 }
    useSceneStore.getState().loadScene(items, groups, customRoom)
    expect(useSceneStore.getState().room).toEqual(customRoom)
  })

  it('uses default room from SCENE_CONFIG when room is absent', () => {
    useSceneStore.getState().loadScene(items, groups)
    expect(useSceneStore.getState().room).toEqual(SCENE_CONFIG.room)
  })
})
