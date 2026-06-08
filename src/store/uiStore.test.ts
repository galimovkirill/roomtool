import { beforeEach, describe, expect, it } from 'vitest'
import { useUIStore } from './uiStore'

beforeEach(() => {
  useUIStore.setState({ sceneMode: '3d', activeRightPanelTab: 'catalog' })
})

describe('uiStore', () => {
  it('defaults to 3d scene mode and catalog tab', () => {
    const s = useUIStore.getState()
    expect(s.sceneMode).toBe('3d')
    expect(s.activeRightPanelTab).toBe('catalog')
  })

  it('setSceneMode switches to 2d', () => {
    useUIStore.getState().setSceneMode('2d')
    expect(useUIStore.getState().sceneMode).toBe('2d')
  })

  it('setActiveRightPanelTab switches to layers', () => {
    useUIStore.getState().setActiveRightPanelTab('layers')
    expect(useUIStore.getState().activeRightPanelTab).toBe('layers')
  })
})
