import { useState, useRef, useEffect } from 'react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useUIStore } from '@/store/uiStore'
import { useSceneStore } from '@/store/sceneStore'
import type { AlignmentType } from '@/store/sceneStore'
import { ToolbarToggleButton } from '@/components/ui/ToolbarToggleButton'

function AlignTriggerIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="inline"
    >
      <rect x="2" y="3" width="12" height="2" rx="0.5" fill="currentColor" />
      <rect x="2" y="7" width="8" height="2" rx="0.5" fill="currentColor" />
      <rect x="2" y="11" width="10" height="2" rx="0.5" fill="currentColor" />
    </svg>
  )
}

function AlignLeftIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="2" y="1.5" width="1.5" height="13" rx="0.5" fill="currentColor" />
      <rect x="4.5" y="3" width="9" height="3" rx="0.5" fill="currentColor" />
      <rect x="4.5" y="9.5" width="5.5" height="3" rx="0.5" fill="currentColor" />
    </svg>
  )
}

function AlignCenterXIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="7.25" y="1.5" width="1.5" height="13" rx="0.5" fill="currentColor" />
      <rect x="2.25" y="3" width="11.5" height="3" rx="0.5" fill="currentColor" />
      <rect x="4.25" y="9.5" width="7.5" height="3" rx="0.5" fill="currentColor" />
    </svg>
  )
}

function AlignRightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="12.5" y="1.5" width="1.5" height="13" rx="0.5" fill="currentColor" />
      <rect x="3" y="3" width="9.5" height="3" rx="0.5" fill="currentColor" />
      <rect x="7" y="9.5" width="5.5" height="3" rx="0.5" fill="currentColor" />
    </svg>
  )
}

function AlignTopIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="1.5" y="2" width="13" height="1.5" rx="0.5" fill="currentColor" />
      <rect x="3" y="3.5" width="3" height="9" rx="0.5" fill="currentColor" />
      <rect x="9.5" y="3.5" width="3" height="5.5" rx="0.5" fill="currentColor" />
    </svg>
  )
}

function AlignCenterYIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="1.5" y="7.25" width="13" height="1.5" rx="0.5" fill="currentColor" />
      <rect x="3" y="2.25" width="3" height="11.5" rx="0.5" fill="currentColor" />
      <rect x="9.5" y="4.25" width="3" height="7.5" rx="0.5" fill="currentColor" />
    </svg>
  )
}

function AlignBottomIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="1.5" y="12.5" width="13" height="1.5" rx="0.5" fill="currentColor" />
      <rect x="3" y="3" width="3" height="9.5" rx="0.5" fill="currentColor" />
      <rect x="9.5" y="7" width="3" height="5.5" rx="0.5" fill="currentColor" />
    </svg>
  )
}

function AlignFrontIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="2" y="1.5" width="1.5" height="13" rx="0.5" fill="currentColor" />
      <rect x="4.5" y="3" width="4" height="4" rx="0.5" fill="currentColor" />
      <rect x="4.5" y="9.5" width="4" height="4" rx="0.5" fill="currentColor" />
    </svg>
  )
}

function AlignCenterZIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="7.25" y="1.5" width="1.5" height="13" rx="0.5" fill="currentColor" />
      <rect x="6" y="3" width="4" height="4" rx="0.5" fill="currentColor" />
      <rect x="6" y="9.5" width="4" height="4" rx="0.5" fill="currentColor" />
    </svg>
  )
}

function AlignBackIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="12.5" y="1.5" width="1.5" height="13" rx="0.5" fill="currentColor" />
      <rect x="8.5" y="3" width="4" height="4" rx="0.5" fill="currentColor" />
      <rect x="8.5" y="9.5" width="4" height="4" rx="0.5" fill="currentColor" />
    </svg>
  )
}

interface AlignButton {
  type: AlignmentType
  title: string
  icon: React.ReactNode
}

const ALIGN_GROUPS: { label: string; buttons: AlignButton[] }[] = [
  {
    label: 'X',
    buttons: [
      { type: 'left', title: 'По левой грани (X−)', icon: <AlignLeftIcon /> },
      { type: 'centerX', title: 'По центру X', icon: <AlignCenterXIcon /> },
      { type: 'right', title: 'По правой грани (X+)', icon: <AlignRightIcon /> },
    ],
  },
  {
    label: 'Y',
    buttons: [
      { type: 'top', title: 'По верхней грани (Y+)', icon: <AlignTopIcon /> },
      { type: 'centerY', title: 'По центру Y', icon: <AlignCenterYIcon /> },
      { type: 'bottom', title: 'По нижней грани (Y−)', icon: <AlignBottomIcon /> },
    ],
  },
  {
    label: 'Z',
    buttons: [
      { type: 'front', title: 'По передней грани (Z−)', icon: <AlignFrontIcon /> },
      { type: 'centerZ', title: 'По центру Z', icon: <AlignCenterZIcon /> },
      { type: 'back', title: 'По задней грани (Z+)', icon: <AlignBackIcon /> },
    ],
  },
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
  const [alignOpen, setAlignOpen] = useState(false)
  const alignRef = useRef<HTMLDivElement>(null)
  const effectiveAlignOpen = alignOpen && selectedCount >= 2

  useEffect(() => {
    if (!effectiveAlignOpen) return
    function handleMouseDown(e: MouseEvent) {
      if (alignRef.current && !alignRef.current.contains(e.target as Node)) {
        setAlignOpen(false)
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setAlignOpen(false)
    }
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [effectiveAlignOpen])

  return (
    <div className="flex items-center gap-1 px-3 h-10 bg-white border-b border-gray-200 shrink-0">
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

      <div className="relative" ref={alignRef}>
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                disabled={selectedCount < 2}
                onClick={() => setAlignOpen((o) => !o)}
                aria-label="Выровнять элементы"
                aria-expanded={effectiveAlignOpen}
                aria-haspopup="true"
                className="px-2 py-1 rounded text-sm transition-colors cursor-pointer text-gray-500 border border-transparent hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed aria-[expanded=true]:bg-blue-100 aria-[expanded=true]:text-blue-600 aria-[expanded=true]:border-blue-300"
              />
            }
          >
            <AlignTriggerIcon />
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={6}>
            Выровнять
          </TooltipContent>
        </Tooltip>

        {effectiveAlignOpen && (
          <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-lg border border-gray-200 shadow-lg p-2 min-w-max">
            <div className="flex flex-col">
              {ALIGN_GROUPS.map(({ label, buttons }, i) => (
                <div key={label}>
                  {i > 0 && <div className="h-px bg-gray-200 my-1.5" />}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-gray-400 select-none w-3 text-center">
                      {label}
                    </span>
                    <div className="flex gap-0.5">
                      {buttons.map(({ type, title, icon }) => (
                        <Tooltip key={type}>
                          <TooltipTrigger
                            render={
                              <button
                                type="button"
                                onClick={() => {
                                  alignItems(type)
                                  setAlignOpen(false)
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                              />
                            }
                          >
                            {icon}
                          </TooltipTrigger>
                          <TooltipContent side="bottom" sideOffset={6}>
                            {title}
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
