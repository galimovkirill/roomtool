import { useState } from 'react'
import { SquareDashedBottom } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useSceneStore, selectRoom } from '@/store/sceneStore'
import type { SceneItem, RoomDimensions } from '@/types'

const ROOM_FIELDS = [
  { key: 'width', label: 'Ширина', min: 1000, max: 50000 },
  { key: 'depth', label: 'Глубина', min: 1000, max: 50000 },
  { key: 'height', label: 'Высота', min: 1000, max: 10000 },
] as const

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function clampDraft(d: RoomDimensions): RoomDimensions {
  const result = { ...d }
  for (const { key, min, max } of ROOM_FIELDS) {
    result[key] = clamp(d[key], min, max)
  }
  return result
}

function countOutOfBounds(items: SceneItem[], dims: RoomDimensions): number {
  return items.filter((item) => {
    const hw = item.dimensions.width / 2
    const hd = item.dimensions.depth / 2
    const [x, y, z] = item.position
    return (
      x + hw > dims.width / 2 ||
      x - hw < -dims.width / 2 ||
      z + hd > dims.depth / 2 ||
      z - hd < -dims.depth / 2 ||
      y + item.dimensions.height / 2 > dims.height
    )
  }).length
}

export function RoomSettingsPopover() {
  const room = useSceneStore(selectRoom)
  const setRoomDimensions = useSceneStore((s) => s.setRoomDimensions)
  const items = useSceneStore((s) => s.items)

  const [draft, setDraft] = useState<RoomDimensions>({ ...room })
  const [confirmMode, setConfirmMode] = useState(false)
  const [open, setOpen] = useState(false)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setDraft({ ...room })
      setConfirmMode(false)
    }
  }

  function handleApply() {
    const clamped = clampDraft(draft)
    setDraft(clamped)
    const outCount = countOutOfBounds(items, clamped)
    if (outCount > 0) {
      setConfirmMode(true)
      return
    }
    setRoomDimensions(clamped)
    setOpen(false)
  }

  function handleConfirm() {
    setRoomDimensions(clampDraft(draft))
    setOpen(false)
    setConfirmMode(false)
  }

  function handleCancel() {
    if (confirmMode) {
      setConfirmMode(false)
    } else {
      setOpen(false)
    }
  }

  const outCount = confirmMode ? countOutOfBounds(items, draft) : 0

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              aria-label="Настройки комнаты"
              className="px-2 py-1 rounded text-sm transition-colors cursor-pointer text-gray-500 border border-transparent hover:bg-gray-100 hover:text-gray-700 data-[popup-open]:bg-blue-100 data-[popup-open]:text-blue-600 data-[popup-open]:border-blue-300"
            />
          }
        >
          <SquareDashedBottom size={16} />
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={6}>
          Размеры комнаты
        </TooltipContent>
      </Tooltip>

      <PopoverContent side="bottom" align="start" sideOffset={4} className="w-64 p-3">
        {confirmMode ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-700">
              {outCount}{' '}
              {outCount === 1
                ? 'элемент окажется'
                : outCount < 5
                  ? 'элемента окажутся'
                  : 'элементов окажутся'}{' '}
              за пределами комнаты. Применить всё равно?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-1.5 text-sm rounded border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Применить
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              {ROOM_FIELDS.map(({ key, label, min, max }) => (
                <label key={key} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-gray-600 w-16 shrink-0">{label}</span>
                  <div className="flex items-center gap-1.5 flex-1">
                    <input
                      type="number"
                      min={min}
                      max={max}
                      step={100}
                      value={draft[key]}
                      onChange={(e) => {
                        const raw = Number(e.target.value)
                        setDraft((d) => ({ ...d, [key]: raw }))
                      }}
                      onBlur={(e) => {
                        const raw = Number(e.target.value)
                        setDraft((d) => ({ ...d, [key]: clamp(raw, min, max) }))
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 text-right"
                    />
                    <span className="text-xs text-gray-400 shrink-0">мм</span>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-1.5 text-sm rounded border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Применить
              </button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
