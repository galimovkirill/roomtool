import { useNavigate } from 'react-router-dom'
import { RibbonButton } from './RibbonButton'

export function BackButton() {
  const navigate = useNavigate()

  return (
    <RibbonButton
      tooltip="Мои сцены"
      aria-label="Вернуться к списку сцен"
      onClick={() => navigate('/files')}
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
          d="M19 12H5M5 12l7 7M5 12l7-7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </RibbonButton>
  )
}
