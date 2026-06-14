import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import './index.css'
import { AppLayout } from '@/components/ui/AppLayout'
import { ScreenGuard } from '@/components/ui/ScreenGuard'
import { SceneCanvas } from '@/components/scene/SceneCanvas'
import { RightPanel } from '@/components/panels/RightPanel'
import { initScene } from '@/api/syncService'

// Fire-and-forget: app renders immediately with localStorage data;
// server data loads in the background and updates the store when ready.
initScene()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ScreenGuard>
      <AppLayout>
        <SceneCanvas />
        <RightPanel />
      </AppLayout>
      <Toaster position="bottom-right" />
    </ScreenGuard>
  </StrictMode>
)
