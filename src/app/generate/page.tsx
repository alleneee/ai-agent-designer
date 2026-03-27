'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import StyleSelector from '@/components/generate/StyleSelector'
import FurniturePicker from '@/components/generate/FurniturePicker'
import type { FurnitureSelections } from '@/components/generate/FurniturePicker'
import ResultGallery from '@/components/generate/ResultGallery'
import { useProjectStore } from '@/store/projectStore'
import { FURNITURE_CATALOG, STYLES, type StyleId } from '@/data/furniture'
import { blobToBase64 } from '@/lib/imageUtils'
import { db } from '@/lib/db'

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
      <p className="text-xs text-slate-400">通常需要 30-60 秒，请耐心等待</p>
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
  const { saveGeneratedImages, selectGeneratedImage } = useProjectStore()
  const [savedImages, setSavedImages] = useState<{ id: string; url: string }[]>([])

  const [roomPreview, setRoomPreview] = useState<string | null>(null)
  const [style, setStyle] = useState<StyleId>('modern')
  const [furnitureItems, setFurnitureItems] = useState<FurnitureSelections>({})
  const [extraRequest, setExtraRequest] = useState('')
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
    db.generatedImages.where('projectId').equals(projectId).toArray().then((imgs) => {
      if (imgs.length > 0) {
        setGeneratedImages(imgs.map((i) => i.imageUrl))
        setSavedImages(imgs.map((i) => ({ id: i.id, url: i.imageUrl })))
        const selIdx = imgs.findIndex((i) => i.selected)
        setSelectedResult(selIdx >= 0 ? selIdx : 0)
      }
    })
  }, [projectId])

  const handleSelectResult = useCallback((index: number) => {
    setSelectedResult(index)
    if (projectId && savedImages[index]) {
      selectGeneratedImage(projectId, savedImages[index].id)
    }
  }, [projectId, savedImages, selectGeneratedImage])

  const handleGenerate = async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)

    try {
      const project = await db.projects.get(projectId)
      if (!project) throw new Error('Project not found')

      const roomBase64 = await blobToBase64(project.roomImage)
      const styleName = STYLES.find((s) => s.id === style)?.name ?? style

      const items: { name: string; image?: string }[] = []
      for (const [id, img] of Object.entries(furnitureItems)) {
        const meta = FURNITURE_CATALOG.find((f) => f.id === id)
        if (!meta) continue
        const item: { name: string; image?: string } = { name: meta.description }
        if (img) {
          item.image = await blobToBase64(img.file)
        }
        items.push(item)
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_image: roomBase64,
          style: styleName,
          furniture_items: items,
          extra: extraRequest || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || 'Generation failed')
      }

      const data = await response.json()

      const promptSummary = [styleName, ...items.map((i) => i.name)].join(', ')
      const saved = await saveGeneratedImages(projectId, data.images, promptSummary)
      setGeneratedImages(saved.map((s) => s.imageUrl))
      setSavedImages(saved.map((s) => ({ id: s.id, url: s.imageUrl })))
      setSelectedResult(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
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
                onSelect={handleSelectResult}
              />
            </div>
          </div>

          <div className="lg:sticky lg:top-[72px] flex flex-col lg:max-h-[calc(100vh-88px)]">
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <StyleSelector selected={style} onSelect={setStyle} />
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <FurniturePicker
                  items={furnitureItems}
                  onChange={setFurnitureItems}
                />
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">补充要求</h3>
                <textarea
                  value={extraRequest}
                  onChange={(e) => setExtraRequest(e.target.value)}
                  placeholder="例如：墙面刷成浅灰色、地板换成深色木纹、窗帘用白色纱帘…"
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none resize-none"
                />
                <p className="text-xs text-slate-400 mt-1">可选，补充对颜色、材质、氛围等具体要求</p>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
            </div>

            <div className="pt-4 flex-shrink-0">
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
        </div>
      </main>
    </div>
  )
}
