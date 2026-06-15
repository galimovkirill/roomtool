import { useState } from 'react'
import { useSceneStore, useEditorStore } from '@/store'
import { RibbonButton } from './RibbonButton'

const BASE_CLS =
  'p-1.5 rounded transition-colors text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:bg-gray-100'

function toDeg(rad: number): number {
  const deg = (rad * 180) / Math.PI
  return Math.round(((deg % 360) + 360) % 360)
}

export function ItemActionsGroup() {
  const selectedItemIds = useEditorStore((s) => s.selectedItemIds)
  const rotateItem = useSceneStore((s) => s.rotateItem)
  const updateItem = useSceneStore((s) => s.updateItem)
  const removeItem = useSceneStore((s) => s.removeItem)

  const disabled = selectedItemIds.length !== 1
  const activeId = selectedItemIds[0]

  const activeRotationY = useSceneStore((s) => {
    if (!activeId) return 0
    return s.items.find((i) => i.id === activeId)?.rotationY ?? 0
  })

  const displayDeg = toDeg(activeRotationY)
  const [editing, setEditing] = useState(false)
  const [draftVal, setDraftVal] = useState('')

  const inputVal = editing ? draftVal : String(displayDeg)

  const commitInput = () => {
    setEditing(false)
    if (!activeId) return
    const parsed = parseInt(draftVal, 10)
    if (isNaN(parsed)) {
      return
    }
    const normalized = ((parsed % 360) + 360) % 360
    updateItem(activeId, { rotationY: normalized * (Math.PI / 180) })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled || !activeId) return
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      const step = e.shiftKey ? 5 : 1
      const current = toDeg(
        useSceneStore.getState().items.find((i) => i.id === activeId)?.rotationY ?? 0
      )
      const newDeg =
        e.key === 'ArrowUp' ? (current + step) % 360 : (((current - step) % 360) + 360) % 360
      updateItem(activeId, { rotationY: newDeg * (Math.PI / 180) })
    } else if (e.key === 'Enter') {
      e.currentTarget.blur()
    } else if (e.key === 'Escape') {
      setEditing(false)
      e.currentTarget.blur()
    }
  }

  return (
    <div className="flex items-center gap-0.5">
      <RibbonButton
        tooltip="Повернуть влево"
        aria-label="Повернуть влево"
        disabled={disabled}
        onClick={() => activeId && rotateItem(activeId, 'left')}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <polyline
            points="1 4 1 10 7 10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M3.51 15a9 9 0 1 0 .49-4.14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </RibbonButton>

      <RibbonButton
        tooltip="Повернуть вправо"
        aria-label="Повернуть вправо"
        disabled={disabled}
        onClick={() => activeId && rotateItem(activeId, 'right')}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <polyline
            points="23 4 23 10 17 10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M20.49 15a9 9 0 1 1-.49-4.14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </RibbonButton>

      <div className="relative mx-0.5" title="Угол поворота (↑↓ ±1°, Shift ±5°)">
        <input
          type="text"
          inputMode="numeric"
          value={inputVal}
          disabled={disabled}
          className="w-12 pr-4 text-center border border-gray-200 rounded px-1 py-1 text-xs text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-blue-400 bg-transparent"
          onChange={(e) => {
            setEditing(true)
            setDraftVal(e.target.value)
          }}
          onFocus={() => {
            setDraftVal(String(displayDeg))
            setEditing(true)
          }}
          onBlur={commitInput}
          onKeyDown={handleKeyDown}
          aria-label="Угол поворота в градусах"
        />
        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
          °
        </span>
      </div>

      <div className="w-px h-5 bg-gray-200 mx-0.5" />

      <RibbonButton
        tooltip="Удалить элемент"
        aria-label="Удалить элемент"
        disabled={disabled}
        className={`${BASE_CLS} enabled:hover:bg-red-50 enabled:hover:text-red-600`}
        onClick={() => activeId && removeItem(activeId)}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <polyline
            points="3 6 5 6 21 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line
            x1="10"
            y1="11"
            x2="10"
            y2="17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="14"
            y1="11"
            x2="14"
            y2="17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </RibbonButton>
    </div>
  )
}
