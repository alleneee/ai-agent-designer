'use client'

import { STYLES, type StyleId } from '@/data/furniture'

const STYLE_META: Record<string, { color: string; bg: string }> = {
  modern:      { color: 'text-slate-700',  bg: 'bg-slate-100' },
  nordic:      { color: 'text-sky-700',    bg: 'bg-sky-50' },
  chinese:     { color: 'text-red-700',    bg: 'bg-red-50' },
  japanese:    { color: 'text-amber-700',  bg: 'bg-amber-50' },
  industrial:  { color: 'text-zinc-700',   bg: 'bg-zinc-100' },
  minimalist:  { color: 'text-indigo-700', bg: 'bg-indigo-50' },
}

interface StyleSelectorProps {
  selected: StyleId
  onSelect: (style: StyleId) => void
}

export default function StyleSelector({ selected, onSelect }: StyleSelectorProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-700 mb-3">装修风格</h3>
      <div className="grid grid-cols-3 gap-2">
        {STYLES.map((style) => {
          const meta = STYLE_META[style.id] ?? { color: 'text-slate-700', bg: 'bg-slate-100' }
          const isSelected = selected === style.id
          return (
            <button
              key={style.id}
              type="button"
              onClick={() => onSelect(style.id)}
              className={[
                'relative py-3 px-2 rounded-xl text-sm font-medium border-2 transition-all duration-150',
                'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none',
                isSelected
                  ? `border-blue-500 bg-blue-50 text-blue-700 shadow-sm`
                  : `border-transparent ${meta.bg} ${meta.color} hover:border-slate-300`,
              ].join(' ')}
            >
              {style.name}
              {isSelected && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
