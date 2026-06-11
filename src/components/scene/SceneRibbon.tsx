import * as ToggleGroup from '@radix-ui/react-toggle-group'
import * as Tooltip from '@radix-ui/react-tooltip'
import { useUIStore } from '@/store/uiStore'
import { useSceneStore } from '@/store/sceneStore'
import type { AlignmentType } from '@/store/sceneStore'
import { ToolbarToggleButton } from '@/components/ui/ToolbarToggleButton'

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
  const showCeilingLight = useUIStore((s) => s.showCeilingLight)
  const toggleCeilingLight = useUIStore((s) => s.toggleCeilingLight)
  const selectedCount = useSceneStore((s) => s.selectedItemIds.length)
  const alignItems = useSceneStore((s) => s.alignItems)

  return (
    <Tooltip.Provider delayDuration={400}>
      <div className="flex items-center gap-1 px-3 h-10 bg-white border-b border-gray-200 shrink-0">
        <ToggleGroup.Root
          type="single"
          value={sceneMode}
          onValueChange={(v) => v && setSceneMode(v as '2d' | '3d')}
          aria-label="Режим просмотра"
          className="flex rounded-md overflow-hidden border border-gray-200"
        >
          <ToggleGroup.Item
            value="3d"
            className="px-3 py-1 text-sm font-medium transition-colors data-[state=on]:bg-blue-600 data-[state=on]:text-white data-[state=off]:bg-white data-[state=off]:text-gray-700 data-[state=off]:hover:bg-gray-50"
          >
            3D
          </ToggleGroup.Item>
          <ToggleGroup.Item
            value="2d"
            className="px-3 py-1 text-sm font-medium transition-colors border-l border-gray-200 data-[state=on]:bg-blue-600 data-[state=on]:text-white data-[state=off]:bg-white data-[state=off]:text-gray-700 data-[state=off]:hover:bg-gray-50"
          >
            2D
          </ToggleGroup.Item>
        </ToggleGroup.Root>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <ToolbarToggleButton
          pressed={showGizmo}
          onPressedChange={toggleGizmo}
          aria-label="Показать / скрыть гизмо"
          tooltip={(p) => (p ? 'Скрыть гизмо' : 'Показать гизмо')}
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
        </ToolbarToggleButton>

        <ToolbarToggleButton
          pressed={showCeilingLight}
          onPressedChange={toggleCeilingLight}
          aria-label="Включить / выключить потолочный свет"
          tooltip={(p) => (p ? 'Выключить свет' : 'Включить свет')}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="inline"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M9.25 19.5C9.25 19.0858 9.58579 18.75 10 18.75H14C14.4142 18.75 14.75 19.0858 14.75 19.5C14.75 19.9142 14.4142 20.25 14 20.25H10C9.58579 20.25 9.25 19.9142 9.25 19.5ZM9.91667 22C9.91667 21.5858 10.2525 21.25 10.6667 21.25H13.3333C13.7475 21.25 14.0833 21.5858 14.0833 22C14.0833 22.4142 13.7475 22.75 13.3333 22.75H10.6667C10.2525 22.75 9.91667 22.4142 9.91667 22Z"
              fill="currentColor"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M4.25 8.21807C4.25 4.31332 7.80388 1.25 12 1.25C16.1961 1.25 19.75 4.31332 19.75 8.21807L19.75 8.22133C19.7404 10.4277 18.7914 12.6257 17.1055 14.2246L17.1035 14.2266L15.9994 15.2658C15.8403 15.4156 15.75 15.6245 15.75 15.843C15.75 16.8962 14.8962 17.75 13.843 17.75H10.157C9.10379 17.75 8.25 16.8962 8.25 15.843C8.25 15.6245 8.15976 15.4156 8.0006 15.2658L6.89654 14.2266L6.89447 14.2246C5.20862 12.6257 4.25961 10.4277 4.25001 8.22133L4.25 8.21807ZM5.75 8.21645C5.75824 10.002 6.53021 11.8113 7.92565 13.1353C7.926 13.1356 7.92635 13.136 7.9267 13.1363L9.02865 14.1735C9.48898 14.6068 9.75 15.2109 9.75 15.843C9.75 16.0678 9.93222 16.25 10.157 16.25H13.843C14.0678 16.25 14.25 16.0678 14.25 15.843C14.25 15.2109 14.511 14.6068 14.9713 14.1735L16.0733 13.1363C16.0736 13.136 16.074 13.1357 16.0743 13.1354C17.4698 11.8113 18.2418 10.002 18.25 8.21637C18.2489 5.29948 15.5352 2.75 12 2.75C8.46478 2.75 5.751 5.29953 5.75 8.21645Z"
              fill="currentColor"
            />
          </svg>
        </ToolbarToggleButton>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <span className="text-xs text-gray-400 mr-1">Выровнять:</span>
        {ALIGN_BUTTONS.map(({ type, title, label }) => (
          <Tooltip.Root key={type}>
            <Tooltip.Trigger asChild>
              <button
                type="button"
                disabled={selectedCount < 2}
                onClick={() => alignItems(type)}
                className="w-7 h-7 flex items-center justify-center rounded text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              >
                {label}
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="bg-gray-900 text-white text-xs rounded px-2 py-1 shadow-lg select-none"
                sideOffset={6}
              >
                {title}
                <Tooltip.Arrow className="fill-gray-900" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        ))}
      </div>
    </Tooltip.Provider>
  )
}
