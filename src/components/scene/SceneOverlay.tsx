import { useShallow } from 'zustand/shallow'
import { useSceneStore } from '@/store'
import { worldToRoomX, worldToRoomZ } from '@/utils/roomCoords'

export function SceneOverlay() {
  const coords = useSceneStore(
    useShallow((s) => {
      const ids = s.selectedItemIds
      if (ids.length === 0) return null
      const selected = ids.flatMap((id) => {
        const item = s.items.find((i) => i.id === id)
        return item ? [item] : []
      })
      if (selected.length === 0) return null
      const n = selected.length
      // X/Z показываем от дальнего угла комнаты (см. utils/roomCoords); Y — от пола.
      return {
        x: Math.round(worldToRoomX(selected.reduce((sum, i) => sum + i.position[0], 0) / n)),
        y: Math.round(
          selected.reduce((sum, i) => sum + (i.position[1] - i.dimensions.height / 2), 0) / n
        ),
        z: Math.round(worldToRoomZ(selected.reduce((sum, i) => sum + i.position[2], 0) / n)),
      }
    })
  )
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

  return (
    <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
      {coords && (
        <div
          aria-label="Координаты выбранного элемента (мм)"
          className="flex items-center gap-3 bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1.5"
        >
          <span className="text-xs text-gray-400">X</span>
          <span className="text-xs font-mono text-white">{coords.x}</span>
          <span className="text-xs text-gray-400">Y</span>
          <span className="text-xs font-mono text-white">{coords.y}</span>
          <span className="text-xs text-gray-400">Z</span>
          <span className="text-xs font-mono text-white">{coords.z}</span>
        </div>
      )}
      {dims && (
        <div
          aria-label="Размеры выбранного элемента (мм)"
          className="flex items-center gap-3 bg-black/40 backdrop-blur-sm rounded-lg px-3 py-1.5"
        >
          <span className="text-xs text-gray-400">W</span>
          <span className="text-xs font-mono text-white">{dims.w}</span>
          <span className="text-xs text-gray-400">H</span>
          <span className="text-xs font-mono text-white">{dims.h}</span>
          <span className="text-xs text-gray-400">D</span>
          <span className="text-xs font-mono text-white">{dims.d}</span>
        </div>
      )}
    </div>
  )
}
