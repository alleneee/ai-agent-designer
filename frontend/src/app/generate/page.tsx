'use client'

import { Suspense, useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import StyleSelector from '@/components/generate/StyleSelector'
import FurniturePicker from '@/components/generate/FurniturePicker'
import PromptEditor from '@/components/generate/PromptEditor'
import ResultGallery from '@/components/generate/ResultGallery'
import { useProjectStore } from '@/store/projectStore'
import { FURNITURE_CATALOG, STYLES, type StyleId } from '@/data/furniture'
import { blobToBase64 } from '@/lib/imageUtils'
import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'
import type { GeneratedImage } from '@/types'

function LoadingOverlay() {
  return (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-4 z-10">
      <div className="relative w-12 h-12">
        <svg className="w-12 h-12 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-slate-600">AI 正在生成效果图…</p>
      <p className="text-xs text-slate-400">通常需要 30–60 秒，请耐心等待</p>
    </div>
  )
}

export default function GeneratePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>}>
      <GenerateContent />
    </Suspense>
  )
}

function GenerateContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project')
  const { saveGeneratedImages } = useProjectStore()
  const furnitureInputRef = useRef<HTMLInputElement>(null)

  const [roomPreview, setRoomPreview] = useState<string | null>(null)
  const [style, setStyle] = useState<StyleId>('modern')
  const [selectedFurniture, setSelectedFurniture] = useState<string[]>([])
  const [furnitureImages, setFurnitureImages] = useState<{ file: File; preview: string }[]>([])
  const [customPrompt, setCustomPrompt] = useState('')
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [selectedResult, setSelectedResult] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId) return
    db.projects.get(projectId).then((project) => {
      if (!project) return
      setStyle((project.style as StyleId) || 'modern')
      const url = URL.createObjectURL(project.roomImage)
      setRoomPreview(url)
    })
  }, [projectId])

  const toggleFurniture = useCallback((id: string) => {
    setSelectedFurniture((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    )
  }, [])

  const handleFurnitureImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const newImages = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }))
    setFurnitureImages((prev) => [...prev, ...newImages])
    if (furnitureInputRef.current) furnitureInputRef.current.value = ''
  }, [])

  const removeFurnitureImage = useCallback((index: number) => {
    setFurnitureImages((prev) => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  const handleGenerate = async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)

    try {
      const project = await db.projects.get(projectId)
      if (!project) throw new Error('Project not found')

      const roomBase64 = await blobToBase64(project.roomImage)

      const furnitureDescriptions = selectedFurniture
        .map((id) => FURNITURE_CATALOG.find((f) => f.id === id)?.description ?? '')
        .filter(Boolean)

      const styleName = STYLES.find((s) => s.id === style)?.name ?? style

      const furnitureImageBase64: string[] = []
      for (const img of furnitureImages) {
        const b64 = await blobToBase64(img.file)
        furnitureImageBase64.push(b64)
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_image: roomBase64,
          style: styleName,
          furniture: furnitureDescriptions,
          furniture_images: furnitureImageBase64.length > 0 ? furnitureImageBase64 : undefined,
          prompt: customPrompt || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Generation failed')
      }

      const data = await response.json()
      setGeneratedImages(data.images)

      const images: GeneratedImage[] = data.images.map((img: string) => ({
        id: uuidv4(),
        projectId,
        imageData: new Blob(),
        prompt: '',
        selected: false,
        createdAt: Date.now(),
      }))
      await saveGeneratedImages(projectId, images)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleEnterEditor = () => {
    router.push(`/editor?project=${projectId}`)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition-colors text-sm focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none rounded"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              返回
            </button>
            <span className="text-slate-300">|</span>
            <h1 className="text-sm font-semibold text-slate-800">AI 效果图生成</h1>
          </div>
          {generatedImages.length > 0 && (
            <button
              type="button"
              onClick={handleEnterEditor}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 active:scale-95 transition-all duration-150 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              进入 3D 编辑
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <div className="space-y-4">
            {roomPreview && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-4 pt-4 pb-2">
                  <h2 className="text-sm font-semibold text-slate-700">原始房间</h2>
                </div>
                <img
                  src={roomPreview}
                  alt="原始房间照片"
                  width={800}
                  height={500}
                  className="w-full object-cover max-h-64"
                />
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 p-4 relative min-h-[300px]">
              {loading && <LoadingOverlay />}
              <ResultGallery
                images={generatedImages}
                selectedIndex={selectedResult}
                onSelect={setSelectedResult}
              />
            </div>

            {generatedImages.length > 0 && (
              <button
                type="button"
                onClick={handleEnterEditor}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-base font-semibold rounded-2xl hover:from-blue-700 hover:to-blue-600 active:scale-[0.99] transition-all duration-150 shadow-lg shadow-blue-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                进入 3D 编辑，调整家具摆放
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <StyleSelector selected={style} onSelect={setStyle} />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <FurniturePicker
                selected={selectedFurniture}
                onToggle={toggleFurniture}
              />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">参考家具图片</h3>
              <input
                ref={furnitureInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFurnitureImageUpload}
                className="hidden"
              />
              <div className="flex flex-wrap gap-2">
                {furnitureImages.map((img, i) => (
                  <div key={i} className="relative w-16 h-16">
                    <img
                      src={img.preview}
                      alt={`参考家具 ${i + 1}`}
                      width={64}
                      height={64}
                      loading="lazy"
                      className="w-full h-full object-cover rounded-xl border border-slate-200"
                    />
                    <button
                      type="button"
                      aria-label={`移除图片 ${i + 1}`}
                      onClick={() => removeFurnitureImage(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-slate-800 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-500 transition-colors focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => furnitureInputRef.current?.click()}
                  className="w-16 h-16 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-400 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                  aria-label="添加参考图片"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                上传家具照片，AI 会参考这些图片生成效果图
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <PromptEditor value={customPrompt} onChange={setCustomPrompt} />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 text-white text-sm font-semibold rounded-2xl hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed active:scale-[0.99] transition-all duration-150 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {loading ? '生成中…' : '生成效果图'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
