import type { SceneItem } from '@/types'

// Wardrobe: 900 × 2200 × 600 mm, centered at origin
// Left section: hanging clothes (штанга + нижняя полка)
// Right section: 4 shelves
// No doors

const LDSP_WHITE = { material: 'ЛДСП', color: '#F5F5F0' }
const DVP_WHITE = { material: 'ДВП', color: '#F5F5F0' }

export const DEFAULT_SCENE_ITEMS: SceneItem[] = [
  // ── Корпус ──────────────────────────────────────────────────────────────
  {
    id: 'default-left-panel',
    catalogId: 'side-panel',
    name: 'Боковая панель',
    position: [-442, 1100, 0],
    rotationY: 0,
    dimensions: { width: 16, height: 2200, depth: 600 },
    properties: { ...LDSP_WHITE },
  },
  {
    id: 'default-right-panel',
    catalogId: 'side-panel',
    name: 'Боковая панель',
    position: [442, 1100, 0],
    rotationY: 0,
    dimensions: { width: 16, height: 2200, depth: 600 },
    properties: { ...LDSP_WHITE },
  },
  {
    id: 'default-top-panel',
    catalogId: 'top-panel',
    name: 'Верхняя панель',
    position: [0, 2192, 0],
    rotationY: 0,
    dimensions: { width: 868, height: 16, depth: 600 },
    properties: { ...LDSP_WHITE },
  },
  {
    id: 'default-bottom-panel',
    catalogId: 'bottom-panel',
    name: 'Нижняя панель',
    position: [0, 8, 0],
    rotationY: 0,
    dimensions: { width: 868, height: 16, depth: 600 },
    properties: { ...LDSP_WHITE },
  },
  // Back panel sits at rear: z = -300 + 4 = -296
  {
    id: 'default-back-panel',
    catalogId: 'back-panel',
    name: 'Задняя стенка',
    position: [0, 1100, -296],
    rotationY: 0,
    dimensions: { width: 900, height: 2200, depth: 8 },
    properties: { ...DVP_WHITE },
  },

  // ── Разделитель по центру ────────────────────────────────────────────────
  // Height = 2200 - 16 (top) - 16 (bottom) = 2168, z-center = -12 (flush to back panel)
  {
    id: 'default-divider',
    catalogId: 'divider-vertical',
    name: 'Вертикальный разделитель',
    position: [0, 1100, -12],
    rotationY: 0,
    dimensions: { width: 16, height: 2168, depth: 560 },
    properties: { ...LDSP_WHITE },
  },

  // ── Правая секция: 4 полки ───────────────────────────────────────────────
  // Section x-center = (divider right face + right panel inner face) / 2 = (8 + 434) / 2 = 221
  // Shelf width = 434 - 8 = 426 mm
  {
    id: 'default-shelf-r1',
    catalogId: 'shelf',
    name: 'Полка',
    position: [221, 358, -12],
    rotationY: 0,
    dimensions: { width: 426, height: 16, depth: 560 },
    properties: { ...LDSP_WHITE },
  },
  {
    id: 'default-shelf-r2',
    catalogId: 'shelf',
    name: 'Полка',
    position: [221, 708, -12],
    rotationY: 0,
    dimensions: { width: 426, height: 16, depth: 560 },
    properties: { ...LDSP_WHITE },
  },
  {
    id: 'default-shelf-r3',
    catalogId: 'shelf',
    name: 'Полка',
    position: [221, 1058, -12],
    rotationY: 0,
    dimensions: { width: 426, height: 16, depth: 560 },
    properties: { ...LDSP_WHITE },
  },
  {
    id: 'default-shelf-r4',
    catalogId: 'shelf',
    name: 'Полка',
    position: [221, 1408, -12],
    rotationY: 0,
    dimensions: { width: 426, height: 16, depth: 560 },
    properties: { ...LDSP_WHITE },
  },

  // ── Левая секция: штанга + нижняя полка ─────────────────────────────────
  // Section x-center = -(8 + 434) / 2 = -221
  {
    id: 'default-rod',
    catalogId: 'hanging-rod',
    name: 'Штанга',
    position: [-221, 1820, -12],
    rotationY: 0,
    dimensions: { width: 426, height: 25, depth: 25 },
    properties: { material: 'Металл', color: '#C0C0C0' },
  },
  {
    id: 'default-shelf-l1',
    catalogId: 'shelf',
    name: 'Полка',
    position: [-221, 358, -12],
    rotationY: 0,
    dimensions: { width: 426, height: 16, depth: 560 },
    properties: { ...LDSP_WHITE },
  },
]
