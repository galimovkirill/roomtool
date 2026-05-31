export interface PropertyDef {
  key: string
  label: string
  type: 'number' | 'select'
  unit?: string
  min?: number
  max?: number
  default?: number | string
  options?: string[]
}

export interface CatalogItem {
  id: string
  name: string
  category: string
  defaultDimensions: { width: number; height: number; depth: number }
  properties: PropertyDef[]
  render?: { type: 'gltf'; src: string }
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
