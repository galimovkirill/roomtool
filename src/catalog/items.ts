import type { CatalogItem, PropertyDef } from '@/types'

const matProps: PropertyDef[] = [
  { key: 'material', label: 'Материал', type: 'material' },
  { key: 'color', label: 'Цвет', type: 'color', dependsOnMaterial: 'material' },
]

export const CATALOG_ITEMS: CatalogItem[] = [
  // ── Корпус ──────────────────────────────────────────────────────────────
  {
    id: 'side-panel',
    name: 'Боковая панель',
    category: 'Корпус',
    defaultDimensions: { width: 16, height: 2200, depth: 600 },
    properties: matProps,
  },
  {
    id: 'top-panel',
    name: 'Верхняя панель',
    category: 'Корпус',
    defaultDimensions: { width: 868, height: 16, depth: 600 },
    properties: matProps,
  },
  {
    id: 'bottom-panel',
    name: 'Нижняя панель',
    category: 'Корпус',
    defaultDimensions: { width: 868, height: 16, depth: 600 },
    properties: matProps,
  },
  {
    id: 'back-panel',
    name: 'Задняя стенка',
    category: 'Корпус',
    defaultDimensions: { width: 900, height: 2200, depth: 8 },
    properties: [
      {
        key: 'material',
        label: 'Материал',
        type: 'material',
        options: [
          { label: 'ДВП', value: 'ДВП' },
          { label: 'ЛДСП', value: 'ЛДСП' },
        ],
      },
      { key: 'color', label: 'Цвет', type: 'color', dependsOnMaterial: 'material' },
    ],
  },

  // ── Наполнение ───────────────────────────────────────────────────────────
  {
    id: 'shelf',
    name: 'Полка',
    category: 'Наполнение',
    defaultDimensions: { width: 860, height: 16, depth: 560 },
    properties: matProps,
  },
  {
    id: 'divider-vertical',
    name: 'Вертикальный разделитель',
    category: 'Наполнение',
    defaultDimensions: { width: 16, height: 2168, depth: 560 },
    properties: matProps,
  },
  {
    id: 'hanging-rod',
    name: 'Штанга',
    category: 'Наполнение',
    defaultDimensions: { width: 860, height: 25, depth: 25 },
    properties: [
      {
        key: 'material',
        label: 'Материал',
        type: 'select',
        options: [{ label: 'Металл', value: 'Металл' }],
      },
      { key: 'color', label: 'Финиш', type: 'color', dependsOnMaterial: 'material' },
    ],
  },
  {
    id: 'drawer-box',
    name: 'Корпус ящика',
    category: 'Наполнение',
    defaultDimensions: { width: 860, height: 180, depth: 500 },
    properties: [
      ...matProps,
      {
        key: 'slides',
        label: 'Направляющие',
        type: 'select',
        options: [
          { label: 'Роликовые', value: 'roller' },
          { label: 'Шариковые', value: 'ball' },
          { label: 'Push-to-open', value: 'push' },
        ],
      },
    ],
  },
  {
    id: 'trouser-rack',
    name: 'Брючница',
    category: 'Наполнение',
    defaultDimensions: { width: 860, height: 50, depth: 300 },
    properties: [
      {
        key: 'material',
        label: 'Материал',
        type: 'select',
        options: [{ label: 'Металл', value: 'Металл' }],
      },
      { key: 'color', label: 'Финиш', type: 'color', dependsOnMaterial: 'material' },
    ],
  },

  // ── Двери и фасады ───────────────────────────────────────────────────────
  {
    id: 'door-hinged',
    name: 'Дверь распашная',
    category: 'Двери и фасады',
    defaultDimensions: { width: 450, height: 2200, depth: 18 },
    properties: [
      {
        key: 'material',
        label: 'Материал',
        type: 'select',
        options: [
          { label: 'ЛДСП', value: 'ЛДСП' },
          { label: 'МДФ', value: 'МДФ' },
          { label: 'Стекло', value: 'Стекло' },
        ],
      },
      { key: 'color', label: 'Цвет', type: 'color', dependsOnMaterial: 'material' },
      {
        key: 'opening',
        label: 'Открывание',
        type: 'select',
        options: [
          { label: 'Влево', value: 'left' },
          { label: 'Вправо', value: 'right' },
        ],
      },
    ],
  },
  {
    id: 'door-sliding',
    name: 'Дверь раздвижная',
    category: 'Двери и фасады',
    defaultDimensions: { width: 900, height: 2200, depth: 22 },
    properties: [
      {
        key: 'material',
        label: 'Материал',
        type: 'select',
        options: [
          { label: 'ЛДСП', value: 'ЛДСП' },
          { label: 'Стекло', value: 'Стекло' },
        ],
      },
      { key: 'color', label: 'Цвет', type: 'color', dependsOnMaterial: 'material' },
    ],
  },
  {
    id: 'drawer-front',
    name: 'Фасад ящика',
    category: 'Двери и фасады',
    defaultDimensions: { width: 860, height: 196, depth: 18 },
    properties: matProps,
  },

  // ── Основание ────────────────────────────────────────────────────────────
  {
    id: 'plinth',
    name: 'Цоколь',
    category: 'Основание',
    defaultDimensions: { width: 900, height: 100, depth: 16 },
    properties: matProps,
  },
  {
    id: 'cornice',
    name: 'Карниз',
    category: 'Основание',
    defaultDimensions: { width: 900, height: 60, depth: 60 },
    properties: matProps,
  },
  {
    id: 'leg',
    name: 'Ножка',
    category: 'Основание',
    defaultDimensions: { width: 30, height: 100, depth: 30 },
    properties: [
      {
        key: 'material',
        label: 'Материал',
        type: 'select',
        options: [
          { label: 'Пластик', value: 'plastic' },
          { label: 'Металл', value: 'Металл' },
        ],
      },
      { key: 'color', label: 'Цвет', type: 'color', dependsOnMaterial: 'material' },
    ],
  },

  // ── Фурнитура ────────────────────────────────────────────────────────────
  {
    id: 'handle-bar',
    name: 'Ручка-скоба',
    category: 'Фурнитура',
    defaultDimensions: { width: 128, height: 12, depth: 30 },
    properties: [
      {
        key: 'spacing',
        label: 'Межосевое',
        type: 'select',
        options: [
          { label: '96 мм', value: '96' },
          { label: '128 мм', value: '128' },
          { label: '160 мм', value: '160' },
          { label: '224 мм', value: '224' },
        ],
      },
      {
        key: 'material',
        label: 'Материал',
        type: 'select',
        options: [{ label: 'Металл', value: 'Металл' }],
      },
      { key: 'color', label: 'Финиш', type: 'color', dependsOnMaterial: 'material' },
    ],
  },
  {
    id: 'handle-knob',
    name: 'Ручка-кнопка',
    category: 'Фурнитура',
    defaultDimensions: { width: 30, height: 30, depth: 25 },
    properties: [
      {
        key: 'material',
        label: 'Материал',
        type: 'select',
        options: [{ label: 'Металл', value: 'Металл' }],
      },
      { key: 'color', label: 'Финиш', type: 'color', dependsOnMaterial: 'material' },
    ],
  },
  {
    id: 'hinge',
    name: 'Петля',
    category: 'Фурнитура',
    defaultDimensions: { width: 35, height: 13, depth: 50 },
    properties: [
      {
        key: 'angle',
        label: 'Угол',
        type: 'select',
        options: [
          { label: '90°', value: '90' },
          { label: '110°', value: '110' },
          { label: '170°', value: '170' },
        ],
      },
      {
        key: 'mount',
        label: 'Монтаж',
        type: 'select',
        options: [
          { label: 'Накладная', value: 'overlay' },
          { label: 'Полунакладная', value: 'half' },
          { label: 'Внутренняя', value: 'inset' },
        ],
      },
    ],
  },

  // ── Декорации ────────────────────────────────────────────────────────────
  {
    id: 'house-plant-1',
    name: 'Комнатный цветок',
    category: 'Декорации',
    defaultDimensions: { width: 600, height: 1200, depth: 600 },
    properties: [
      { key: 'scale', label: 'Размер', type: 'number', unit: '%', min: 10, max: 200, default: 100 },
    ],
    render: { type: 'gltf', src: '/models/house_plant_1.glb' },
  },
]

export function getCatalogItemById(id: string): CatalogItem | undefined {
  return CATALOG_ITEMS.find((item) => item.id === id)
}

export function getCatalogByCategory(): Record<string, CatalogItem[]> {
  return CATALOG_ITEMS.reduce<Record<string, CatalogItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})
}
