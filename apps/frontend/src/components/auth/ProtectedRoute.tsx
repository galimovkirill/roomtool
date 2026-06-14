import { useEffect, useRef } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { initScene } from '@/api/syncService'

export function ProtectedRoute() {
  const { status, checkAuth } = useAuthStore()
  const initCalled = useRef(false)

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (status === 'authenticated' && !initCalled.current) {
      initCalled.current = true
      initScene()
    }
  }, [status])

  if (status === 'loading') {
    return (
      <div className="flex min-h-svh items-center justify-center text-muted-foreground text-sm">
        Загрузка...
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
