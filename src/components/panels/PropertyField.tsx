import type { PropertyDef } from '@/types'
import { MATERIAL_COLORS, MATERIAL_OPTIONS, type MaterialType } from '@/catalog/materials'

interface PropertyFieldProps {
  def: PropertyDef
  value: number | string
  onChange: (v: number | string) => void
  allProperties?: Record<string, string | number>
}

export function PropertyField({ def, value, onChange, allProperties }: PropertyFieldProps) {
  const label = def.unit ? `${def.label}, ${def.unit}` : def.label
  const fieldId = `field-${def.key}`

  if (def.type === 'number') {
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={fieldId} className="text-xs text-gray-500">
          {label}
        </label>
        <input
          id={fieldId}
          type="number"
          min={def.min}
          max={def.max}
          value={value as number}
          onChange={(e) => {
            if (e.target.value !== '' && !isNaN(Number(e.target.value))) {
              const n = Number(e.target.value)
              const min = def.min ?? -Infinity
              const max = def.max ?? Infinity
              onChange(Math.min(max, Math.max(min, n)))
            }
          }}
          className="border rounded px-2 py-1.5 w-full text-sm"
        />
      </div>
    )
  }

  if (def.type === 'color') {
    const materialKey = def.dependsOnMaterial ?? 'material'
    const currentMaterial = allProperties?.[materialKey] as string | undefined
    const colorOptions = currentMaterial
      ? (MATERIAL_COLORS[currentMaterial as MaterialType] ?? [])
      : []
    if (colorOptions.length === 0) return null
    return (
      <div className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">{label}</span>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {colorOptions.map((opt) => (
            <button
              key={opt.value}
              title={opt.label}
              aria-pressed={value === opt.value}
              onClick={() => onChange(opt.value)}
              className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-all ${
                value === opt.value
                  ? 'border-blue-600 scale-110'
                  : 'border-transparent hover:border-gray-400'
              }`}
              style={{ backgroundColor: opt.value }}
            />
          ))}
        </div>
      </div>
    )
  }

  // 'material' renders like select but falls back to all MATERIAL_OPTIONS when no options defined
  const options =
    def.type === 'material'
      ? (def.options ?? MATERIAL_OPTIONS.map((m) => ({ label: m, value: m })))
      : (def.options ?? [])

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className="text-xs text-gray-500">
        {label}
      </label>
      <select
        id={fieldId}
        value={value as string}
        onChange={(e) => onChange(e.target.value)}
        className="border rounded px-2 py-1.5 w-full text-sm"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
