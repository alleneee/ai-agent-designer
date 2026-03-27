'use client'

import { Suspense, useRef, useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEditorStore } from '@/store/editorStore'
import { useProjectStore } from '@/store/projectStore'
import { FURNITURE_CATALOG } from '@/data/furniture'
import { blobToBase64 } from '@/lib/imageUtils'
import { db } from '@/lib/db'

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center text-slate-400">Loading...</div>}>
      <EditorContent />
    </Suspense>
  )
}

const CANVAS_W = 500
const CANVAS_H = 400
const WALL_THICKNESS = 8

function EditorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { markers, selectedId, backgroundUrl, loadScene, setBackground, addMarker, removeMarker, moveMarker, rotateMarker, selectMarker, clearMarkers } = useEditorStore()
  const { getSelectedImage } = useProjectStore()
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [generating, setGenerating] = useState(false)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const bgImageRef = useRef<HTMLImageElement | null>(null)
  const [bgLoaded, setBgLoaded] = useState(false)

  useEffect(() => {
    if (!projectId) return
    loadScene(projectId)
  }, [projectId, loadScene])

  useEffect(() => {
    if (!projectId) return
    db.projects.get(projectId).then((project) => {
      if (!project?.roomImage) return
      const url = URL.createObjectURL(project.roomImage)
      setBackground(url)
      const img = new Image()
      img.onload = () => { bgImageRef.current = img; setBgLoaded(true) }
      img.src = url
    })
    getSelectedImage(projectId).then((img) => {
      if (img?.imageUrl) setResultUrl(img.imageUrl)
    })
  }, [projectId, getSelectedImage, setBackground])

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)

    if (bgImageRef.current) {
      ctx.drawImage(bgImageRef.current, 0, 0, CANVAS_W, CANVAS_H)
      ctx.fillStyle = 'rgba(255,255,255,0.15)'
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
    } else {
      ctx.fillStyle = '#fafaf9'
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
      ctx.fillStyle = '#d4d4d4'
      ctx.fillRect(0, 0, CANVAS_W, WALL_THICKNESS)
      ctx.fillRect(0, 0, WALL_THICKNESS, CANVAS_H)
      ctx.fillRect(CANVAS_W - WALL_THICKNESS, 0, WALL_THICKNESS, CANVAS_H)
      ctx.fillRect(0, CANVAS_H - WALL_THICKNESS, CANVAS_W, WALL_THICKNESS)
    }

    for (const m of markers) {
      const meta = FURNITURE_CATALOG.find((f) => f.id === m.catalogId)
      if (!meta) continue

      ctx.save()
      ctx.translate(m.x, m.y)
      ctx.rotate((m.rotation * Math.PI) / 180)

      const isSelected = m.id === selectedId
      ctx.fillStyle = isSelected ? '#3b82f6' : '#94a3b8'
      ctx.globalAlpha = 0.6
      ctx.fillRect(-m.w / 2, -m.h / 2, m.w, m.h)
      ctx.globalAlpha = 1

      ctx.strokeStyle = isSelected ? '#2563eb' : '#64748b'
      ctx.lineWidth = isSelected ? 2 : 1
      ctx.strokeRect(-m.w / 2, -m.h / 2, m.w, m.h)

      ctx.fillStyle = '#1e293b'
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(meta.name, 0, 0)

      ctx.restore()
    }
  }, [markers, selectedId, bgLoaded])

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  const getCanvasPos = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getCanvasPos(e)
    for (let i = markers.length - 1; i >= 0; i--) {
      const m = markers[i]
      const hw = m.w / 2
      const hh = m.h / 2
      if (pos.x >= m.x - hw && pos.x <= m.x + hw && pos.y >= m.y - hh && pos.y <= m.y + hh) {
        selectMarker(m.id)
        setDragging(m.id)
        setDragOffset({ x: pos.x - m.x, y: pos.y - m.y })
        return
      }
    }
    selectMarker(null)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return
    const pos = getCanvasPos(e)
    moveMarker(dragging, pos.x - dragOffset.x, pos.y - dragOffset.y)
  }

  const handleMouseUp = () => {
    setDragging(null)
  }

  const handleAddFurniture = (catalogId: string) => {
    addMarker(catalogId, CANVAS_W / 2, CANVAS_H / 2)
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!selectedId) return
      if (e.key === 'Delete' || e.key === 'Backspace') {
        removeMarker(selectedId)
      }
      if (e.key === 'r' || e.key === 'R') {
        rotateMarker(selectedId)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedId, removeMarker, rotateMarker])

  const exportFloorplan = (): string | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    return canvas.toDataURL('image/png')
  }

  const buildPositionPrompt = () => {
    const gridLabels = (x: number, y: number) => {
      const col = x < CANVAS_W * 0.33 ? '左侧' : x > CANVAS_W * 0.66 ? '右侧' : '中间'
      const row = y < CANVAS_H * 0.33 ? '靠后墙' : y > CANVAS_H * 0.66 ? '靠前' : '中部'
      return `${row}${col}`
    }
    return markers
      .map((m) => {
        const meta = FURNITURE_CATALOG.find((f) => f.id === m.catalogId)
        return meta ? `${meta.name}在房间${gridLabels(m.x, m.y)}` : ''
      })
      .filter(Boolean)
      .join('，')
  }

  const handleGenerate = async () => {
    if (!projectId || markers.length === 0) return
    setGenerating(true)
    setResultUrl(null)

    try {
      const project = await db.projects.get(projectId)
      const floorplanBase64 = exportFloorplan()
      if (!floorplanBase64) return

      const images: string[] = [floorplanBase64]
      if (project?.roomImage) {
        const roomB64 = await blobToBase64(project.roomImage)
        images.push(roomB64)
      }

      const styleName = project?.style || '现代简约'
      const posDesc = buildPositionPrompt()
      const prompt = `根据图1中的平面布局图，生成${styleName}风格的室内实景效果图。房间布局和家具位置完全匹配平面图。${posDesc}。专业室内设计效果图，高清写实风格，自然光照，空间立体开阔。不需要体现文字和手绘边缘。`

      const apiBase = process.env.NEXT_PUBLIC_API_URL || ''
      const resp = await fetch(`${apiBase}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_image: images[1] || undefined,
          style: styleName,
          furniture: [],
          furniture_images: [floorplanBase64],
          prompt,
        }),
      })

      if (!resp.ok) {
        const err = await resp.json()
        throw new Error(err.detail || 'Generation failed')
      }

      const data = await resp.json()
      if (data.images?.[0]) {
        setResultUrl(data.images[0])
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const categories = [
    { key: 'living', name: '客厅' },
    { key: 'bedroom', name: '卧室' },
    { key: 'dining', name: '餐厅' },
    { key: 'other', name: '其他' },
  ] as const

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <div className="h-12 bg-white border-b flex items-center px-4 justify-between shrink-0">
        <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-800">
          返回
        </button>
        <h1 className="font-semibold text-slate-800">平面图编辑器</h1>
        <span className="text-xs text-slate-400">{markers.length} 件家具</span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-48 bg-white border-r overflow-y-auto p-3 shrink-0">
          <h2 className="font-semibold text-sm mb-3">家具库</h2>
          {categories.map((cat) => {
            const items = FURNITURE_CATALOG.filter((f) => f.category === cat.key)
            if (items.length === 0) return null
            return (
              <div key={cat.key} className="mb-4">
                <p className="text-xs text-slate-400 mb-1">{cat.name}</p>
                <div className="space-y-1">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleAddFurniture(item.id)}
                      className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-slate-100 transition-colors"
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
          <div className="border-t pt-3 mt-3 space-y-2">
            {selectedId && (
              <>
                <button
                  onClick={() => rotateMarker(selectedId)}
                  className="w-full text-sm px-2 py-1.5 border rounded hover:bg-slate-50"
                >
                  旋转 90°
                </button>
                <button
                  onClick={() => removeMarker(selectedId)}
                  className="w-full text-sm px-2 py-1.5 border border-red-200 text-red-500 rounded hover:bg-red-50"
                >
                  删除选中
                </button>
              </>
            )}
            <button
              onClick={clearMarkers}
              className="w-full text-sm px-2 py-1.5 border rounded hover:bg-slate-50"
            >
              清空全部
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4 overflow-auto">
          <div className="flex gap-6 items-start">
            <div>
              <p className="text-xs text-slate-400 mb-2 text-center">平面布局图（拖放家具）</p>
              <div
                ref={containerRef}
                className="border-2 border-slate-300 rounded-lg bg-white shadow-sm"
                style={{ width: CANVAS_W, height: CANVAS_H }}
              >
                <canvas
                  ref={canvasRef}
                  width={CANVAS_W}
                  height={CANVAS_H}
                  className="cursor-crosshair rounded-lg"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                />
              </div>
              <p className="text-xs text-slate-400 mt-2 text-center">
                点击家具添加 | 拖拽移动 | R 旋转 | Delete 删除
              </p>
            </div>

            {(resultUrl || backgroundUrl) && (
              <div>
                <p className="text-xs text-slate-400 mb-2 text-center">
                  {resultUrl ? '生成结果' : 'AI 效果图'}
                </p>
                <img
                  src={resultUrl || backgroundUrl || ''}
                  alt="效果图"
                  className="rounded-lg border shadow-sm"
                  style={{ maxWidth: CANVAS_W, maxHeight: CANVAS_H, objectFit: 'contain' }}
                />
              </div>
            )}
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating || markers.length === 0}
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
          >
            {generating ? '生成中…' : '根据平面图生成效果图'}
          </button>
        </div>
      </div>
    </div>
  )
}
