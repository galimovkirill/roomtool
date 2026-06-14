import type { SceneItem, SceneGroup } from '@/types'

export function isItemEffectivelyLocked(item: SceneItem, groups: SceneGroup[]): boolean {
  if (item.locked) return true
  let groupId: string | null | undefined = item.groupId
  while (groupId) {
    const group = groups.find((g) => g.id === groupId)
    if (!group) break
    if (group.locked) return true
    groupId = group.parentGroupId
  }
  return false
}
