import { describe, expect, it } from 'vitest'
import {
  buildFlatOrder,
  buildLayerRows,
  buildLayerTree,
  flattenLayerTree,
  getAllItemIdsInGroup,
  rangeSelection,
} from './layerTree'
import type { SceneGroup, SceneItem } from '@/types'

function item(id: string, groupId: string | null = null): SceneItem {
  return {
    id,
    catalogId: 'side-panel',
    name: id,
    position: [0, 0, 0],
    rotationY: 0,
    dimensions: { width: 1, height: 1, depth: 1 },
    properties: {},
    groupId,
  }
}

function group(
  id: string,
  itemIds: string[],
  collapsed = false,
  parentGroupId: string | null = null
): SceneGroup {
  return { id, name: id, itemIds, collapsed, parentGroupId: parentGroupId ?? undefined }
}

describe('buildLayerRows', () => {
  it('returns no rows for an empty scene', () => {
    expect(buildLayerRows([], [])).toEqual([])
  })

  it('lists ungrouped items in reverse order (last added first)', () => {
    const rows = buildLayerRows([item('a'), item('b'), item('c')], [])
    expect(rows.map((r) => (r.type === 'item' ? r.item.id : `group:${r.group.id}`))).toEqual([
      'c',
      'b',
      'a',
    ])
  })

  it('collapses grouped items into a single group row at the first-seen position', () => {
    const items = [item('a', 'g1'), item('b', 'g1'), item('c')]
    const rows = buildLayerRows(items, [group('g1', ['a', 'b'])])
    expect(rows).toHaveLength(2)
    expect(rows[0]).toEqual({ type: 'item', item: items[2] })
    expect(rows[1].type).toBe('group')
    expect(rows[1].type === 'group' && rows[1].group.id).toBe('g1')
  })

  it('skips items whose group definition is missing', () => {
    const rows = buildLayerRows([item('a', 'ghost')], [])
    expect(rows).toEqual([])
  })

  it('emits one row per group regardless of member count', () => {
    const items = [item('a', 'g1'), item('b', 'g1'), item('c', 'g1')]
    const rows = buildLayerRows(items, [group('g1', ['a', 'b', 'c'])])
    expect(rows).toHaveLength(1)
    expect(rows[0].type).toBe('group')
  })
})

describe('buildFlatOrder', () => {
  it('passes ungrouped items through in row order', () => {
    const rows = buildLayerRows([item('a'), item('b')], [])
    expect(buildFlatOrder(rows)).toEqual(['b', 'a'])
  })

  it('expands an open group into its member ids', () => {
    const items = [item('a', 'g1'), item('b', 'g1'), item('c')]
    const rows = buildLayerRows(items, [group('g1', ['a', 'b'])])
    expect(buildFlatOrder(rows)).toEqual(['c', 'a', 'b'])
  })

  it('contributes nothing for a collapsed group (hidden members not selectable)', () => {
    const items = [item('a', 'g1'), item('b', 'g1'), item('c')]
    const rows = buildLayerRows(items, [group('g1', ['a', 'b'], true)])
    expect(buildFlatOrder(rows)).toEqual(['c'])
  })
})

describe('buildLayerTree', () => {
  it('returns empty tree for empty scene', () => {
    expect(buildLayerTree([], [])).toEqual([])
  })

  it('lists ungrouped items newest-first at root', () => {
    const nodes = buildLayerTree([item('a'), item('b'), item('c')], [])
    expect(nodes.map((n) => (n.type === 'item' ? n.item.id : ''))).toEqual(['c', 'b', 'a'])
  })

  it('nests items inside their group', () => {
    const items = [item('a', 'g1'), item('b', 'g1')]
    const groups = [group('g1', ['a', 'b'])]
    const nodes = buildLayerTree(items, groups)
    expect(nodes).toHaveLength(1)
    expect(nodes[0].type).toBe('group')
    if (nodes[0].type === 'group') {
      expect(nodes[0].children).toHaveLength(2)
    }
  })

  it('places subgroup inside parent group', () => {
    // g1 → [c], g2 (child of g1) → [a, b]
    const items = [item('a', 'g2'), item('b', 'g2'), item('c', 'g1')]
    const groups = [group('g1', ['c']), group('g2', ['a', 'b'], false, 'g1')]
    const nodes = buildLayerTree(items, groups)
    expect(nodes).toHaveLength(1)
    const root = nodes[0]
    expect(root.type).toBe('group')
    if (root.type === 'group') {
      expect(root.group.id).toBe('g1')
      const subgroup = root.children.find((n) => n.type === 'group')
      expect(subgroup).toBeDefined()
      if (subgroup?.type === 'group') expect(subgroup.group.id).toBe('g2')
    }
  })

  it('orders nodes newest-first within a group (subgroup positioned at its newest item)', () => {
    // items added in order: a(g1), b(g2), c(g1) — c is newest in g1; b is in g2 (child)
    const items = [item('a', 'g1'), item('b', 'g2'), item('c', 'g1')]
    const groups = [group('g1', ['a', 'c']), group('g2', ['b'], false, 'g1')]
    const nodes = buildLayerTree(items, groups)
    expect(nodes).toHaveLength(1)
    if (nodes[0].type === 'group') {
      const ids = nodes[0].children.map((n) =>
        n.type === 'item' ? n.item.id : `grp:${n.group.id}`
      )
      // c (index 2) is newest direct item; g2 contains b (index 1) → c first, then g2, then a
      expect(ids).toEqual(['c', 'grp:g2', 'a'])
    }
  })
})

