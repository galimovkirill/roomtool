import { useState, useRef, useEffect } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useSceneStore } from '@/store/sceneStore'
import type { AlignmentType } from '@/store/sceneStore'

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

export function AlignmentPopover() {
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
  )
}
