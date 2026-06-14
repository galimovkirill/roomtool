import { beforeEach, describe, expect, it } from 'vitest'
import { useSyncStore } from './syncStore'

beforeEach(() => {
  useSyncStore.setState({ status: 'idle', sceneId: null, sceneName: null })
})

describe('useSyncStore', () => {
  it('initial state', () => {
    const s = useSyncStore.getState()
    expect(s.status).toBe('idle')
    expect(s.sceneId).toBeNull()
    expect(s.sceneName).toBeNull()
  })

  it('setSyncStatus', () => {
    useSyncStore.getState().setSyncStatus('syncing')
    expect(useSyncStore.getState().status).toBe('syncing')
  })

  it('setSceneId', () => {
    useSyncStore.getState().setSceneId('abc')
    expect(useSyncStore.getState().sceneId).toBe('abc')
    useSyncStore.getState().setSceneId(null)
    expect(useSyncStore.getState().sceneId).toBeNull()
  })

  it('setSceneName', () => {
    useSyncStore.getState().setSceneName('Моя сцена')
    expect(useSyncStore.getState().sceneName).toBe('Моя сцена')
  })

  it('clearSceneId resets sceneId, sceneName, and status', () => {
    useSyncStore.setState({ sceneId: 'xyz', sceneName: 'test', status: 'syncing' })
    useSyncStore.getState().clearSceneId()
    const s = useSyncStore.getState()
    expect(s.sceneId).toBeNull()
    expect(s.sceneName).toBeNull()
    expect(s.status).toBe('idle')
  })
})
