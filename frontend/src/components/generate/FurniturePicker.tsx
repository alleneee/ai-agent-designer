'use client'

import { FURNITURE_CATALOG } from '@/data/furniture'

const CATEGORY_META = {
  living:  { name: '客厅', badge: 'bg-blue-100 text-blue-700' },
  bedroom: { name: '卧室', badge: 'bg-purple-100 text-purple-700' },
  dining:  { name: '餐厅', badge: 'bg-amber-100 text-amber-700' },
  other:   { name: '其他', badge: 'bg-slate-100 text-slate-600' },
} as const

type CategoryKey = keyof typeof CATEGORY_META

interface FurniturePickerProps {
  selected: string[]
  onToggle: (id: string) => void
}

export default function FurniturePicker({ selected, onToggle }: FurniturePickerProps) {
  const categories = Object.keys(CATEGORY_META) as CategoryKey[]

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-700 mb-3">选择家具</h3>
      <div className="space-y-4">
        {categories.map((key) => {
          const items = FURNITURE_CATALOG.filter((f) => f.category === key)
          if (items.length === 0) return null
          const meta = CATEGORY_META[key]
          return (
            <div key={key}>
              <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-2 ${meta.badge}`}>
                {meta.name}
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {items.map((item) => {
                  const isSelected = selected.includes(item.id)
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onToggle(item.id)}
                      className={[
                        'py-2 px-1 rounded-xl text-xs font-medium border-2 transition-all duration-150',
                        'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none',
                        isSelected
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                      ].join(' ')}
                    >
                      {item.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
