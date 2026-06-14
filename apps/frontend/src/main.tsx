import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import './index.css'
import { ScreenGuard } from '@/components/ui/ScreenGuard'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { FilesPage } from '@/pages/FilesPage'
import { EditorPage } from '@/pages/EditorPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<Navigate to="/files" replace />} />
        <Route
          path="/files"
          element={
            <ProtectedRoute>
              <FilesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/editor/:id"
          element={
            <ProtectedRoute>
              <ScreenGuard>
                <EditorPage />
              </ScreenGuard>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/files" replace />} />
      </Routes>
      <Toaster position="bottom-right" />
    </BrowserRouter>
  </StrictMode>
)
