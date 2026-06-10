import { describe, expect, it } from 'vitest'
import { roomToWorldX, roomToWorldZ, worldToRoomX, worldToRoomZ } from './roomCoords'
import { SCENE_CONFIG } from '@/config/scene'

const { width: ROOM_W, depth: ROOM_D } = SCENE_CONFIG.room

describe('roomCoords', () => {
  describe('worldToRoom', () => {
    it('maps the room centre (world 0) to half the dimension', () => {
      expect(worldToRoomX(0)).toBe(ROOM_W / 2)
      expect(worldToRoomZ(0)).toBe(ROOM_D / 2)
    })

    it('maps the far corner (world -half) to 0', () => {
      expect(worldToRoomX(-ROOM_W / 2)).toBe(0)
      expect(worldToRoomZ(-ROOM_D / 2)).toBe(0)
    })

    it('maps the near corner (world +half) to the full dimension', () => {
      expect(worldToRoomX(ROOM_W / 2)).toBe(ROOM_W)
      expect(worldToRoomZ(ROOM_D / 2)).toBe(ROOM_D)
    })
  })

  describe('roomToWorld', () => {
    it('is the inverse of worldToRoom (round-trip)', () => {
      for (const x of [-1500, -400, 0, 250, 1900]) {
        expect(roomToWorldX(worldToRoomX(x))).toBe(x)
      }
      for (const z of [-1500, -400, 0, 250, 1900]) {
        expect(roomToWorldZ(worldToRoomZ(z))).toBe(z)
      }
    })

    it('maps corner 0 back to the far wall (world -half)', () => {
      expect(roomToWorldX(0)).toBe(-ROOM_W / 2)
      expect(roomToWorldZ(0)).toBe(-ROOM_D / 2)
    })
  })
})
