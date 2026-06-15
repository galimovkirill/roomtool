import { useMemo } from 'react'
import { useSceneStore, useEditorStore } from '@/store'
import { computeItemsBounds } from '@/utils/bounds'

export function SceneOverlay() {
  const selectedItemIds = useEditorStore((s) => s.selectedItemIds)
  const items = useSceneStore((s) => s.items)

  const dims = useMemo(() => {
    if (selectedItemIds.length === 0) return null

    const selected = items.filter((i) => selectedItemIds.includes(i.id))
    if (selected.length === 0) return null

    const { min, max } = computeItemsBounds(selected)
    return {
      w: Math.round(max[0] - min[0]),
      h: Math.round(max[1] - min[1]),
      d: Math.round(max[2] - min[2]),
      count: selected.length,
    }
  }, [selectedItemIds, items])

  if (!dims) return null

  return (
    <div
      aria-label={dims.count === 1 ? 'Размеры выбранного элемента (мм)' : 'Габариты выделения (мм)'}
      className="absolute top-4 left-4 z-10 flex items-center gap-3 bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1.5"
    >
      <span className="text-xs text-gray-400">W</span>
      <span className="text-xs font-mono text-white">{dims.w}</span>
      <span className="text-xs text-gray-400">H</span>
      <span className="text-xs font-mono text-white">{dims.h}</span>
      <span className="text-xs text-gray-400">D</span>
      <span className="text-xs font-mono text-white">{dims.d}</span>
    </div>
  )
}
