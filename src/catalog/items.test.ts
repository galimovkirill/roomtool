import { describe, expect, it } from 'vitest'
import { CATALOG_ITEMS, getCatalogByCategory, getCatalogItemById } from './items'

describe('getCatalogByCategory', () => {
  it('returns exactly 3 categories', () => {
    const byCategory = getCatalogByCategory()
    expect(Object.keys(byCategory)).toHaveLength(3)
  })

  it('contains Корпуса, Наполнение, Двери', () => {
    const byCategory = getCatalogByCategory()
    expect(byCategory).toHaveProperty('Корпуса')
    expect(byCategory).toHaveProperty('Наполнение')
    expect(byCategory).toHaveProperty('Двери')
  })

  it('Корпуса has 2 items', () => {
    expect(getCatalogByCategory()['Корпуса']).toHaveLength(2)
  })

  it('Наполнение has 3 items', () => {
    expect(getCatalogByCategory()['Наполнение']).toHaveLength(3)
  })

  it('Двери has 2 items', () => {
    expect(getCatalogByCategory()['Двери']).toHaveLength(2)
  })
})

describe('getCatalogItemById', () => {
  it.each(CATALOG_ITEMS)('returns item for id $id', (item) => {
    expect(getCatalogItemById(item.id)).toBe(item)
  })

  it('returns undefined for nonexistent id', () => {
    expect(getCatalogItemById('nonexistent')).toBeUndefined()
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

  it('select properties have at least one option', () => {
    for (const item of CATALOG_ITEMS) {
      for (const prop of item.properties) {
        if (prop.type === 'select') {
          expect(prop.options).toBeDefined()
          expect(prop.options!.length).toBeGreaterThan(0)
        }
      }
    }
  })
})
