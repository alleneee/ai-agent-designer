'use client'

import { useState, useCallback, useRef } from 'react'

interface ImageUploaderProps {
  onUpload: (file: File, preview: string) => void
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ImageUploader({ onUpload }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return
      const url = URL.createObjectURL(file)
      setPreview(url)
      setFileInfo({ name: file.name, size: formatFileSize(file.size) })
      onUpload(file, url)
    },
    [onUpload]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="上传房间照片"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      className={[
        'relative rounded-2xl cursor-pointer transition-all duration-200 overflow-hidden',
        'border-2 border-dashed',
        'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none',
        isDragging
          ? 'border-blue-500 bg-blue-50 scale-[1.01]'
          : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/40',
      ].join(' ')}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
      {preview ? (
        <div className="relative group">
          <img
            src={preview}
            alt="房间预览"
            width={800}
            height={600}
            className="w-full max-h-96 object-contain block"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center">
            <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/60 px-4 py-2 rounded-full">
              点击更换图片
            </span>
          </div>
          {fileInfo && (
            <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-3 py-1 rounded-full tabular-nums">
              {fileInfo.name} · {fileInfo.size}
            </div>
          )}
        </div>
      ) : (
        <div className="py-20 px-8 flex flex-col items-center gap-4">
          <div className={[
            'w-16 h-16 rounded-2xl flex items-center justify-center transition-colors duration-200',
            isDragging ? 'bg-blue-100' : 'bg-slate-100',
          ].join(' ')}>
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke={isDragging ? '#2563eb' : '#94a3b8'}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <div className="text-center space-y-1">
            <p className="text-base font-medium text-slate-700">
              {isDragging ? '松开以上传' : '拖拽或点击上传房间照片'}
            </p>
            <p className="text-sm text-slate-400">支持 JPG、PNG 格式，建议使用高清照片</p>
          </div>
        </div>
      )}
    </div>
  )
}
