import {
  totalOverlapVolume,
  hasGroupCollision,
  clampGroupDelta,
  clampGroupDeltaAgainstItems,
} from './collision'
import type { SceneItem } from '@/types'

function makeItem(id: string, position: [number, number, number], size = 100): SceneItem {
  return {
    id,
    catalogId: 'wardrobe-body',
    name: 'Test',
    position,
    rotationY: 0,
    dimensions: { width: size, height: size, depth: size },
    properties: {},
    groupId: null,
  }
}

describe('totalOverlapVolume', () => {
  it('returns 0 when no other items', () => {
    const a = makeItem('a', [0, 50, 0])
    expect(totalOverlapVolume(a, [a])).toBe(0)
  })

  it('returns 0 when items do not overlap', () => {
    const a = makeItem('a', [0, 50, 0])
    const b = makeItem('b', [500, 50, 0])
    expect(totalOverlapVolume(a, [a, b])).toBe(0)
  })

  it('returns full cube volume when items are at the same position', () => {
    const a = makeItem('a', [0, 50, 0], 100)
    const b = makeItem('b', [0, 50, 0], 100)
    // overlap per axis = 100, volume = 100 * 100 * 100
    expect(totalOverlapVolume(a, [a, b])).toBe(1_000_000)
  })

  it('returns smaller volume when items partially overlap', () => {
    const a = makeItem('a', [0, 50, 0], 100)
    const b = makeItem('b', [50, 50, 0], 100)
    // overlapX = 100 - 50 = 50, overlapY = 100, overlapZ = 100 → 50 * 100 * 100 = 500_000
    expect(totalOverlapVolume(a, [a, b])).toBe(500_000)
  })

  it('returns 0 when items touch but do not overlap', () => {
    const a = makeItem('a', [0, 50, 0], 100)
    const b = makeItem('b', [100, 50, 0], 100) // касание: расстояние = 100 = (100+100)/2
    expect(totalOverlapVolume(a, [a, b])).toBe(0)
  })

  it('increases when item moves deeper into another', () => {
    const b = makeItem('b', [0, 50, 0], 100)
    const aFar = makeItem('a', [60, 50, 0], 100)
    const aClose = makeItem('a', [30, 50, 0], 100)
    expect(totalOverlapVolume(aClose, [aClose, b])).toBeGreaterThan(
      totalOverlapVolume(aFar, [aFar, b])
    )
  })
})

describe('clampGroupDelta', () => {
  // Room from SCENE_CONFIG: 4000×3000×4000 mm, X ∈ [-2000, 2000], Z ∈ [-2000, 2000], Y ∈ [0, 3000]

  it('returns delta unchanged when group fits within room', () => {
    const a = makeItem('a', [0, 50, 0], 100)
    const result = clampGroupDelta(['a'], [10, 0, 5], [a])
    expect(result).toEqual([10, 0, 5])
  })

  it('clamps delta so item does not pass the right wall', () => {
    // item center at x=1980, half-width=50 → right edge at 2030, but room is 2000
    // max allowed dx = 2000 - 50 - 1980 = -30 (already at edge; further right would be negative clamp)
    const a = makeItem('a', [1980, 50, 0], 100)
    const [dx] = clampGroupDelta(['a'], [200, 0, 0], [a])
    expect(dx).toBeLessThanOrEqual(2000 - 50 - 1980)
  })

  it('clamps delta so item does not go below the floor', () => {
    const a = makeItem('a', [0, 50, 0], 100)
    // trying to move down by 200, but floor requires y >= 50
    const [, dy] = clampGroupDelta(['a'], [0, -200, 0], [a])
    expect(dy).toBeGreaterThanOrEqual(50 - 50) // = 0
  })

  it('clamps based on the most constrained item in the group', () => {
    // item A can move right 500mm, item B (near right wall) can only move right 10mm
    const a = makeItem('a', [0, 50, 0], 100)
    // b at x=1940: right face = 1940+50=1990, max dx = 2000-50-1940 = 10
    const b = makeItem('b', [1940, 50, 0], 100)
    const [dx] = clampGroupDelta(['a', 'b'], [500, 0, 0], [a, b])
    expect(dx).toBeLessThanOrEqual(10)
  })
})

