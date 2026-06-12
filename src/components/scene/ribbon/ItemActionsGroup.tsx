import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useSceneStore } from '@/store'

const btnCls =
  'p-1.5 rounded transition-colors text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:bg-gray-100'

export function ItemActionsGroup() {
  const selectedItemId = useSceneStore((s) => s.selectedItemId)
  const rotateItem = useSceneStore((s) => s.rotateItem)
  const removeItem = useSceneStore((s) => s.removeItem)

  const disabled = selectedItemId === null

  return (
    <div className="flex items-center gap-0.5">
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              aria-label="Повернуть влево"
              disabled={disabled}
              className={btnCls}
              onClick={() => selectedItemId && rotateItem(selectedItemId, 'left')}
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
            </button>
          }
        />
        <TooltipContent>Повернуть влево</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              aria-label="Повернуть вправо"
              disabled={disabled}
              className={btnCls}
              onClick={() => selectedItemId && rotateItem(selectedItemId, 'right')}
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
            </button>
          }
        />
        <TooltipContent>Повернуть вправо</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              aria-label="Удалить элемент"
              disabled={disabled}
              className={`${btnCls} enabled:hover:bg-red-50 enabled:hover:text-red-600`}
              onClick={() => selectedItemId && removeItem(selectedItemId)}
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
            </button>
          }
        />
        <TooltipContent>Удалить элемент</TooltipContent>
      </Tooltip>
    </div>
  )
}
