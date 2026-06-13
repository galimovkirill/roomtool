import { describe, it, expect } from 'vitest'
import { isItemEffectivelyLocked } from './locked'
import type { SceneItem, SceneGroup } from '@/types'

function makeItem(id: string, groupId: string | null = null, locked = false): SceneItem {
  return {
    id,
    catalogId: 'side-panel',
    name: id,
    position: [0, 0, 0],
    rotationY: 0,
    dimensions: { width: 100, height: 100, depth: 100 },
    properties: {},
    groupId,
    locked,
  }
}

function makeGroup(id: string, parentGroupId: string | null = null, locked = false): SceneGroup {
  return { id, name: id, itemIds: [], collapsed: false, locked, parentGroupId }
}

describe('isItemEffectivelyLocked', () => {
  it('unlocked item with no group → false', () => {
    expect(isItemEffectivelyLocked(makeItem('a'), [])).toBe(false)
  })

  it('item.locked=true → true', () => {
    expect(isItemEffectivelyLocked(makeItem('a', null, true), [])).toBe(true)
  })

  it('item in a locked group → true', () => {
    const item = makeItem('a', 'g1')
    const group = makeGroup('g1', null, true)
    expect(isItemEffectivelyLocked(item, [group])).toBe(true)
  })

  it('item in an unlocked group → false', () => {
    const item = makeItem('a', 'g1')
    const group = makeGroup('g1', null, false)
    expect(isItemEffectivelyLocked(item, [group])).toBe(false)
  })

  it('item in nested group where ancestor is locked → true', () => {
    const item = makeItem('a', 'g2')
    const g1 = makeGroup('g1', null, true)
    const g2 = makeGroup('g2', 'g1', false)
    expect(isItemEffectivelyLocked(item, [g1, g2])).toBe(true)
  })

  it('item in nested group where no ancestor is locked → false', () => {
    const item = makeItem('a', 'g2')
    const g1 = makeGroup('g1', null, false)
    const g2 = makeGroup('g2', 'g1', false)
    expect(isItemEffectivelyLocked(item, [g1, g2])).toBe(false)
  })

  it('item.locked=true and group also locked → true', () => {
    const item = makeItem('a', 'g1', true)
    const group = makeGroup('g1', null, true)
    expect(isItemEffectivelyLocked(item, [group])).toBe(true)
  })

  it('item with missing group reference → falls back to item.locked', () => {
    const item = makeItem('a', 'ghost-group')
    expect(isItemEffectivelyLocked(item, [])).toBe(false)
  })
})
