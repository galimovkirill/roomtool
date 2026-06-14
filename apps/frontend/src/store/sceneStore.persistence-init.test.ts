import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SceneGroup, SceneItem } from '@/types'
import type { SceneSnapshot } from './persistence'

const SAVED_ITEM: SceneItem = {
  id: 'saved-item',
  catalogId: 'shelf',
  name: 'Полка',
  position: [100, 200, 0],
  rotationY: 0,
  dimensions: { width: 860, height: 16, depth: 560 },
  properties: { material: 'ЛДСП', color: '#F5F5F0' },
  groupId: null,
}

const SAVED_GROUP: SceneGroup = {
  id: 'saved-group',
  name: 'Сохранённая группа',
  itemIds: ['saved-item'],
  collapsed: false,
}

const SAVED_SNAPSHOT: SceneSnapshot = {
  version: 1,
  items: [SAVED_ITEM],
  groups: [SAVED_GROUP],
}

vi.mock('./persistence', () => ({
  loadScene: vi.fn(() => SAVED_SNAPSHOT),
  saveScene: vi.fn(),
  clearScene: vi.fn(),
}))

describe('sceneStore — инициализация из localStorage', () => {
  beforeEach(async () => {
    vi.resetModules()
  })

  it('items и groups берутся из сохранённого снапшота при первом импорте', async () => {
    const { useSceneStore } = await import('./sceneStore')
    const state = useSceneStore.getState()
    expect(state.items).toHaveLength(1)
    expect(state.items[0].id).toBe('saved-item')
    expect(state.groups).toHaveLength(1)
    expect(state.groups[0].id).toBe('saved-group')
  })
})
