import type { SceneGroup, SceneItem } from '@/types'

export type LayerRow = { type: 'item'; item: SceneItem } | { type: 'group'; group: SceneGroup }

export type LayerNode =
  | { type: 'item'; item: SceneItem }
  | { type: 'group'; group: SceneGroup; children: LayerNode[] }

// ─── Tree API ────────────────────────────────────────────────────────────────

function isInGroupSubtree(
  itemGroupId: string | null,
  ancestorId: string,
  groups: SceneGroup[],
  visited = new Set<string>()
): boolean {
  if (!itemGroupId) return false
  if (itemGroupId === ancestorId) return true
  if (visited.has(itemGroupId)) return false
  visited.add(itemGroupId)
  const parent = groups.find((g) => g.id === itemGroupId)
  if (!parent?.parentGroupId) return false
  return isInGroupSubtree(parent.parentGroupId, ancestorId, groups, visited)
}

export function buildLayerTree(items: SceneItem[], groups: SceneGroup[]): LayerNode[] {
  function buildNodes(parentGroupId: string | null): LayerNode[] {
    const directItems =
      parentGroupId === null
        ? items.filter((i) => i.groupId === null)
        : items.filter((i) => i.groupId === parentGroupId)

    const childGroups =
      parentGroupId === null
        ? groups.filter((g) => !g.parentGroupId)
        : groups.filter((g) => g.parentGroupId === parentGroupId)

    // Position = max index in items[] among all items in subtree (newest = highest index = first in UI)
    const groupLastIdx = new Map<string, number>()
    for (const cg of childGroups) {
      let maxIdx = -1
      for (let i = 0; i < items.length; i++) {
        if (isInGroupSubtree(items[i].groupId, cg.id, groups)) maxIdx = Math.max(maxIdx, i)
      }
      groupLastIdx.set(cg.id, maxIdx)
    }

    type Entry =
      | { kind: 'item'; item: SceneItem; pos: number }
      | { kind: 'group'; group: SceneGroup; pos: number }

    const entries: Entry[] = []
    for (let i = 0; i < items.length; i++) {
      if (directItems.some((di) => di.id === items[i].id)) {
        entries.push({ kind: 'item', item: items[i], pos: i })
      }
    }
    for (const cg of childGroups) {
      entries.push({ kind: 'group', group: cg, pos: groupLastIdx.get(cg.id) ?? -1 })
    }

    entries.sort((a, b) => b.pos - a.pos)

    return entries.map((entry) =>
      entry.kind === 'item'
        ? { type: 'item' as const, item: entry.item }
        : { type: 'group' as const, group: entry.group, children: buildNodes(entry.group.id) }
    )
  }

  return buildNodes(null)
}

export function flattenLayerTree(nodes: LayerNode[]): string[] {
  const result: string[] = []
  for (const node of nodes) {
    if (node.type === 'item') {
      result.push(node.item.id)
    } else if (!node.group.collapsed) {
      result.push(...flattenLayerTree(node.children))
    }
  }
  return result
}

export function getAllItemIdsInGroup(
  groupId: string,
  items: SceneItem[],
  groups: SceneGroup[]
): string[] {
  const allGroupIds = new Set<string>([groupId])
  let changed = true
  while (changed) {
    changed = false
    for (const g of groups) {
      if (g.parentGroupId && allGroupIds.has(g.parentGroupId) && !allGroupIds.has(g.id)) {
        allGroupIds.add(g.id)
        changed = true
      }
    }
  }
  return items.filter((i) => i.groupId && allGroupIds.has(i.groupId)).map((i) => i.id)
}

// ─── Legacy flat API (used by existing tests) ────────────────────────────────

export function buildLayerRows(items: SceneItem[], groups: SceneGroup[]): LayerRow[] {
  const seen = new Set<string>()
  const rows: LayerRow[] = []
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i]
    if (item.groupId === null) {
      rows.push({ type: 'item', item })
    } else if (!seen.has(item.groupId)) {
      seen.add(item.groupId)
      const group = groups.find((g) => g.id === item.groupId)
      if (group) rows.push({ type: 'group', group })
    }
  }
  return rows
}

export function buildFlatOrder(rows: LayerRow[]): string[] {
  const result: string[] = []
  for (const row of rows) {
    if (row.type === 'item') {
      result.push(row.item.id)
    } else if (!row.group.collapsed) {
      for (const id of row.group.itemIds) {
        result.push(id)
      }
    }
  }
  return result
}

export function rangeSelection(
  flatOrder: string[],
  anchorId: string,
  clickedId: string
): string[] | null {
  const anchorIdx = flatOrder.indexOf(anchorId)
  const currentIdx = flatOrder.indexOf(clickedId)
  if (anchorIdx === -1 || currentIdx === -1) return null
  const start = Math.min(anchorIdx, currentIdx)
  const end = Math.max(anchorIdx, currentIdx)
  return flatOrder.slice(start, end + 1)
}
