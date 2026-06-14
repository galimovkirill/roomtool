import { describe, expect, it } from 'vitest'
import { clampToRoom } from './clampToRoom'
import { SCENE_CONFIG } from '@/config/scene'

const { width: ROOM_W, depth: ROOM_D, height: ROOM_H } = SCENE_CONFIG.room
const DIMS = { width: 900, height: 2200, depth: 600 }

describe('clampToRoom', () => {
  it('leaves a position inside the room untouched', () => {
    expect(clampToRoom({ x: 100, y: 1100, z: -200 }, DIMS)).toEqual([100, 1100, -200])
  })

  it('clamps X to the right wall accounting for half width', () => {
    const [x] = clampToRoom({ x: 999999, y: 1100, z: 0 }, DIMS)
    expect(x).toBe(ROOM_W / 2 - DIMS.width / 2)
  })

  it('clamps X to the left wall accounting for half width', () => {
    const [x] = clampToRoom({ x: -999999, y: 1100, z: 0 }, DIMS)
    expect(x).toBe(-ROOM_W / 2 + DIMS.width / 2)
  })

  it('clamps Z to the far wall accounting for half depth', () => {
    const [, , z] = clampToRoom({ x: 0, y: 1100, z: 999999 }, DIMS)
    expect(z).toBe(ROOM_D / 2 - DIMS.depth / 2)
  })

  it('clamps Z to the near wall accounting for half depth', () => {
    const [, , z] = clampToRoom({ x: 0, y: 1100, z: -999999 }, DIMS)
    expect(z).toBe(-ROOM_D / 2 + DIMS.depth / 2)
  })

  it('keeps the bottom of the element on the floor (y >= height/2)', () => {
    const [, y] = clampToRoom({ x: 0, y: -500, z: 0 }, DIMS)
    expect(y).toBe(DIMS.height / 2)
  })

  it('keeps the top of the element below the ceiling (y <= roomH - height/2)', () => {
    const [, y] = clampToRoom({ x: 0, y: 999999, z: 0 }, DIMS)
    expect(y).toBe(ROOM_H - DIMS.height / 2)
  })

  it('clamps all three axes simultaneously', () => {
    expect(clampToRoom({ x: 999999, y: -999999, z: 999999 }, DIMS)).toEqual([
      ROOM_W / 2 - DIMS.width / 2,
      DIMS.height / 2,
      ROOM_D / 2 - DIMS.depth / 2,
    ])
  })

  it('handles an element exactly as wide as the room (X pinned to centre)', () => {
    const wide = { width: ROOM_W, height: 100, depth: 100 }
    const [x] = clampToRoom({ x: 500, y: 50, z: 0 }, wide)
    expect(x).toBe(0)
  })
})
