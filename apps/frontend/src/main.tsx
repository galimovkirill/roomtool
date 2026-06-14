import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import './index.css'
import { AppLayout } from '@/components/ui/AppLayout'
import { ScreenGuard } from '@/components/ui/ScreenGuard'
import { SceneCanvas } from '@/components/scene/SceneCanvas'
import { RightPanel } from '@/components/panels/RightPanel'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route
            path="/"
            element={
              <ScreenGuard>
                <AppLayout>
                  <SceneCanvas />
                  <RightPanel />
                </AppLayout>
              </ScreenGuard>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="bottom-right" />
    </BrowserRouter>
  </StrictMode>
)
