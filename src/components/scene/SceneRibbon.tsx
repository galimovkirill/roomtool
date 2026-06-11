import { useUIStore } from '@/store/uiStore'
import { useSceneStore } from '@/store/sceneStore'
import type { AlignmentType } from '@/store/sceneStore'

interface AlignButton {
  type: AlignmentType
  title: string
  label: string
}

const ALIGN_BUTTONS: AlignButton[] = [
  { type: 'left', title: 'По левой грани (X−)', label: '←' },
  { type: 'centerX', title: 'По центру X', label: '↔' },
  { type: 'right', title: 'По правой грани (X+)', label: '→' },
  { type: 'front', title: 'По передней грани (Z−)', label: '↑' },
  { type: 'centerZ', title: 'По центру Z', label: '↕' },
  { type: 'back', title: 'По задней грани (Z+)', label: '↓' },
  { type: 'bottom', title: 'По нижней грани (Y−)', label: '⬇' },
  { type: 'centerY', title: 'По центру Y', label: '⬆⬇' },
  { type: 'top', title: 'По верхней грани (Y+)', label: '⬆' },
]

export function SceneRibbon() {
  const sceneMode = useUIStore((s) => s.sceneMode)
  const setSceneMode = useUIStore((s) => s.setSceneMode)
  const showGizmo = useUIStore((s) => s.showGizmo)
  const toggleGizmo = useUIStore((s) => s.toggleGizmo)
  const selectedCount = useSceneStore((s) => s.selectedItemIds.length)
  const alignItems = useSceneStore((s) => s.alignItems)

  return (
    <div className="flex items-center gap-1 px-3 h-10 bg-white border-b border-gray-200 shrink-0">
      <div
        role="group"
        aria-label="Режим просмотра"
        className="flex rounded-md overflow-hidden border border-gray-200"
      >
        {(['3d', '2d'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            aria-pressed={sceneMode === mode}
            onClick={() => setSceneMode(mode)}
            className={`px-3 py-1 text-sm font-medium transition-colors ${
              sceneMode === mode
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {mode === '3d' ? '3D' : '2D'}
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      <button
        type="button"
        title="Показать / скрыть гизмо"
        aria-label="Показать / скрыть гизмо"
        aria-pressed={showGizmo}
        onClick={toggleGizmo}
        className={`px-2 py-1 rounded text-sm transition-colors ${
          showGizmo
            ? 'bg-blue-50 text-blue-600 border border-blue-200'
            : 'text-gray-500 border border-transparent hover:bg-gray-50'
        }`}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className="inline"
        >
          <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path
            d="M8 2L6 4M8 2l2 2M8 14l-2-2M8 14l2-2M2 8l2-2M2 8l2 2M14 8l-2-2M14 8l-2 2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      <span className="text-xs text-gray-400 mr-1">Выровнять:</span>
      {ALIGN_BUTTONS.map(({ type, title, label }) => (
        <button
          key={type}
          type="button"
          title={title}
          disabled={selectedCount < 2}
          onClick={() => alignItems(type)}
          className="w-7 h-7 flex items-center justify-center rounded text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        >
          {label}
        </button>
      ))}
    </div>
  )
}
