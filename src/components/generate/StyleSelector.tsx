'use client'

import { STYLES, type StyleId } from '@/data/furniture'

interface StyleSelectorProps {
  selected: StyleId
  onSelect: (style: StyleId) => void
}

export default function StyleSelector({ selected, onSelect }: StyleSelectorProps) {
  return (
    <div>
      <h3 className="font-medium mb-2">装修风格</h3>
      <div className="grid grid-cols-3 gap-2">
        {STYLES.map((style) => (
          <button
            key={style.id}
            onClick={() => onSelect(style.id)}
            className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
              selected === style.id
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {style.name}
          </button>
        ))}
      </div>
    </div>
  )
}
