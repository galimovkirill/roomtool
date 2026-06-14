import { useMemo, useState } from 'react'
import { getCatalogByCategory } from '@/catalog/items'
import type { CatalogItem } from '@/types'
import { useSceneStore } from '@/store'

function SearchIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 13 13"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function CategorySection({
  name,
  items,
  onAdd,
}: {
  name: string
  items: CatalogItem[]
  onAdd: (item: CatalogItem) => void
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div>
      <button
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between px-3 h-8 hover:bg-gray-50 transition-colors text-xs font-medium uppercase tracking-wider text-gray-400 hover:text-gray-600 border-b border-gray-100 cursor-pointer"
        onClick={() => setIsOpen((v) => !v)}
      >
        {name}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={`transition-transform text-gray-300 ${isOpen ? 'rotate-90' : ''}`}
          aria-hidden="true"
        >
          <path
            d="M4.5 2.5l3.5 3.5-3.5 3.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="border-b border-gray-100">
          {items.map((item) => (
            <button
              key={item.id}
              className="w-full text-left pl-5 pr-3 h-8 flex items-center justify-between text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors group"
              onClick={() => onAdd(item)}
            >
              {item.name}
              <span className="opacity-0 group-hover:opacity-100 text-gray-400 text-xs font-medium transition-opacity shrink-0">
                +
              </span>
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
      <div className="flex items-center gap-2 px-3 h-9 border-b border-gray-200 shrink-0 text-gray-400 focus-within:border-blue-300 focus-within:ring-1 focus-within:ring-blue-100 transition-colors">
        <SearchIcon />
        <input
          aria-label="Поиск по каталогу"
          type="text"
          className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent"
          placeholder="Поиск..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered === null ? (
          Object.entries(byCategory).map(([category, items]) => (
            <CategorySection key={category} name={category} items={items} onAdd={addItem} />
          ))
        ) : filtered.length === 0 ? (
          <p className="px-3 py-3 text-sm text-gray-400">Ничего не найдено</p>
        ) : (
          filtered.map((item) => (
            <button
              key={item.id}
              className="w-full text-left px-3 h-8 flex items-center justify-between text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors group border-b border-gray-100"
              onClick={() => addItem(item)}
            >
              {item.name}
              <span className="opacity-0 group-hover:opacity-100 text-gray-400 text-xs font-medium transition-opacity shrink-0">
                +
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