describe('flattenLayerTree', () => {
  it('returns all item ids in display order', () => {
    const items = [item('a', 'g1'), item('b', 'g1'), item('c')]
    const groups = [group('g1', ['a', 'b'])]
    const tree = buildLayerTree(items, groups)
    expect(flattenLayerTree(tree)).toEqual(['c', 'b', 'a'])
  })

  it('excludes items inside a collapsed group', () => {
    const items = [item('a', 'g1'), item('b', 'g1'), item('c')]
    const groups = [group('g1', ['a', 'b'], true)]
    const tree = buildLayerTree(items, groups)
    expect(flattenLayerTree(tree)).toEqual(['c'])
  })

  it('excludes items inside a collapsed nested group', () => {
    const items = [item('a', 'g2'), item('b', 'g1')]
    const groups = [group('g1', ['b']), group('g2', ['a'], true, 'g1')]
    const tree = buildLayerTree(items, groups)
    // g2 is collapsed → a is excluded; b is visible
    expect(flattenLayerTree(tree)).toContain('b')
    expect(flattenLayerTree(tree)).not.toContain('a')
  })
})

describe('getAllItemIdsInGroup', () => {
  it('returns direct members of a flat group', () => {
    const items = [item('a', 'g1'), item('b', 'g1'), item('c')]
    const groups = [group('g1', ['a', 'b'])]
    expect(getAllItemIdsInGroup('g1', items, groups)).toEqual(expect.arrayContaining(['a', 'b']))
    expect(getAllItemIdsInGroup('g1', items, groups)).toHaveLength(2)
  })

  it('recursively collects items from nested subgroups', () => {
    const items = [item('a', 'g2'), item('b', 'g2'), item('c', 'g1')]
    const groups = [group('g1', ['c']), group('g2', ['a', 'b'], false, 'g1')]
    const ids = getAllItemIdsInGroup('g1', items, groups)
    expect(ids).toEqual(expect.arrayContaining(['a', 'b', 'c']))
    expect(ids).toHaveLength(3)
  })

  it('returns only items of the subgroup when called on it directly', () => {
    const items = [item('a', 'g2'), item('b', 'g2'), item('c', 'g1')]
    const groups = [group('g1', ['c']), group('g2', ['a', 'b'], false, 'g1')]
    const ids = getAllItemIdsInGroup('g2', items, groups)
    expect(ids).toEqual(expect.arrayContaining(['a', 'b']))
    expect(ids).not.toContain('c')
  })
})

describe('rangeSelection', () => {
  const order = ['c', 'a', 'b']

  it('returns the inclusive range when anchor precedes the clicked id', () => {
    expect(rangeSelection(order, 'c', 'b')).toEqual(['c', 'a', 'b'])
  })

  it('normalises direction when anchor follows the clicked id', () => {
    expect(rangeSelection(order, 'b', 'c')).toEqual(['c', 'a', 'b'])
  })

  it('returns a single id when anchor equals the clicked id', () => {
    expect(rangeSelection(order, 'a', 'a')).toEqual(['a'])
  })

  it('returns null when the anchor is not visible', () => {
    expect(rangeSelection(order, 'missing', 'b')).toBeNull()
  })

  it('returns null when the clicked id is not visible (e.g. inside a collapsed group)', () => {
    expect(rangeSelection(order, 'c', 'hidden')).toBeNull()
  })
})
