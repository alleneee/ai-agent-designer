'use client'

import { useEditorStore } from '@/store/editorStore'
import { useCallback } from 'react'

interface ToolbarProps {
  canvasRef: React.RefObject<HTMLDivElement | null>
}

export default function Toolbar({ canvasRef }: ToolbarProps) {
  const { undo, redo, clearScene, history, historyIndex } = useEditorStore()

  const handleExport = useCallback(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'furnish-export.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, [canvasRef])

  return (
    <div className="h-12 bg-white border-t flex items-center justify-center gap-3 px-4">
      <button
        onClick={undo}
        disabled={historyIndex <= 0}
        className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-30"
      >
        撤销
      </button>
      <button
        onClick={redo}
        disabled={historyIndex >= history.length - 1}
        className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-30"
      >
        重做
      </button>
      <button
        onClick={clearScene}
        className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
      >
        清空
      </button>
      <div className="w-px h-6 bg-gray-200" />
      <button
        onClick={handleExport}
        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        导出截图
      </button>
    </div>
  )
}
