import { render, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Scene2DView } from './Scene2DView'
import type { SceneItem } from '@/types'

const selectItemMock = vi.fn()

const makeItem = (id: string, overrides?: Partial<SceneItem>): SceneItem => ({
  id,
  catalogId: 'side-panel',
  name: `Item ${id}`,
  position: [0, 1100, 0],
  rotationY: 0,
  dimensions: { width: 900, height: 2200, depth: 600 },
  properties: { color: '#aabbcc' },
  groupId: null,
  ...overrides,
})

// Mutable store state shared by all tests
const storeState = {
  items: [] as SceneItem[],
  groups: [],
}

const editorState = {
  selectedItemId: null as string | null,
  selectedItemIds: [] as string[],
  selectItem: selectItemMock,
}

vi.mock('@/store', () => ({
  useSceneStore: (selector: (s: unknown) => unknown) => selector(storeState),
  useEditorStore: (selector: (s: unknown) => unknown) => selector(editorState),
}))

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width: 800,
    height: 600,
    left: 0,
    top: 0,
    right: 800,
    bottom: 600,
  } as DOMRect)
  // Reset to empty state before each test
  storeState.items = []
  editorState.selectedItemId = null
  editorState.selectedItemIds = []
  selectItemMock.mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Scene2DView', () => {
  it('renders <svg> on empty scene', () => {
    render(<Scene2DView />)
    expect(document.querySelector('svg')).toBeTruthy()
  })

  it('renders a <g> for each item', () => {
    storeState.items = [makeItem('a'), makeItem('b')]
    const { container } = render(<Scene2DView />)
    const groups = container.querySelectorAll('[data-testid="element-2d"]')
    expect(groups.length).toBe(2)
  })

  it('calls selectItem(null) when clicking SVG background', () => {
    const { container } = render(<Scene2DView />)
    const svg = container.querySelector('svg')!
    fireEvent.click(svg)
    expect(selectItemMock).toHaveBeenCalledWith(null)
  })

  it('renders dimension lines when one item is selected', () => {
    const item = makeItem('sel', { position: [0, 1100, 0] })
    storeState.items = [item]
    editorState.selectedItemIds = ['sel']
    const { container } = render(<Scene2DView />)
    // DimensionLines renders <line> elements with strokeDasharray
    const dashedLines = container.querySelectorAll('line[stroke-dasharray]')
    expect(dashedLines.length).toBeGreaterThan(0)
  })

  it('does not render dimension lines when no item is selected', () => {
    storeState.items = [makeItem('x')]
    editorState.selectedItemIds = []
    const { container } = render(<Scene2DView />)
    const dashedLines = container.querySelectorAll('line[stroke-dasharray]')
    expect(dashedLines.length).toBe(0)
  })

  it('calls selectItem with item id when element is clicked', () => {
    const item = makeItem('click-target')
    storeState.items = [item]
    const { container } = render(<Scene2DView />)
    const itemGroup = container.querySelector('[data-testid="element-2d"]')!
    fireEvent.click(itemGroup)
    expect(selectItemMock).toHaveBeenCalledWith('click-target')
  })
})
