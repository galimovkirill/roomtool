import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useSceneStore } from '@/store'

const btnCls = 'p-1.5 rounded transition-colors text-gray-600 hover:bg-red-50 hover:text-red-600'

export function ResetSceneButton() {
  const resetScene = useSceneStore((s) => s.resetScene)

  function handleClick() {
    if (
      window.confirm('Сбросить сцену к исходному состоянию? Это действие нельзя отменить без Undo.')
    ) {
      resetScene()
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label="Сбросить сцену"
            className={btnCls}
            onClick={handleClick}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points="3 3 3 8 8 8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        }
      />
      <TooltipContent>Сбросить сцену</TooltipContent>
    </Tooltip>
  )
}