describe('hasGroupCollision', () => {
  it('returns false when group does not collide with outside items', () => {
    const a = makeItem('a', [0, 50, 0])
    const b = makeItem('b', [150, 50, 0])
    const outside = makeItem('c', [1000, 50, 0])
    // delta moves group slightly to the right — still no collision
    expect(hasGroupCollision(['a', 'b'], [10, 0, 0], [a, b, outside])).toBe(false)
  })

  it('returns true when group member collides with outside item after delta', () => {
    const a = makeItem('a', [0, 50, 0])
    const b = makeItem('b', [150, 50, 0])
    const outside = makeItem('c', [800, 50, 0])
    // move group 700 units right: 'a' lands at x=700, 'b' at x=850
    // 'b' will overlap 'c' at x=800 (100 units cube each → overlap = 50mm per axis)
    expect(hasGroupCollision(['a', 'b'], [700, 0, 0], [a, b, outside])).toBe(true)
  })

  it('returns false when only group members overlap each other (not outside)', () => {
    const a = makeItem('a', [0, 50, 0])
    const b = makeItem('b', [10, 50, 0]) // overlapping each other within group
    // no outside items
    expect(hasGroupCollision(['a', 'b'], [5, 0, 0], [a, b])).toBe(false)
  })
})

describe('clampGroupDeltaAgainstItems', () => {
  function makeItemWithDims(
    id: string,
    pos: [number, number, number],
    dims: { width: number; height: number; depth: number }
  ): SceneItem {
    return {
      id,
      catalogId: 'test',
      name: id,
      groupId: null,
      position: pos,
      rotationY: 0,
      dimensions: dims,
      properties: {},
    }
  }

  it('clamps dx to gap=0 when moving directly into an obstacle', () => {
    // M left of O, both 400×400×400 cubes. cx=-600, hx=400 → gap=200
    const m = makeItemWithDims('m', [-600, 0, 0], { width: 400, height: 400, depth: 400 })
    const o = makeItemWithDims('o', [0, 0, 0], { width: 400, height: 400, depth: 400 })
    const result = clampGroupDeltaAgainstItems(['m'], [400, 0, 0], [m, o])
    expect(result[0]).toBe(200)
    expect(result[1]).toBe(0)
    expect(result[2]).toBe(0)
  })

  it('does not clamp dz when X positions do not overlap (no collision path)', () => {
    // M shifted far along X — no X overlap with O, so Z movement is free
    const m = makeItemWithDims('m', [600, 0, -600], { width: 400, height: 400, depth: 400 })
    const o = makeItemWithDims('o', [0, 0, 0], { width: 400, height: 400, depth: 400 })
    const result = clampGroupDeltaAgainstItems(['m'], [0, 0, 800], [m, o])
    expect(result).toEqual([0, 0, 800])
  })

  it('clamps dx but preserves dz on diagonal move (sliding along surface)', () => {
    // M left of O: curOX=false, curOY=true, curOZ=true → X clamped, Z free
    const m = makeItemWithDims('m', [-600, 0, 0], { width: 400, height: 400, depth: 400 })
    const o = makeItemWithDims('o', [0, 0, 0], { width: 400, height: 400, depth: 400 })
    const result = clampGroupDeltaAgainstItems(['m'], [400, 0, 300], [m, o])
    expect(result[0]).toBe(200)
    expect(result[2]).toBe(300)
  })

  it('stops entire group when any member would penetrate an obstacle', () => {
    // M1 and M2 both approaching O from the left
    const m1 = makeItemWithDims('m1', [-600, 0, 0], { width: 200, height: 200, depth: 200 })
    const m2 = makeItemWithDims('m2', [-600, 0, 300], { width: 200, height: 200, depth: 200 })
    const o = makeItemWithDims('o', [0, 0, 0], { width: 400, height: 400, depth: 400 })
    const result = clampGroupDeltaAgainstItems(['m1', 'm2'], [300, 0, 0], [m1, m2, o])
    // m1 after move: -600 + dx. hx for m1+o = (200+400)/2 = 300. m1 must not pass -300.
    expect(result[0]).toBeLessThanOrEqual(300)
    const m1After = -600 + result[0]
    expect(Math.abs(m1After - 0)).toBeGreaterThanOrEqual(300 - 1)
  })

  it('does not block movement when items already fully overlap (no lock-in)', () => {
    // M and O at same position — pre-existing overlap is skipped
    const m = makeItemWithDims('m', [0, 0, 0], { width: 400, height: 400, depth: 400 })
    const o = makeItemWithDims('o', [0, 0, 0], { width: 400, height: 400, depth: 400 })
    const result = clampGroupDeltaAgainstItems(['m'], [100, 0, 0], [m, o])
    expect(result).toEqual([100, 0, 0])
  })
})
