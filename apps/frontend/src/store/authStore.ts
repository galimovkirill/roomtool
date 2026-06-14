import { create } from 'zustand'
import { apiClient } from '@/api/client'
import type { components } from '@/api/client'
import { cancelSync } from '@/api/syncService'
import { useSceneStore } from './sceneStore'
import { useSyncStore } from './syncStore'

type User = components['schemas']['User']

interface AuthState {
  user: User | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
  checkAuth: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'loading',

  checkAuth: async () => {
    try {
      const { data, response } = await apiClient.GET('/api/v1/auth/me')
      if (response.ok && data) {
        set({ user: data.user, status: 'authenticated' })
      } else {
        set({ user: null, status: 'unauthenticated' })
      }
    } catch {
      set({ user: null, status: 'unauthenticated' })
    }
  },

  login: async (email, password) => {
    const { data, error } = await apiClient.POST('/api/v1/auth/login', {
      body: { email, password },
    })
    if (error) throw new Error((error as { message?: string }).message ?? 'Login failed')
    if (data) set({ user: data.user, status: 'authenticated' })
  },

  register: async (email, password) => {
    const { data, error } = await apiClient.POST('/api/v1/auth/register', {
      body: { email, password },
    })
    if (error) throw new Error((error as { message?: string }).message ?? 'Registration failed')
    if (data) set({ user: data.user, status: 'authenticated' })
  },

  logout: async () => {
    cancelSync()
    try {
      await apiClient.POST('/api/v1/auth/logout')
    } catch {
      // ignore network errors on logout
    }
    useSceneStore.getState().resetScene()
    useSyncStore.getState().clearSceneId()
    set({ user: null, status: 'unauthenticated' })
  },
}))
