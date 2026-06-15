import createClient from 'openapi-fetch'
import type { paths } from './types.gen'

// baseUrl пустой — запросы идут на тот же origin; Vite proxy (см. vite.config.ts)
// перенаправляет /health и /api → бэкенд (localhost:8080 или backend:8080 в Docker)
export const apiClient = createClient<paths>({ baseUrl: '' })

let refreshPromise: Promise<boolean> | null = null

function tryRefreshToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch('/api/v1/auth/refresh', { method: 'POST' })
      .then((r) => r.ok)
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

// Transparent token refresh: on 401, try /auth/refresh once, then retry original request.
// Auth endpoints are excluded to prevent infinite loops.
apiClient.use({
  async onResponse({ response, request }) {
    if (response.status !== 401) return response
    if (request.url.includes('/api/v1/auth/')) return response
    const refreshed = await tryRefreshToken()
    if (refreshed) return fetch(request.clone())
    return response
  },
})

export type { components, paths } from './types.gen'
