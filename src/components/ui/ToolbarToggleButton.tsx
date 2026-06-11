import * as Toggle from '@radix-ui/react-toggle'
import * as Tooltip from '@radix-ui/react-tooltip'

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
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <span className="inline-flex" tabIndex={-1}>
          <Toggle.Root
            pressed={pressed}
            onPressedChange={onPressedChange}
            aria-label={ariaLabel}
            className="px-2 py-1 rounded text-sm transition-colors cursor-pointer data-[state=off]:text-gray-500 data-[state=off]:border data-[state=off]:border-transparent data-[state=off]:hover:bg-gray-100 data-[state=off]:hover:text-gray-700 data-[state=on]:bg-blue-100 data-[state=on]:text-blue-600 data-[state=on]:border data-[state=on]:border-blue-300 data-[state=on]:hover:bg-blue-200 data-[state=on]:hover:text-blue-700"
          >
            {children}
          </Toggle.Root>
        </span>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          className="bg-gray-900 text-white text-xs rounded px-2 py-1 shadow-lg select-none"
          sideOffset={6}
        >
          {tooltipText}
          <Tooltip.Arrow className="fill-gray-900" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}
