import { beforeAll, beforeEach, afterAll, describe, expect, it, vi } from 'vitest'
import type { SceneGroup, SceneItem } from '@/types'

const mockSetSyncStatus = vi.fn()
const mockSetSceneId = vi.fn()
const mockSyncStoreState: {
  sceneId: string | null
  setSyncStatus: ReturnType<typeof vi.fn>
  setSceneId: ReturnType<typeof vi.fn>
} = {
  sceneId: 'scene-abc',
  setSyncStatus: mockSetSyncStatus,
  setSceneId: mockSetSceneId,
}

const mockSceneStoreState = {
  items: [] as SceneItem[],
  groups: [] as SceneGroup[],
  loadScene: vi.fn(),
}

vi.mock('@/store/syncStore', () => ({
  useSyncStore: { getState: vi.fn(() => mockSyncStoreState) },
}))

vi.mock('@/store/sceneStore', () => ({
  useSceneStore: {
    getState: vi.fn(() => mockSceneStoreState),
    subscribe: vi.fn(),
  },
}))

const mockPUT = vi.fn()
const mockPOST = vi.fn()
const mockGET = vi.fn()

vi.mock('@/api/client', () => ({
  apiClient: {
    PUT: mockPUT,
    POST: mockPOST,
    GET: mockGET,
  },
}))

beforeAll(() => {
  vi.useFakeTimers()
})

afterAll(() => {
  vi.useRealTimers()
})

beforeEach(() => {
  vi.clearAllTimers()
  vi.clearAllMocks()
  mockSyncStoreState.sceneId = 'scene-abc'
  mockPUT.mockResolvedValue({ response: { status: 200 }, data: {} })
  mockPOST.mockResolvedValue({ response: { status: 201 }, data: { id: 'new-id' } })
  mockGET.mockResolvedValue({
    response: { status: 200 },
    data: { data: { items: [], groups: [] } },
  })
  mockSetSyncStatus.mockReset()
  mockSetSceneId.mockReset()
})

describe('scheduleSync', () => {
  it('does not call PUT before 1500ms', async () => {
    const { scheduleSync } = await import('./syncService')
    scheduleSync([], [])
    await vi.advanceTimersByTimeAsync(1499)
    expect(mockPUT).not.toHaveBeenCalled()
  })

  it('calls PUT after 1500ms', async () => {
    const { scheduleSync } = await import('./syncService')
    scheduleSync([], [])
    await vi.advanceTimersByTimeAsync(1500)
    expect(mockPUT).toHaveBeenCalledOnce()
  })

  it('only sends one PUT when called multiple times (debounce)', async () => {
    const { scheduleSync } = await import('./syncService')
    scheduleSync([], [])
    await vi.advanceTimersByTimeAsync(500)
    scheduleSync([], [])
    await vi.advanceTimersByTimeAsync(500)
    scheduleSync([], [])
    await vi.advanceTimersByTimeAsync(1500)
    expect(mockPUT).toHaveBeenCalledOnce()
  })

  it('skips PUT when sceneId is null', async () => {
    mockSyncStoreState.sceneId = null
    const { scheduleSync } = await import('./syncService')
    scheduleSync([], [])
    await vi.advanceTimersByTimeAsync(1500)
    expect(mockPUT).not.toHaveBeenCalled()
  })

  it('sets syncing then idle status', async () => {
    const { scheduleSync } = await import('./syncService')
    scheduleSync([], [])
    await vi.advanceTimersByTimeAsync(1500)
    await Promise.resolve() // flush microtasks
    expect(mockSetSyncStatus).toHaveBeenCalledWith('syncing')
    expect(mockSetSyncStatus).toHaveBeenCalledWith('idle')
  })

  it('creates new scene and retries on 404', async () => {
    mockPUT.mockResolvedValueOnce({ response: { status: 404 }, data: null })
    mockPUT.mockResolvedValueOnce({ response: { status: 200 }, data: {} })
    const { scheduleSync } = await import('./syncService')
    scheduleSync([], [])
    await vi.runAllTimersAsync()
    expect(mockPOST).toHaveBeenCalledOnce()
    expect(mockPUT).toHaveBeenCalledTimes(2)
  })
})

describe('syncNow', () => {
  it('calls PUT immediately without waiting', async () => {
    const { syncNow } = await import('./syncService')
    const promise = syncNow()
    expect(mockPUT).toHaveBeenCalledOnce()
    await promise
  })

  it('cancels pending debounce timer', async () => {
    const { scheduleSync, syncNow } = await import('./syncService')
    scheduleSync([], [])
    await syncNow()
    // Advance past debounce window — the cancelled timer should NOT fire again
    await vi.advanceTimersByTimeAsync(1500)
    expect(mockPUT).toHaveBeenCalledOnce()
  })

  it('sets syncing then idle status on success', async () => {
    const { syncNow } = await import('./syncService')
    await syncNow()
    expect(mockSetSyncStatus).toHaveBeenCalledWith('syncing')
    expect(mockSetSyncStatus).toHaveBeenCalledWith('idle')
  })

  it('sets error status on failure', async () => {
    mockPUT.mockRejectedValueOnce(new Error('network'))
    const { syncNow } = await import('./syncService')
    await syncNow()
    expect(mockSetSyncStatus).toHaveBeenCalledWith('error')
  })
})
