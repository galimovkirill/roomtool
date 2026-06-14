import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const btnCls =
  'p-1.5 rounded transition-colors text-gray-600 hover:bg-gray-100 flex items-center justify-center'

export function UserButton() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex items-center gap-2">
      {user && <span className="text-xs text-gray-500 hidden sm:block">{user.email}</span>}
      <Tooltip>
        <TooltipTrigger
          render={
            <button type="button" aria-label="Выйти" className={btnCls} onClick={handleLogout}>
              <LogOut size={15} />
            </button>
          }
        />
        <TooltipContent>Выйти</TooltipContent>
      </Tooltip>
    </div>
  )
}
