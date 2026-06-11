import { Toggle } from '@/components/ui/toggle'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface ToolbarToggleButtonProps {
  pressed: boolean
  onPressedChange: (pressed: boolean) => void
  tooltip: string | ((pressed: boolean) => string)
  'aria-label': string
  children: React.ReactNode
}

export function ToolbarToggleButton({
  pressed,
  onPressedChange,
  tooltip,
  'aria-label': ariaLabel,
  children,
}: ToolbarToggleButtonProps) {
  const tooltipText = typeof tooltip === 'function' ? tooltip(pressed) : tooltip

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" tabIndex={-1} />}>
        <Toggle
          pressed={pressed}
          onPressedChange={onPressedChange}
          aria-label={ariaLabel}
          className="px-2 py-1 rounded text-sm transition-colors cursor-pointer text-gray-500 border border-transparent hover:bg-gray-100 hover:text-gray-700 aria-pressed:bg-blue-100 aria-pressed:text-blue-600 aria-pressed:border-blue-300 aria-pressed:hover:bg-blue-200 aria-pressed:hover:text-blue-700"
        >
          {children}
        </Toggle>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={6}>
        {tooltipText}
      </TooltipContent>
    </Tooltip>
  )
}
