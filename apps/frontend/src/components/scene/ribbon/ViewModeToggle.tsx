import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useUIStore } from '@/store/uiStore'

export function ViewModeToggle() {
  const sceneMode = useUIStore((s) => s.sceneMode)
  const setSceneMode = useUIStore((s) => s.setSceneMode)

  return (
    <ToggleGroup
      value={[sceneMode]}
      onValueChange={(values) => values.length > 0 && setSceneMode(values[0] as '2d' | '3d')}
      aria-label="Режим просмотра"
      className="flex rounded-md overflow-hidden border border-gray-200"
      spacing={0}
    >
      <ToggleGroupItem
        value="3d"
        className="px-3 py-1 text-sm font-medium transition-colors bg-white text-gray-700 hover:bg-gray-50 aria-pressed:bg-blue-600 aria-pressed:text-white rounded-none"
      >
        3D
      </ToggleGroupItem>
      <ToggleGroupItem
        value="2d"
        className="px-3 py-1 text-sm font-medium transition-colors border-l border-gray-200 bg-white text-gray-700 hover:bg-gray-50 aria-pressed:bg-blue-600 aria-pressed:text-white rounded-none"
      >
        2D
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
