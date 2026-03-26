'use client'

interface ResultGalleryProps {
  images: string[]
  selectedIndex: number | null
  onSelect: (index: number) => void
}

export default function ResultGallery({
  images,
  selectedIndex,
  onSelect,
}: ResultGalleryProps) {
  if (images.length === 0) return null

  return (
    <div>
      <h3 className="font-medium mb-2">生成结果</h3>
      <div className="grid grid-cols-2 gap-3">
        {images.map((src, i) => (
          <div
            key={i}
            onClick={() => onSelect(i)}
            className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-colors ${
              selectedIndex === i ? 'border-blue-500' : 'border-transparent'
            }`}
          >
            <img src={src} alt={`方案 ${i + 1}`} className="w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
