import type { SceneGroup, SceneItem } from '@/types'

export type LayerRow = { type: 'item'; item: SceneItem } | { type: 'group'; group: SceneGroup }

/**
 * Строит строки панели слоёв сверху вниз: последний добавленный элемент — первым.
 * Сгруппированные элементы сворачиваются в одну строку группы (на месте первого
 * встреченного участника); элементы без группы — отдельными строками.
 */
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

/**
 * Плоский список видимых id в порядке отображения. Свёрнутая группа не отдаёт
 * участников — так shift-выделение диапазона не захватывает скрытые элементы.
 */
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

/**
 * Диапазон id между якорем и кликнутым элементом (включительно) для shift-клика.
 * Возвращает null, если любой из id не виден в плоском порядке — тогда вызывающий
 * откатывается к одиночному выделению.
 */
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
