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
