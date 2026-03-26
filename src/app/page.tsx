'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ImageUploader from '@/components/upload/ImageUploader'
import { useProjectStore } from '@/store/projectStore'
import { compressImage } from '@/lib/imageUtils'

export default function HomePage() {
  const router = useRouter()
  const { projects, loadProjects, createProject, deleteProject, setCurrentProject } =
    useProjectStore()
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const compressed = await compressImage(file)
      const projectId = await createProject(
        `项目 ${projects.length + 1}`,
        compressed,
        'modern'
      )
      router.push(`/generate?project=${projectId}`)
    } finally {
      setUploading(false)
    }
  }

  const handleOpenProject = (id: string) => {
    setCurrentProject(id)
    router.push(`/generate?project=${id}`)
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-center mb-2">Furnish</h1>
      <p className="text-gray-500 text-center mb-10">
        AI 驱动的装修效果预览
      </p>

      <ImageUploader onUpload={handleUpload} />

      {uploading && (
        <p className="text-center mt-4 text-gray-500">正在处理图片...</p>
      )}

      {projects.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold mb-4">我的项目</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow group relative"
                onClick={() => handleOpenProject(project.id)}
              >
                <div className="aspect-video bg-gray-100 rounded mb-2 flex items-center justify-center text-gray-400 text-sm">
                  {project.name}
                </div>
                <p className="text-sm text-gray-600">{project.name}</p>
                <p className="text-xs text-gray-400">
                  {new Date(project.createdAt).toLocaleDateString('zh-CN')}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteProject(project.id)
                  }}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  x
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
