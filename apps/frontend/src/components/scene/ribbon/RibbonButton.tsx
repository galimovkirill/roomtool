import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const DEFAULT_CLS =
  'p-1.5 rounded transition-colors text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:bg-gray-100'

interface RibbonButtonProps {
  tooltip: string
  'aria-label': string
  onClick: () => void
  disabled?: boolean
  className?: string
  children: React.ReactNode
}

export function RibbonButton({
  tooltip,
  'aria-label': ariaLabel,
  onClick,
  disabled,
  className = DEFAULT_CLS,
  children,
}: RibbonButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={ariaLabel}
            disabled={disabled}
            className={className}
            onClick={onClick}
          >
            {children}
          </button>
        }
      />
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  )
}
