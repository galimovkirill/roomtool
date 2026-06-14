import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SaveStatusIndicator } from './SaveStatusIndicator'
import { useSyncStore } from '@/store/syncStore'
import * as syncService from '@/api/syncService'
import type { SyncStatus } from '@/store/syncStore'

vi.mock('@/store/syncStore', () => ({
  useSyncStore: vi.fn(),
}))

vi.mock('@/api/syncService', () => ({
  syncNow: vi.fn().mockResolvedValue(undefined),
}))

function setStatus(status: SyncStatus) {
  vi.mocked(useSyncStore).mockImplementation(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sel: any) => sel({ status }) as ReturnType<typeof sel>
  )
}

describe('SaveStatusIndicator', () => {
  beforeEach(() => {
    setStatus('idle')
  })

  it('показывает "Сохранено" в состоянии idle', () => {
    render(<SaveStatusIndicator />)
    expect(screen.getByText('Сохранено')).toBeInTheDocument()
  })

  it('показывает спиннер и текст в состоянии syncing', () => {
    setStatus('syncing')
    render(<SaveStatusIndicator />)
    expect(screen.getByText('Сохранение...')).toBeInTheDocument()
  })

  it('показывает ошибку и кнопку "Повторить" в состоянии error', () => {
    setStatus('error')
    render(<SaveStatusIndicator />)
    expect(screen.getByText('Ошибка сохранения')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /повторить/i })).toBeInTheDocument()
  })

  it('вызывает syncNow по клику "Повторить"', () => {
    setStatus('error')
    render(<SaveStatusIndicator />)
    fireEvent.click(screen.getByRole('button', { name: /повторить/i }))
    expect(syncService.syncNow).toHaveBeenCalledOnce()
  })

  it('не рендерит кнопку "Повторить" в idle и syncing', () => {
    render(<SaveStatusIndicator />)
    expect(screen.queryByRole('button', { name: /повторить/i })).not.toBeInTheDocument()

    setStatus('syncing')
    render(<SaveStatusIndicator />)
    expect(screen.queryByRole('button', { name: /повторить/i })).not.toBeInTheDocument()
  })

  it('имеет aria-live на контейнере', () => {
    const { container } = render(<SaveStatusIndicator />)
    expect(container.firstChild).toHaveAttribute('aria-live', 'polite')
  })
})
