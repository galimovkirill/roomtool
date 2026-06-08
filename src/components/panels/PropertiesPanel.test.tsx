import { render, screen, fireEvent } from '@testing-library/react'
import { PropertiesPanel } from './PropertiesPanel'

const mockUpdateItem = vi.hoisted(() => vi.fn())
const mockCloseEditing = vi.hoisted(() => vi.fn())

const mockItem = {
  id: 'item-1',
  catalogId: 'wardrobe-body',
  name: 'Корпус шкафа',
  position: [0, 1100, 0] as [number, number, number],
  rotationY: 0,
  dimensions: { width: 900, height: 2200, depth: 600 },
  properties: { material: 'ДСП' },
  groupId: null,
}

vi.mock('@/store', () => ({
  useSceneStore: (selector: (s: object) => unknown) =>
    selector({
      items: [mockItem],
      updateItem: mockUpdateItem,
      closeEditing: mockCloseEditing,
    }),
}))

vi.mock('@/catalog/items', () => ({
  getCatalogItemById: () => ({
    id: 'wardrobe-body',
    name: 'Корпус шкафа',
    category: 'Корпуса',
    defaultDimensions: { width: 900, height: 2200, depth: 600 },
    properties: [{ key: 'material', label: 'Материал', type: 'select', options: ['ДСП', 'МДФ'] }],
  }),
}))

describe('PropertiesPanel', () => {
  beforeEach(() => {
    mockUpdateItem.mockClear()
    mockCloseEditing.mockClear()
  })

  it('shows item name', () => {
    render(<PropertiesPanel itemId="item-1" />)
    expect(screen.getByText('Корпус шкафа')).toBeInTheDocument()
  })

  it('shows all three dimension fields', () => {
    render(<PropertiesPanel itemId="item-1" />)
    expect(screen.getByLabelText('Ширина, мм')).toBeInTheDocument()
    expect(screen.getByLabelText('Высота, мм')).toBeInTheDocument()
    expect(screen.getByLabelText('Глубина, мм')).toBeInTheDocument()
  })

  it('shows catalog properties section', () => {
    render(<PropertiesPanel itemId="item-1" />)
    expect(screen.getByLabelText('Материал')).toBeInTheDocument()
  })

  it('syncs position.y when height changes', () => {
    render(<PropertiesPanel itemId="item-1" />)
    const heightInput = screen.getByLabelText('Высота, мм')
    fireEvent.change(heightInput, { target: { value: '2400' } })
    expect(mockUpdateItem).toHaveBeenCalledWith('item-1', {
      dimensions: { width: 900, height: 2400, depth: 600 },
      position: [0, 1200, 0],
    })
  })

  it('calls closeEditing on close', () => {
    render(<PropertiesPanel itemId="item-1" />)
    fireEvent.click(screen.getByRole('button', { name: 'Закрыть панель' }))
    expect(mockCloseEditing).toHaveBeenCalled()
  })

  it('returns null for unknown itemId', () => {
    const { container } = render(<PropertiesPanel itemId="nonexistent" />)
    expect(container.firstChild).toBeNull()
  })
})
