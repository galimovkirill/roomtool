export const MATERIAL_OPTIONS = ['ЛДСП', 'МДФ', 'Массив', 'ДВП', 'Стекло', 'Металл'] as const
export type MaterialType = (typeof MATERIAL_OPTIONS)[number]

export const MATERIAL_PBR: Record<MaterialType, { roughness: number; metalness: number }> = {
  ЛДСП: { roughness: 0.7, metalness: 0.0 },
  МДФ: { roughness: 0.65, metalness: 0.0 },
  Массив: { roughness: 0.8, metalness: 0.0 },
  ДВП: { roughness: 0.85, metalness: 0.0 },
  Стекло: { roughness: 0.05, metalness: 0.1 },
  Металл: { roughness: 0.15, metalness: 0.9 },
}

export function getDefaultColorForMaterial(material: string): string {
  return MATERIAL_COLORS[material as MaterialType]?.[0]?.value ?? '#F5F5F0'
}

export const MATERIAL_COLORS: Record<MaterialType, { label: string; value: string }[]> = {
  ЛДСП: [
    { label: 'Белый', value: '#F5F5F0' },
    { label: 'Серый', value: '#9E9E9E' },
    { label: 'Бетон', value: '#8A8A8A' },
    { label: 'Дуб сонома', value: '#C8A97E' },
    { label: 'Венге', value: '#3D2314' },
  ],
  МДФ: [
    { label: 'Белый', value: '#F5F5F0' },
    { label: 'Серый', value: '#9E9E9E' },
    { label: 'Чёрный', value: '#1A1A1A' },
  ],
  Массив: [
    { label: 'Сосна', value: '#D4A853' },
    { label: 'Дуб', value: '#A0784A' },
    { label: 'Бук', value: '#C4965A' },
    { label: 'Орех', value: '#5C3D2E' },
  ],
  ДВП: [
    { label: 'Белый', value: '#F5F5F0' },
    { label: 'Серый', value: '#B0B0B0' },
  ],
  Стекло: [
    { label: 'Прозрачное', value: '#ADD8E6' },
    { label: 'Матовое', value: '#E0F0F8' },
    { label: 'Зеркало', value: '#C8D8E0' },
    { label: 'Тонированное', value: '#6B8FA0' },
  ],
  Металл: [
    { label: 'Хром', value: '#C0C0C0' },
    { label: 'Матовый никель', value: '#A8A8A0' },
    { label: 'Чёрный', value: '#1A1A1A' },
    { label: 'Золото', value: '#CFB53B' },
  ],
}
