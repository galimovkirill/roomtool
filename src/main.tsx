import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import './index.css'
import { AppLayout } from '@/components/ui/AppLayout'
import { ScreenGuard } from '@/components/ui/ScreenGuard'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ScreenGuard>
      <AppLayout>
        <div className="text-white p-4">Сцена (заглушка)</div>
        <div className="p-4">Панель (заглушка)</div>
      </AppLayout>
      <Toaster position="bottom-right" />
    </ScreenGuard>
  </StrictMode>
)
