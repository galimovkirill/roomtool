import type { SceneItem, Vec3 } from '@/types'

export function computeItemsBounds(items: SceneItem[]): { min: Vec3; max: Vec3 } {
  let minX = Infinity,
    maxX = -Infinity
  let minY = Infinity,
    maxY = -Infinity
  let minZ = Infinity,
    maxZ = -Infinity

  for (const item of items) {
    const hw = item.dimensions.width / 2
    const hh = item.dimensions.height / 2
    const hd = item.dimensions.depth / 2
    minX = Math.min(minX, item.position[0] - hw)
    maxX = Math.max(maxX, item.position[0] + hw)
    minY = Math.min(minY, item.position[1] - hh)
    maxY = Math.max(maxY, item.position[1] + hh)
    minZ = Math.min(minZ, item.position[2] - hd)
    maxZ = Math.max(maxZ, item.position[2] + hd)
  }

  return {
    min: [minX, minY, minZ],
    max: [maxX, maxY, maxZ],
  }
}
