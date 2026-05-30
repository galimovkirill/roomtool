export interface PropertyDef {
  key: string
  label: string
  type: 'number' | 'select'
  unit?: string
  min?: number
  max?: number
  options?: string[]
}

export interface CatalogItem {
  id: string
  name: string
  category: string
  defaultDimensions: { width: number; height: number; depth: number }
  properties: PropertyDef[]
}

export interface SceneItem {
  id: string
  catalogId: string
  name: string
  position: [number, number, number]
  rotationY: number
  dimensions: { width: number; height: number; depth: number }
  properties: Record<string, number | string>
}
