import { describe, expect, it } from 'vitest'
import { buildFlatOrder, buildLayerRows, rangeSelection } from './layerTree'
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

function group(id: string, itemIds: string[], collapsed = false): SceneGroup {
  return { id, name: id, itemIds, collapsed }
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
