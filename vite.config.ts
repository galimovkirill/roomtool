import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // Логика, которую обязаны держать под тестами. R3F-компоненты не монтируются
      // в jsdom (нет WebGL), поэтому исключены из метрики — их поведение проверяется
      // через вынесенную в utils/ чистую логику и ручной Playwright.
      include: ['src/store/**', 'src/utils/**', 'src/catalog/**'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/store/defaultScene.ts'],
      // Пороги — «пол регрессии» (текущие значения ~97/80/97/98). Заданы с запасом
      // ниже фактических, чтобы гейт не падал ложно на одной новой ветке. Поднимать
      // по мере роста покрытия — снижать запрещено.
      thresholds: {
        statements: 90,
        branches: 75,
        functions: 90,
        lines: 90,
      },
    },
  },
})
