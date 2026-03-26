'use client'

import { useState, useEffect, useCallback } from 'react'
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

export default function GeneratePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project')
  const { saveGeneratedImages } = useProjectStore()

  const [roomPreview, setRoomPreview] = useState<string | null>(null)
  const [style, setStyle] = useState<StyleId>('modern')
  const [selectedFurniture, setSelectedFurniture] = useState<string[]>([])
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

  const handleGenerate = async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)

    try {
      const project = await db.projects.get(projectId)
      if (!project) throw new Error('Project not found')

      const base64 = await blobToBase64(project.roomImage)
      const furnitureDescriptions = selectedFurniture.map(
        (id) => FURNITURE_CATALOG.find((f) => f.id === id)?.description ?? ''
      ).filter(Boolean)

      const styleName = STYLES.find((s) => s.id === style)?.name ?? style

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomImage: base64,
          style: styleName,
          furniture: furnitureDescriptions,
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
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">AI 效果图生成</h1>
        <button
          onClick={() => router.push('/')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          返回首页
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          {roomPreview && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">原始房间</h3>
              <img
                src={roomPreview}
                alt="房间"
                className="w-full rounded-lg"
              />
            </div>
          )}
          <ResultGallery
            images={generatedImages}
            selectedIndex={selectedResult}
            onSelect={setSelectedResult}
          />
          {generatedImages.length > 0 && (
            <button
              onClick={handleEnterEditor}
              className="mt-4 w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              进入 3D 编辑
            </button>
          )}
        </div>

        <div className="space-y-6">
          <StyleSelector selected={style} onSelect={setStyle} />
          <FurniturePicker
            selected={selectedFurniture}
            onToggle={toggleFurniture}
          />
          <PromptEditor value={customPrompt} onChange={setCustomPrompt} />

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? '生成中...' : '生成效果图'}
          </button>
        </div>
      </div>
    </main>
  )
}
