'use client'

import { FURNITURE_CATALOG } from '@/data/furniture'
import { useEditorStore } from '@/store/editorStore'

export default function FurniturePanel() {
  const { addFurniture } = useEditorStore()

  const categories = [
    { key: 'living', name: '客厅' },
    { key: 'bedroom', name: '卧室' },
    { key: 'dining', name: '餐厅' },
    { key: 'other', name: '其他' },
  ] as const

  return (
    <div className="w-56 bg-white border-r overflow-y-auto p-3">
      <h2 className="font-semibold mb-3">家具库</h2>
      {categories.map((cat) => {
        const items = FURNITURE_CATALOG.filter((f) => f.category === cat.key)
        if (items.length === 0) return null
        return (
          <div key={cat.key} className="mb-4">
            <p className="text-xs text-gray-500 mb-1">{cat.name}</p>
            <div className="space-y-1">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => addFurniture(item.id)}
                  className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 transition-colors"
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
