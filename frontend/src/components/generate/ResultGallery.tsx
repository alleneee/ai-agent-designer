'use client'

import { useState, useEffect, useCallback } from 'react'

interface ResultGalleryProps {
  images: string[]
  selectedIndex: number | null
  onSelect: (index: number) => void
}

function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="查看大图"
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
        <img
          src={src}
          alt={alt}
          width={1200}
          height={900}
          className="w-full rounded-2xl shadow-2xl"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭"
          className="absolute -top-4 -right-4 w-9 h-9 rounded-full bg-white text-slate-800 text-lg flex items-center justify-center shadow-lg hover:bg-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
        >
          ×
        </button>
      </div>
    </div>
  )
}

export default function ResultGallery({
  images,
  selectedIndex,
  onSelect,
}: ResultGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const openLightbox = useCallback((i: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setLightboxIndex(i)
  }, [])

  const closeLightbox = useCallback(() => setLightboxIndex(null), [])

  if (images.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
        <p className="text-slate-400 text-sm">点击「生成效果图」查看 AI 设计方案</p>
      </div>
    )
  }

  return (
    <>
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">
          生成结果
          <span className="ml-2 text-xs font-normal text-slate-400 tabular-nums">
            共 {images.length} 个方案
          </span>
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {images.map((src, i) => {
            const isSelected = selectedIndex === i
            return (
              <div
                key={i}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(i)}
                onKeyDown={(e) => { if (e.key === 'Enter') onSelect(i) }}
                className={[
                  'group relative rounded-xl overflow-hidden border-2 transition-all duration-200 text-left cursor-pointer',
                  'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none',
                  isSelected
                    ? 'border-blue-500 shadow-lg shadow-blue-100 scale-[1.02]'
                    : 'border-slate-200 hover:border-blue-300 hover:shadow-md',
                ].join(' ')}
              >
                <img
                  src={src}
                  alt={`方案 ${i + 1}`}
                  width={480}
                  height={360}
                  loading="lazy"
                  className="w-full aspect-video object-cover block"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                <span className="absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-black/50 text-white tabular-nums">
                  方案 {i + 1}
                </span>
                {isSelected && (
                  <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                      <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
                <button
                  type="button"
                  aria-label="查看大图"
                  onClick={(e) => openLightbox(i, e)}
                  className="absolute bottom-2 right-2 w-7 h-7 rounded-lg bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-black/70 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="15 3 21 3 21 9" />
                    <polyline points="9 21 3 21 3 15" />
                    <line x1="21" y1="3" x2="14" y2="10" />
                    <line x1="3" y1="21" x2="10" y2="14" />
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          src={images[lightboxIndex]}
          alt={`方案 ${lightboxIndex + 1}`}
          onClose={closeLightbox}
        />
      )}
    </>
  )
}
