'use client'

import { STYLES, type StyleId } from '@/data/furniture'

interface StyleSelectorProps {
  selected: StyleId
  onSelect: (style: StyleId) => void
}

export default function StyleSelector({ selected, onSelect }: StyleSelectorProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-700 mb-3">装修风格</h3>
      <div className="flex flex-wrap gap-2">
        {STYLES.map((style) => {
          const isSelected = selected === style.id
          return (
            <button
              key={style.id}
              type="button"
              onClick={() => onSelect(style.id)}
              className={[
                'px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-150',
                'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none',
                isSelected
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
              ].join(' ')}
            >
              {style.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
