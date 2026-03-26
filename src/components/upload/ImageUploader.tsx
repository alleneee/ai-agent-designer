'use client'

import { useState, useCallback, useRef } from 'react'

interface ImageUploaderProps {
  onUpload: (file: File, preview: string) => void
}

export default function ImageUploader({ onUpload }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return
      const url = URL.createObjectURL(file)
      setPreview(url)
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

  const handleDragLeave = useCallback(() => {
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
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
        isDragging
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
      {preview ? (
        <img
          src={preview}
          alt="预览"
          className="max-h-80 mx-auto rounded-lg"
        />
      ) : (
        <div className="space-y-4">
          <div className="text-5xl text-gray-400">+</div>
          <p className="text-lg text-gray-600">
            拖拽或点击上传房间照片 / 户型图
          </p>
          <p className="text-sm text-gray-400">支持 JPG、PNG 格式</p>
        </div>
      )}
    </div>
  )
}
