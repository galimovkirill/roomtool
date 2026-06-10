import { useShallow } from 'zustand/shallow'
import { useSceneStore, useUIStore } from '@/store'
import { worldToRoomX, worldToRoomZ } from '@/utils/roomCoords'

export function SceneOverlay() {
  const sceneMode = useUIStore((s) => s.sceneMode)
  const setSceneMode = useUIStore((s) => s.setSceneMode)
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

  return (
    <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
      <div
        role="group"
        aria-label="Режим просмотра"
        className="flex rounded-lg overflow-hidden shadow-md"
      >
        {(['3d', '2d'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            aria-pressed={sceneMode === mode}
            onClick={() => setSceneMode(mode)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              sceneMode === mode
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {mode === '3d' ? '3D' : '2D'}
          </button>
        ))}
      </div>
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
    </div>
  )
}
