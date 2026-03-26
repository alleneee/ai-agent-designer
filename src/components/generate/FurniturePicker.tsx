'use client'

import { FURNITURE_CATALOG } from '@/data/furniture'

interface FurniturePickerProps {
  selected: string[]
  onToggle: (id: string) => void
}

export default function FurniturePicker({ selected, onToggle }: FurniturePickerProps) {
  const categories = [
    { key: 'living', name: '客厅' },
    { key: 'bedroom', name: '卧室' },
    { key: 'dining', name: '餐厅' },
    { key: 'other', name: '其他' },
  ] as const

  return (
    <div>
      <h3 className="font-medium mb-2">选择家具</h3>
      {categories.map((cat) => {
        const items = FURNITURE_CATALOG.filter((f) => f.category === cat.key)
        if (items.length === 0) return null
        return (
          <div key={cat.key} className="mb-3">
            <p className="text-xs text-gray-500 mb-1">{cat.name}</p>
            <div className="grid grid-cols-4 gap-2">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onToggle(item.id)}
                  className={`p-2 rounded-lg text-xs border transition-colors ${
                    selected.includes(item.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
