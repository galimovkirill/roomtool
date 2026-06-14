import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearScene, loadScene, saveScene, type SceneSnapshot } from './persistence'
import type { SceneGroup, SceneItem } from '@/types'

const SCENE_ID = 'test-scene-123'
const STORAGE_KEY = `roomtool_scene_${SCENE_ID}_v1`

const ITEM: SceneItem = {
  id: 'test-item',
  catalogId: 'side-panel',
  name: 'Боковая панель',
  position: [0, 1100, 0],
  rotationY: 0,
  dimensions: { width: 16, height: 2200, depth: 600 },
  properties: { material: 'ЛДСП', color: '#F5F5F0' },
  groupId: null,
}

const GROUP: SceneGroup = {
  id: 'g1',
  name: 'Группа 1',
  itemIds: ['test-item'],
  collapsed: false,
}

const SNAPSHOT: SceneSnapshot = { version: 1, items: [ITEM], groups: [GROUP] }

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('saveScene', () => {
  it('saves valid JSON to localStorage under the correct per-scene key', () => {
    saveScene(SNAPSHOT, SCENE_ID)
    const raw = localStorage.getItem(STORAGE_KEY)
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!)
    expect(parsed.version).toBe(1)
    expect(parsed.items).toHaveLength(1)
    expect(parsed.groups).toHaveLength(1)
  })

  it('does not throw when localStorage.setItem throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError')
    })
    expect(() => saveScene(SNAPSHOT, SCENE_ID)).not.toThrow()
  })
})

describe('loadScene', () => {
  it('returns null when key is absent', () => {
    expect(loadScene(SCENE_ID)).toBeNull()
  })

  it('returns the snapshot when key contains valid data', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SNAPSHOT))
    const result = loadScene(SCENE_ID)
    expect(result).not.toBeNull()
    expect(result!.version).toBe(1)
    expect(result!.items).toHaveLength(1)
    expect(result!.groups).toHaveLength(1)
  })

  it('returns null when JSON.parse throws', () => {
    localStorage.setItem(STORAGE_KEY, 'not-valid-json{{{')
    expect(loadScene(SCENE_ID)).toBeNull()
  })

  it('returns null when version !== 1', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, items: [], groups: [] }))
    expect(loadScene(SCENE_ID)).toBeNull()
  })

  it('returns null when items is not an array', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, items: null, groups: [] }))
    expect(loadScene(SCENE_ID)).toBeNull()
  })

  it('returns null when groups is not an array', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, items: [], groups: 'bad' }))
    expect(loadScene(SCENE_ID)).toBeNull()
  })

  it('uses a different key per sceneId', () => {
    saveScene(SNAPSHOT, 'scene-a')
    expect(loadScene('scene-b')).toBeNull()
    expect(loadScene('scene-a')).not.toBeNull()
  })
})

describe('clearScene', () => {
  it('removes the key from localStorage', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SNAPSHOT))
    clearScene(SCENE_ID)
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})
