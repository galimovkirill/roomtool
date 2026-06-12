import { ToolbarToggleButton } from '@/components/ui/ToolbarToggleButton'
import { useUIStore } from '@/store/uiStore'

export function GizmoToggle() {
  const showGizmo = useUIStore((s) => s.showGizmo)
  const toggleGizmo = useUIStore((s) => s.toggleGizmo)

  return (
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
  )
}
