import { describe, it, expect } from 'vitest'
import type { SceneItem } from '@/types'
import { SCENE_CONFIG } from '@/config/scene'
import { computeGroupCenter, groupDragDelta } from './groupTransform'

function makeItem(
  id: string,
  position: [number, number, number],
  dimensions: { width: number; height: number; depth: number }
): SceneItem {
  return {
    id,
    catalogId: 'side-panel',
    name: id,
    position,
    rotationY: 0,
    dimensions,
    properties: {},
    groupId: 'g1',
  }
}

describe('computeGroupCenter', () => {
  it('returns origin for an empty group', () => {
    expect(computeGroupCenter([])).toEqual([0, 0, 0])
  })

  it('returns the item center for a single item', () => {
    const item = makeItem('a', [100, 1100, -50], { width: 16, height: 2200, depth: 600 })
    expect(computeGroupCenter([item])).toEqual([100, 1100, -50])
  })

  it('returns the bounding-box center across several items', () => {
    // Two side panels at x = ±442 spanning y 0..2200 → center [0, 1100, 0]
    const left = makeItem('l', [-442, 1100, 0], { width: 16, height: 2200, depth: 600 })
    const right = makeItem('r', [442, 1100, 0], { width: 16, height: 2200, depth: 600 })
    expect(computeGroupCenter([left, right])).toEqual([0, 1100, 0])
  })

  it('uses outer edges (position ± half-dimension), not just centers', () => {
    // A wide low item next to a narrow tall one
    const wide = makeItem('w', [0, 50, 0], { width: 1000, height: 100, depth: 100 })
    const tall = makeItem('t', [0, 1000, 0], { width: 100, height: 2000, depth: 100 })
    // x: -500..500 → 0 ; y: 0..2000 → 1000 ; z: -50..50 → 0
    expect(computeGroupCenter([wide, tall])).toEqual([0, 1000, 0])
  })
})

describe('groupDragDelta', () => {
  const item = makeItem('a', [0, 1100, 0], { width: 900, height: 2200, depth: 600 })
  const items = [item]

  it('returns the raw displacement when it keeps items inside the room', () => {
    const delta = groupDragDelta([200, 1100, 100], [0, 1100, 0], ['a'], items)
    expect(delta).toEqual([200, 0, 100])
  })

  it('clamps the displacement at the room wall', () => {
    const half = SCENE_CONFIG.room.width / 2
    // Drag far past the +X wall; item right edge must stop at +half
    const delta = groupDragDelta([100000, 1100, 0], [0, 1100, 0], ['a'], items)
    const maxDx = half - item.dimensions.width / 2 - item.position[0]
    expect(delta[0]).toBeCloseTo(maxDx)
  })

  it('clamps displacement when moving toward an outside obstacle', () => {
    // Mover 100×100×100 at origin, obstacle at x=500 — gap = 400 (hx=100)
    // Dragging 500 units right would penetrate; clamped to 400 (gap=0, touching)
    const mover = makeItem('m', [0, 50, 0], { width: 100, height: 100, depth: 100 })
    const obstacle = makeItem('obs', [500, 50, 0], { width: 100, height: 100, depth: 100 })
    const delta = groupDragDelta([500, 50, 0], [0, 50, 0], ['m'], [mover, obstacle])
    expect(delta[0]).toBe(400)
    expect(delta[1]).toBe(0)
    expect(delta[2]).toBe(0)
  })
})
