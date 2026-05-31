import { useUIStore } from '@/store'

export function SceneOverlay() {
  const sceneMode = useUIStore((s) => s.sceneMode)
  const setSceneMode = useUIStore((s) => s.setSceneMode)

  return (
    <div className="absolute top-4 left-4 z-10">
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
    </div>
  )
}
