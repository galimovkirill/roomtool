import createClient from 'openapi-fetch'
import type { paths } from './types.gen'

// baseUrl пустой — запросы идут на тот же origin; Vite proxy (см. vite.config.ts)
// перенаправляет /health и /api → бэкенд (localhost:8080 или backend:8080 в Docker)
export const apiClient = createClient<paths>({ baseUrl: '' })

export type { components, paths } from './types.gen'
