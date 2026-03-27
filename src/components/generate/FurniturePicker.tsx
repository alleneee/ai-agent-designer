'use client'

import { useRef } from 'react'
import { FURNITURE_CATALOG } from '@/data/furniture'

const CATEGORY_META = {
  living:  { name: '客厅' },
  bedroom: { name: '卧室' },
  dining:  { name: '餐厅' },
  other:   { name: '其他' },
} as const

type CategoryKey = keyof typeof CATEGORY_META

export interface FurnitureImage {
  file: File
  preview: string
}

export type FurnitureSelections = Record<string, FurnitureImage | null>

interface FurniturePickerProps {
  items: FurnitureSelections
  onChange: (items: FurnitureSelections) => void
}

export default function FurniturePicker({ items, onChange }: FurniturePickerProps) {
  const categories = Object.keys(CATEGORY_META) as CategoryKey[]

  const toggle = (id: string) => {
    const next = { ...items }
    if (id in next) {
      if (next[id]?.preview) URL.revokeObjectURL(next[id].preview)
      delete next[id]
    } else {
      next[id] = null
    }
    onChange(next)
  }

  const uploadImage = (id: string, file: File) => {
    const old = items[id]
    if (old?.preview) URL.revokeObjectURL(old.preview)
    onChange({ ...items, [id]: { file, preview: URL.createObjectURL(file) } })
  }

  const removeImage = (id: string) => {
    const old = items[id]
    if (old?.preview) URL.revokeObjectURL(old.preview)
    onChange({ ...items, [id]: null })
  }

  const selectedEntries = Object.entries(items)

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-700 mb-1">选择家具</h3>
      <p className="text-xs text-slate-400 mb-3">点击选择，选中后可上传参考图指定款式</p>

      <div className="space-y-3">
        {categories.map((key) => {
          const catItems = FURNITURE_CATALOG.filter((f) => f.category === key)
          if (catItems.length === 0) return null
          return (
            <div key={key}>
              <span className="text-xs text-slate-400 mb-1.5 block">{CATEGORY_META[key].name}</span>
              <div className="flex flex-wrap gap-1.5">
                {catItems.map((item) => {
                  const selected = item.id in items
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggle(item.id)}
                      className={[
                        'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150',
                        'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none',
                        selected
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
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

      {selectedEntries.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <span className="text-xs text-slate-400 mb-2 block">上传参考图 (可选)</span>
          <div className="grid grid-cols-4 gap-2">
            {selectedEntries.map(([id, img]) => {
              const meta = FURNITURE_CATALOG.find((f) => f.id === id)
              if (!meta) return null
              return (
                <UploadSlot
                  key={id}
                  id={id}
                  name={meta.name}
                  image={img}
                  onUpload={(file) => uploadImage(id, file)}
                  onRemove={() => removeImage(id)}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function UploadSlot({
  id,
  name,
  image,
  onUpload,
  onRemove,
}: {
  id: string
  name: string
  image: FurnitureImage | null
  onUpload: (file: File) => void
  onRemove: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) onUpload(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="text-center">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
        aria-label={`上传${name}参考图`}
      />
      {image ? (
        <div className="relative aspect-square rounded-lg overflow-hidden border border-slate-200">
          <img src={image.preview} alt={`${name}参考图`} className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={onRemove}
            aria-label={`移除${name}参考图`}
            className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 text-white rounded-full text-[10px] flex items-center justify-center hover:bg-red-500 transition-colors"
          >
            x
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full aspect-square rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-slate-300 hover:border-blue-400 hover:text-blue-400 transition-colors"
          aria-label={`上传${name}参考图`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      )}
      <span className="text-[10px] text-slate-400 mt-1 block truncate">{name}</span>
    </div>
  )
}
