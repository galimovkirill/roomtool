import { beforeEach, describe, expect, it } from 'vitest'
import { useUIStore } from './uiStore'

beforeEach(() => {
  useUIStore.setState({
    sceneMode: '3d',
    activeRightPanelTab: 'catalog',
    showGizmo: true,
    showCeilingLight: true,
  })
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

  it('toggleGizmo переключает showGizmo', () => {
    const { showGizmo, toggleGizmo } = useUIStore.getState()
    expect(showGizmo).toBe(true)
    toggleGizmo()
    expect(useUIStore.getState().showGizmo).toBe(false)
    toggleGizmo()
    expect(useUIStore.getState().showGizmo).toBe(true)
  })

  it('showCeilingLight по умолчанию true', () => {
    expect(useUIStore.getState().showCeilingLight).toBe(true)
  })

  it('toggleCeilingLight переключает showCeilingLight', () => {
    const { toggleCeilingLight } = useUIStore.getState()
    toggleCeilingLight()
    expect(useUIStore.getState().showCeilingLight).toBe(false)
    toggleCeilingLight()
    expect(useUIStore.getState().showCeilingLight).toBe(true)
  })
})
