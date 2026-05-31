import { describe, expect, it } from 'vitest'
import { CATALOG_ITEMS, getCatalogByCategory, getCatalogItemById } from './items'

describe('getCatalogByCategory', () => {
  it('returns exactly 6 categories', () => {
    const byCategory = getCatalogByCategory()
    expect(Object.keys(byCategory)).toHaveLength(6)
  })

  it('contains all 6 categories', () => {
    const byCategory = getCatalogByCategory()
    expect(byCategory).toHaveProperty('Корпус')
    expect(byCategory).toHaveProperty('Наполнение')
    expect(byCategory).toHaveProperty('Двери и фасады')
    expect(byCategory).toHaveProperty('Основание')
    expect(byCategory).toHaveProperty('Фурнитура')
    expect(byCategory).toHaveProperty('Декорации')
  })

  it('Корпус has 4 items', () => {
    expect(getCatalogByCategory()['Корпус']).toHaveLength(4)
  })

  it('Наполнение has 5 items', () => {
    expect(getCatalogByCategory()['Наполнение']).toHaveLength(5)
  })

  it('Двери и фасады has 3 items', () => {
    expect(getCatalogByCategory()['Двери и фасады']).toHaveLength(3)
  })

  it('Основание has 3 items', () => {
    expect(getCatalogByCategory()['Основание']).toHaveLength(3)
  })

  it('Фурнитура has 3 items', () => {
    expect(getCatalogByCategory()['Фурнитура']).toHaveLength(3)
  })

  it('house-plant-1 is in Декорации', () => {
    const byCategory = getCatalogByCategory()
    expect(byCategory['Декорации']?.some((i) => i.id === 'house-plant-1')).toBe(true)
  })
})

describe('getCatalogItemById', () => {
  it.each(CATALOG_ITEMS)('returns item for id $id', (item) => {
    expect(getCatalogItemById(item.id)).toBe(item)
  })

  it('returns undefined for nonexistent id', () => {
    expect(getCatalogItemById('nonexistent')).toBeUndefined()
  })

  it('returns side-panel by id', () => {
    const item = getCatalogItemById('side-panel')
    expect(item).toBeDefined()
    expect(item?.name).toBe('Боковая панель')
  })
})

describe('CATALOG_ITEMS integrity', () => {
  it('all items have non-empty id, name, category', () => {
    for (const item of CATALOG_ITEMS) {
      expect(item.id).toBeTruthy()
      expect(item.name).toBeTruthy()
      expect(item.category).toBeTruthy()
    }
  })

  it('all ids are unique', () => {
    const ids = CATALOG_ITEMS.map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('all dimensions are positive numbers', () => {
    for (const item of CATALOG_ITEMS) {
      const { width, height, depth } = item.defaultDimensions
      expect(width).toBeGreaterThan(0)
      expect(height).toBeGreaterThan(0)
      expect(depth).toBeGreaterThan(0)
    }
  })

  it('select properties with explicit options have at least one option', () => {
    for (const item of CATALOG_ITEMS) {
      for (const prop of item.properties) {
        if (prop.type === 'select') {
          expect(prop.options).toBeDefined()
          expect(prop.options!.length).toBeGreaterThan(0)
        }
        if (prop.type === 'material' && prop.options !== undefined) {
          expect(prop.options.length).toBeGreaterThan(0)
        }
      }
    }
  })
})
