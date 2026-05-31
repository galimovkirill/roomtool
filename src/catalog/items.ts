import type { CatalogItem } from '@/types'

export const CATALOG_ITEMS: CatalogItem[] = [
  {
    id: 'wardrobe-body',
    name: 'Корпус шкафа',
    category: 'Корпуса',
    defaultDimensions: { width: 900, height: 2200, depth: 600 },
    properties: [
      { key: 'material', label: 'Материал', type: 'select', options: ['ДСП', 'МДФ'] },
      { key: 'color', label: 'Цвет', type: 'select', options: ['Белый', 'Венге', 'Дуб'] },
    ],
  },
  {
    id: 'wardrobe-narrow',
    name: 'Корпус-пенал',
    category: 'Корпуса',
    defaultDimensions: { width: 450, height: 2200, depth: 600 },
    properties: [
      { key: 'material', label: 'Материал', type: 'select', options: ['ДСП', 'МДФ'] },
      { key: 'color', label: 'Цвет', type: 'select', options: ['Белый', 'Венге', 'Дуб'] },
    ],
  },
  {
    id: 'shelf',
    name: 'Полка',
    category: 'Наполнение',
    defaultDimensions: { width: 878, height: 25, depth: 560 },
    properties: [
      { key: 'thickness', label: 'Толщина', type: 'number', unit: 'мм', min: 16, max: 36 },
    ],
  },
  {
    id: 'drawer',
    name: 'Ящик выдвижной',
    category: 'Наполнение',
    defaultDimensions: { width: 878, height: 150, depth: 500 },
    properties: [
      { key: 'height', label: 'Высота', type: 'number', unit: 'мм', min: 100, max: 300 },
    ],
  },
  {
    id: 'rod',
    name: 'Штанга для одежды',
    category: 'Наполнение',
    defaultDimensions: { width: 878, height: 30, depth: 30 },
    properties: [
      {
        key: 'material',
        label: 'Материал',
        type: 'select',
        options: ['Хром', 'Золото', 'Матовый никель'],
      },
    ],
  },
  {
    id: 'door-swing',
    name: 'Дверь распашная',
    category: 'Двери',
    defaultDimensions: { width: 450, height: 2200, depth: 22 },
    properties: [
      { key: 'opening', label: 'Открывание', type: 'select', options: ['Влево', 'Вправо'] },
    ],
  },
  {
    id: 'door-slide',
    name: 'Дверь-купе',
    category: 'Двери',
    defaultDimensions: { width: 900, height: 2200, depth: 60 },
    properties: [{ key: 'panels', label: 'Количество панелей', type: 'number', min: 2, max: 4 }],
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
