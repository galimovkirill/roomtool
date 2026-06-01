import { SCENE_CONFIG } from '@/config/scene'
import type { SceneItem } from '@/types'

export function totalOverlapVolume(movedItem: SceneItem, allItems: SceneItem[]): number {
  return allItems
    .filter((item) => item.id !== movedItem.id)
    .reduce((sum, other) => {
      const ox = Math.max(
        0,
        (movedItem.dimensions.width + other.dimensions.width) / 2 -
          Math.abs(movedItem.position[0] - other.position[0])
      )
      const oy = Math.max(
        0,
        (movedItem.dimensions.height + other.dimensions.height) / 2 -
          Math.abs(movedItem.position[1] - other.position[1])
      )
      const oz = Math.max(
        0,
        (movedItem.dimensions.depth + other.dimensions.depth) / 2 -
          Math.abs(movedItem.position[2] - other.position[2])
      )
      return ox > 0 && oy > 0 && oz > 0 ? sum + ox * oy * oz : sum
    }, 0)
}

// Clamps a group movement delta so that no item in the group passes through room walls.
// Iterates all group items and progressively tightens the allowed delta range,
// so the entire group stops as one unit when the first item hits a boundary.
export function clampGroupDelta(
  groupItemIds: string[],
  delta: [number, number, number],
  allItems: SceneItem[]
): [number, number, number] {
  const { width: roomW, depth: roomD, height: roomH } = SCENE_CONFIG.room
  const groupItems = allItems.filter((i) => groupItemIds.includes(i.id))

  let [dx, dy, dz] = delta

  for (const item of groupItems) {
    const { width, height, depth } = item.dimensions
    const [px, py, pz] = item.position

    dx = Math.min(roomW / 2 - width / 2 - px, Math.max(-roomW / 2 + width / 2 - px, dx))
    dy = Math.min(roomH - height / 2 - py, Math.max(height / 2 - py, dy))
    dz = Math.min(roomD / 2 - depth / 2 - pz, Math.max(-roomD / 2 + depth / 2 - pz, dz))
  }

  return [dx, dy, dz]
}

export function hasGroupCollision(
  groupItemIds: string[],
  delta: [number, number, number],
  allItems: SceneItem[]
): boolean {
  const groupItems = allItems.filter((i) => groupItemIds.includes(i.id))
  const outsideItems = allItems.filter((i) => !groupItemIds.includes(i.id))

  return groupItems.some((item) => {
    const movedItem: SceneItem = {
      ...item,
      position: [
        item.position[0] + delta[0],
        item.position[1] + delta[1],
        item.position[2] + delta[2],
      ],
    }
    return totalOverlapVolume(movedItem, outsideItems) > 1
  })
}
