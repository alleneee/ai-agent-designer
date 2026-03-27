'use client'

import { Suspense, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import FurniturePanel from '@/components/editor/FurniturePanel'
import PropertyPanel from '@/components/editor/PropertyPanel'
import Toolbar from '@/components/editor/Toolbar'
import { useEditorStore } from '@/store/editorStore'
import { useProjectStore } from '@/store/projectStore'

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
  const { getSelectedImage } = useProjectStore()

  useEffect(() => {
    if (projectId) {
      loadScene(projectId)
    }
  }, [projectId, loadScene])

  useEffect(() => {
    if (!projectId) return
    const loadBackground = async () => {
      const { roomTextureUrl } = useEditorStore.getState()
      if (roomTextureUrl) return

      const selected = await getSelectedImage(projectId)
      if (selected?.imageUrl) {
        useEditorStore.getState().setRoomTexture(selected.imageUrl)
        return
      }
    }
    loadBackground()
  }, [projectId, getSelectedImage])

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
        <h1 className="font-semibold">2.5D 编辑器</h1>
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
