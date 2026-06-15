import { describe, it, expect } from 'vitest'
import { computeItemsBounds } from './bounds'
import type { SceneItem } from '@/types'

function makeItem(
  id: string,
  position: [number, number, number],
  dims: { width: number; height: number; depth: number }
): SceneItem {
  return {
    id,
    catalogId: 'test',
    name: 'Test',
    position,
    rotationY: 0,
    dimensions: dims,
    properties: {},
    groupId: null,
  }
}

describe('computeItemsBounds', () => {
  it('returns Infinity/-Infinity bounds for empty list', () => {
    const result = computeItemsBounds([])
    expect(result.min[0]).toBe(Infinity)
    expect(result.max[0]).toBe(-Infinity)
  })

  it('computes correct bounds for single item at origin', () => {
    const item = makeItem('a', [0, 100, 0], { width: 200, height: 200, depth: 100 })
    const { min, max } = computeItemsBounds([item])
    expect(min).toEqual([-100, 0, -50])
    expect(max).toEqual([100, 200, 50])
  })

  it('computes correct bounds spanning multiple items', () => {
    const a = makeItem('a', [-200, 100, 0], { width: 100, height: 200, depth: 100 })
    const b = makeItem('b', [300, 150, 100], { width: 200, height: 300, depth: 200 })
    const { min, max } = computeItemsBounds([a, b])
    expect(min).toEqual([-250, 0, -50])
    expect(max).toEqual([400, 300, 200])
  })

  it('handles non-zero origin positions', () => {
    const item = makeItem('a', [1000, 500, -300], { width: 400, height: 600, depth: 200 })
    const { min, max } = computeItemsBounds([item])
    expect(min).toEqual([800, 200, -400])
    expect(max).toEqual([1200, 800, -200])
  })
})
