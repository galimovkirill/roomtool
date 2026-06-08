import { render, screen, fireEvent } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PropertiesPanel } from './PropertiesPanel'
import { MATERIAL_COLORS } from '@/catalog/materials'
import type { CatalogItem, SceneItem } from '@/types'

const mockUpdateItem = vi.hoisted(() => vi.fn())
// Mutable holders so each test configures the rendered item / catalog entry.
const fixture = vi.hoisted(() => ({
  item: null as SceneItem | null,
  catalog: null as CatalogItem | null,
}))

vi.mock('@/store', () => ({
  useSceneStore: (selector: (s: object) => unknown) =>
    selector({
      items: fixture.item ? [fixture.item] : [],
      updateItem: mockUpdateItem,
      selectItem: vi.fn(),
      selectItems: vi.fn(),
    }),
}))

vi.mock('@/catalog/items', () => ({
  getCatalogItemById: () => fixture.catalog,
}))

beforeEach(() => {
  mockUpdateItem.mockClear()
  fixture.item = null
  fixture.catalog = null
})

describe('PropertiesPanel — material → color reset', () => {
  beforeEach(() => {
    fixture.item = {
      id: 'item-1',
      catalogId: 'side-panel',
      name: 'Боковая панель',
      position: [0, 1100, 0],
      rotationY: 0,
      dimensions: { width: 16, height: 2200, depth: 600 },
      properties: { material: 'Металл', color: '#C0C0C0' },
      groupId: null,
    }
    fixture.catalog = {
      id: 'side-panel',
      name: 'Боковая панель',
      category: 'Корпус',
      defaultDimensions: { width: 16, height: 2200, depth: 600 },
      properties: [
        { key: 'material', label: 'Материал', type: 'material' },
        { key: 'color', label: 'Цвет', type: 'color', dependsOnMaterial: 'material' },
      ],
    }
  })

  it('resets color to the first color of the newly selected material', () => {
    render(<PropertiesPanel itemId="item-1" />)
    fireEvent.change(screen.getByLabelText('Материал'), { target: { value: 'Массив' } })

    expect(mockUpdateItem).toHaveBeenCalledWith('item-1', {
      properties: {
        material: 'Массив',
        color: MATERIAL_COLORS['Массив'][0].value,
      },
    })
  })

  it('preserves other properties while resetting color on material change', () => {
    fixture.item!.properties = { material: 'Металл', color: '#C0C0C0', thickness: 18 }
    render(<PropertiesPanel itemId="item-1" />)
    fireEvent.change(screen.getByLabelText('Материал'), { target: { value: 'Стекло' } })

    expect(mockUpdateItem).toHaveBeenCalledWith('item-1', {
      properties: {
        material: 'Стекло',
        color: MATERIAL_COLORS['Стекло'][0].value,
        thickness: 18,
      },
    })
  })

  it('does not reset color when a non-material field changes', () => {
    render(<PropertiesPanel itemId="item-1" />)
    // pick a color swatch — should only patch that key, leaving material untouched
    const swatch = screen.getByTitle(MATERIAL_COLORS['Металл'][1].label)
    fireEvent.click(swatch)

    expect(mockUpdateItem).toHaveBeenCalledWith('item-1', {
      properties: { material: 'Металл', color: MATERIAL_COLORS['Металл'][1].value },
    })
  })
})

describe('PropertiesPanel — GLTF scale', () => {
  beforeEach(() => {
    fixture.item = {
      id: 'plant-1',
      catalogId: 'house-plant-1',
      name: 'Растение',
      position: [120, 600, -80],
      rotationY: 0,
      dimensions: { width: 600, height: 1200, depth: 600 },
      properties: { scale: 100 },
      groupId: null,
    }
    fixture.catalog = {
      id: 'house-plant-1',
      name: 'Растение',
      category: 'Декорации',
      defaultDimensions: { width: 600, height: 1200, depth: 600 },
      properties: [
        {
          key: 'scale',
          label: 'Размер',
          type: 'number',
          unit: '%',
          min: 10,
          max: 200,
          default: 100,
        },
      ],
      render: { type: 'gltf', src: '/models/plant.glb' },
    }
  })

  it('renders the scale slider instead of W/H/D fields', () => {
    render(<PropertiesPanel itemId="plant-1" />)
    expect(screen.getByLabelText('Размер, %')).toBeInTheDocument()
    expect(screen.queryByLabelText('Ширина, мм')).not.toBeInTheDocument()
  })

  it('recomputes dimensions and position.y from scale percentage', () => {
    render(<PropertiesPanel itemId="plant-1" />)
    fireEvent.change(screen.getByLabelText('Размер, %'), { target: { value: '50' } })

    expect(mockUpdateItem).toHaveBeenCalledWith('plant-1', {
      properties: { scale: 50 },
      dimensions: { width: 300, height: 600, depth: 300 },
      // x/z preserved, y re-centred to newHeight / 2
      position: [120, 300, -80],
    })
  })

  it('scales dimensions up for percentages above 100', () => {
    render(<PropertiesPanel itemId="plant-1" />)
    fireEvent.change(screen.getByLabelText('Размер, %'), { target: { value: '200' } })

    expect(mockUpdateItem).toHaveBeenCalledWith('plant-1', {
      properties: { scale: 200 },
      dimensions: { width: 1200, height: 2400, depth: 1200 },
      position: [120, 1200, -80],
    })
  })
})
