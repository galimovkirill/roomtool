import { totalOverlapVolume } from './collision'
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

  it('increases when item moves deeper into another', () => {
    const b = makeItem('b', [0, 50, 0], 100)
    const aFar = makeItem('a', [60, 50, 0], 100)
    const aClose = makeItem('a', [30, 50, 0], 100)
    expect(totalOverlapVolume(aClose, [aClose, b])).toBeGreaterThan(
      totalOverlapVolume(aFar, [aFar, b])
    )
  })
})
