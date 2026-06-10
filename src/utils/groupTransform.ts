import type { SceneItem } from '@/types'
import { clampGroupDelta, clampGroupDeltaAgainstItems } from './collision'

type Vec3 = [number, number, number]

// Bounding-box center of a set of group items. The group gizmo (pivot) sits here.
// Mirrors the AABB used for collision: position is the item center, so each axis
// spans position ± dimension/2.
export function computeGroupCenter(groupItems: SceneItem[]): Vec3 {
  if (groupItems.length === 0) return [0, 0, 0]
  const xs = groupItems.flatMap((i) => [
    i.position[0] - i.dimensions.width / 2,
    i.position[0] + i.dimensions.width / 2,
  ])
  const ys = groupItems.flatMap((i) => [
    i.position[1] - i.dimensions.height / 2,
    i.position[1] + i.dimensions.height / 2,
  ])
  const zs = groupItems.flatMap((i) => [
    i.position[2] - i.dimensions.depth / 2,
    i.position[2] + i.dimensions.depth / 2,
  ])
  return [
    (Math.min(...xs) + Math.max(...xs)) / 2,
    (Math.min(...ys) + Math.max(...ys)) / 2,
    (Math.min(...zs) + Math.max(...zs)) / 2,
  ]
}

// Movement delta of a drag (pivot displacement from where the drag began),
// clamped so no group item passes through a room wall.
export function groupDragDelta(
  pivotPosition: Vec3,
  initialCenter: Vec3,
  groupItemIds: string[],
  items: SceneItem[]
): Vec3 {
  const raw: Vec3 = [
    pivotPosition[0] - initialCenter[0],
    pivotPosition[1] - initialCenter[1],
    pivotPosition[2] - initialCenter[2],
  ]
  const clampedByWalls = clampGroupDelta(groupItemIds, raw, items)
  return clampGroupDeltaAgainstItems(groupItemIds, clampedByWalls, items)
}
