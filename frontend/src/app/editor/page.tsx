'use client'

import { Suspense, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import FurniturePanel from '@/components/editor/FurniturePanel'
import PropertyPanel from '@/components/editor/PropertyPanel'
import Toolbar from '@/components/editor/Toolbar'
import { useEditorStore } from '@/store/editorStore'
import { db } from '@/lib/db'

const Canvas3D = dynamic(() => import('@/components/editor/Canvas3D'), {
  ssr: false,
})

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center text-slate-400">Loading...</div>}>
      <EditorContent />
    </Suspense>
  )
}

function EditorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project')
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const { furniture, loadScene } = useEditorStore()

  useEffect(() => {
    if (projectId) {
      loadScene(projectId)
    }
  }, [projectId, loadScene])

  useEffect(() => {
    if (!projectId) return
    let roomUrl: string | null = null
    const fetchDepth = async () => {
      const project = await db.projects.get(projectId)
      if (!project?.roomImage) return

      const { depthMapUrl } = useEditorStore.getState()
      if (depthMapUrl) return

      roomUrl = URL.createObjectURL(project.roomImage)
      const formData = new FormData()
      formData.append('file', project.roomImage, 'room.jpg')

      try {
        const resp = await fetch('/api/depth', {
          method: 'POST',
          body: formData,
        })
        if (!resp.ok) return
        const data = await resp.json()
        useEditorStore.getState().setDepthData(data.depth_map_base64, roomUrl)
      } catch {
        if (roomUrl) URL.revokeObjectURL(roomUrl)
        roomUrl = null
      }
    }
    fetchDepth()
    return () => {
      if (roomUrl) URL.revokeObjectURL(roomUrl)
    }
  }, [projectId])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const { selectedId, removeFurniture } = useEditorStore.getState()
        if (selectedId) removeFurniture(selectedId)
      }
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault()
          useEditorStore.getState().undo()
        }
        if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault()
          useEditorStore.getState().redo()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="h-screen flex flex-col">
      <div className="h-12 bg-white border-b flex items-center px-4 justify-between">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          返回
        </button>
        <h1 className="font-semibold">3D 编辑器</h1>
        <span className="text-xs text-gray-400">
          {furniture.length} 件家具
        </span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <FurniturePanel />
        <div ref={canvasContainerRef} className="flex-1">
          <Canvas3D />
        </div>
        <PropertyPanel />
      </div>

      <Toolbar canvasRef={canvasContainerRef} />
    </div>
  )
}
