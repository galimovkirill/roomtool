import { useShallow } from 'zustand/shallow'
import { useSceneStore } from '@/store'

export function SceneOverlay() {
  const dims = useSceneStore(
    useShallow((s) => {
      if (s.selectedItemIds.length !== 1) return null
      const item = s.items.find((i) => i.id === s.selectedItemIds[0])
      if (!item) return null
      return {
        w: Math.round(item.dimensions.width),
        h: Math.round(item.dimensions.height),
        d: Math.round(item.dimensions.depth),
      }
    })
  )

  if (!dims) return null

  return (
    <div
      aria-label="Размеры выбранного элемента (мм)"
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
