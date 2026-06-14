import { useShallow } from 'zustand/shallow'
import { useSceneStore } from '@/store'

export function SceneOverlay() {
  const dims = useSceneStore(
    useShallow((s) => {
      if (s.selectedItemIds.length === 0) return null

      if (s.selectedItemIds.length === 1) {
        const item = s.items.find((i) => i.id === s.selectedItemIds[0])
        if (!item) return null
        return {
          w: Math.round(item.dimensions.width),
          h: Math.round(item.dimensions.height),
          d: Math.round(item.dimensions.depth),
          count: 1,
        }
      }

      const selected = s.items.filter((i) => s.selectedItemIds.includes(i.id))
      if (selected.length === 0) return null

      let minX = Infinity,
        maxX = -Infinity
      let minY = Infinity,
        maxY = -Infinity
      let minZ = Infinity,
        maxZ = -Infinity

      for (const item of selected) {
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
        w: Math.round(maxX - minX),
        h: Math.round(maxY - minY),
        d: Math.round(maxZ - minZ),
        count: selected.length,
      }
    })
  )

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
