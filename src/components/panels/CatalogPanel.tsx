import { useMemo, useState } from 'react'
import { getCatalogByCategory } from '@/catalog/items'
import type { CatalogItem } from '@/types'
import { useSceneStore } from '@/store'

function CategorySection({
  name,
  items,
  onAdd,
}: {
  name: string
  items: CatalogItem[]
  onAdd: (item: CatalogItem) => void
}) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div>
      <button
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between px-4 py-2 cursor-pointer hover:bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500"
        onClick={() => setIsOpen((v) => !v)}
      >
        {name}
        <span>{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <div>
          {items.map((item) => (
            <button
              key={item.id}
              className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors"
              onClick={() => onAdd(item)}
            >
              {item.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function CatalogPanel() {
  const [query, setQuery] = useState('')
  const byCategory = useMemo(() => getCatalogByCategory(), [])
  const allItems = useMemo(() => Object.values(byCategory).flat(), [byCategory])
  const addItem = useSceneStore((s) => s.addItem)

  const lowerQuery = query.trim().toLowerCase()
  const filtered = lowerQuery
    ? allItems.filter((item) => item.name.toLowerCase().includes(lowerQuery))
    : null

  return (
    <div className="flex flex-col h-full">
      <div className="text-lg font-semibold px-4 py-3 border-b">Элементы</div>
      <input
        aria-label="Поиск по каталогу"
        type="text"
        className="w-full border-b px-4 py-2 text-sm placeholder-gray-400 outline-none focus:bg-blue-50"
        placeholder="Поиск..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="flex-1 overflow-y-auto">
        {filtered === null ? (
          Object.entries(byCategory).map(([category, items]) => (
            <CategorySection key={category} name={category} items={items} onAdd={addItem} />
          ))
        ) : filtered.length === 0 ? (
          <p className="px-4 py-3 text-sm text-gray-400">Ничего не найдено</p>
        ) : (
          filtered.map((item) => (
            <button
              key={item.id}
              className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors"
              onClick={() => addItem(item)}
            >
              {item.name}
            </button>
          ))
        )}
      </div>
    </div>
  )
}
