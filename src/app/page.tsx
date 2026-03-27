'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ImageUploader from '@/components/upload/ImageUploader'
import { useProjectStore } from '@/store/projectStore'
import { compressImage } from '@/lib/imageUtils'
import { db } from '@/lib/db'

function ProjectThumbnail({ projectId }: { projectId: string }) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    db.projects.get(projectId).then((p) => {
      if (p?.roomImage) setSrc(URL.createObjectURL(p.roomImage))
    })
    return () => {
      if (src) URL.revokeObjectURL(src)
    }
  }, [projectId])

  if (!src) {
    return (
      <div className="aspect-video bg-slate-100 rounded-xl flex items-center justify-center">
        <span className="text-slate-300 text-xs">加载中…</span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt="房间缩略图"
      width={320}
      height={180}
      loading="lazy"
      className="aspect-video w-full object-cover rounded-xl"
    />
  )
}

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
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-4xl mx-auto px-4 pt-20 pb-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-medium mb-6 border border-blue-100">
            AI 驱动的室内设计预览
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-slate-900 mb-4">
            Furnish
          </h1>
          <p className="text-lg text-slate-500 max-w-md mx-auto">
            上传房间照片，AI 为你生成专业的装修效果图
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-2">
          <ImageUploader onUpload={handleUpload} />
        </div>

        {uploading && (
          <div className="mt-6 flex items-center justify-center gap-3 text-slate-500">
            <svg
              className="w-5 h-5 animate-spin text-blue-500"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span className="text-sm">正在处理图片…</span>
          </div>
        )}

        {projects.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl font-semibold text-slate-900 mb-5">我的项目</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleOpenProject(project.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleOpenProject(project.id) }}
                  className="group relative text-left rounded-2xl overflow-hidden border border-slate-200 bg-white hover:border-blue-300 hover:shadow-lg transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                >
                  <ProjectThumbnail projectId={project.id} />
                  <div className="p-3">
                    <p className="text-sm font-medium text-slate-800 truncate">{project.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5 tabular-nums">
                      {new Date(project.createdAt).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteProject(project.id)
                    }}
                    aria-label="删除项目"
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-red-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {projects.length === 0 && !uploading && (
          <p className="text-center text-slate-400 text-sm mt-10">
            还没有项目，上传一张房间照片开始吧
          </p>
        )}
      </div>
    </main>
  )
}
