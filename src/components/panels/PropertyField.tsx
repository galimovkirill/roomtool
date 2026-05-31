import type { PropertyDef } from '@/types'

interface PropertyFieldProps {
  def: PropertyDef
  value: number | string
  onChange: (v: number | string) => void
}

export function PropertyField({ def, value, onChange }: PropertyFieldProps) {
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
        {def.options?.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  )
}
