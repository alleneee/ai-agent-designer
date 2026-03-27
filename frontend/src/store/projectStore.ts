import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { db } from '@/lib/db'
import { blobToBase64 } from '@/lib/imageUtils'
import type { Project, GeneratedImage } from '@/types'

interface ProjectState {
  projects: Project[]
  currentProjectId: string | null
  loadProjects: () => Promise<void>
  createProject: (name: string, roomImage: Blob, style: string) => Promise<string>
  setCurrentProject: (id: string | null) => void
  deleteProject: (id: string) => Promise<void>
  getGeneratedImages: (projectId: string) => Promise<GeneratedImage[]>
  saveGeneratedImages: (projectId: string, imageUrls: string[], prompt: string) => Promise<GeneratedImage[]>
  selectGeneratedImage: (projectId: string, imageId: string) => Promise<void>
  getSelectedImage: (projectId: string) => Promise<GeneratedImage | undefined>
}

async function persistImageUrl(imageUrl: string): Promise<string> {
  if (imageUrl.startsWith('data:')) return imageUrl

  try {
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch generated image: ${response.status}`)
    }

    return await blobToBase64(await response.blob())
  } catch {
    return imageUrl
  }
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  currentProjectId: null,

  loadProjects: async () => {
    const projects = await db.projects.orderBy('createdAt').reverse().toArray()
    set({ projects })
  },

  createProject: async (name: string, roomImage: Blob, style: string) => {
    const id = uuidv4()
    const now = Date.now()
    const project: Project = { id, name, roomImage, style, createdAt: now, updatedAt: now }
    await db.projects.add(project)
    set((state) => ({ projects: [project, ...state.projects], currentProjectId: id }))
    return id
  },

  setCurrentProject: (id: string | null) => {
    set({ currentProjectId: id })
  },

  deleteProject: async (id: string) => {
    await db.projects.delete(id)
    await db.generatedImages.where('projectId').equals(id).delete()
    await db.scenes.delete(id)
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      currentProjectId: state.currentProjectId === id ? null : state.currentProjectId,
    }))
  },

  getGeneratedImages: async (projectId: string) => {
    return db.generatedImages.where('projectId').equals(projectId).toArray()
  },

  saveGeneratedImages: async (projectId: string, imageUrls: string[], prompt: string) => {
    const existing = await db.generatedImages.where('projectId').equals(projectId).toArray()
    if (existing.length > 0) {
      await db.generatedImages.where('projectId').equals(projectId).delete()
    }

    const persistedUrls = await Promise.all(imageUrls.map((url) => persistImageUrl(url)))

    const images: GeneratedImage[] = persistedUrls.map((url, i) => ({
      id: uuidv4(),
      projectId,
      imageUrl: url,
      prompt,
      selected: i === 0,
      createdAt: Date.now(),
    }))
    await db.generatedImages.bulkAdd(images)
    return images
  },

  selectGeneratedImage: async (projectId: string, imageId: string) => {
    const all = await db.generatedImages.where('projectId').equals(projectId).toArray()
    for (const img of all) {
      await db.generatedImages.update(img.id, { selected: img.id === imageId })
    }
  },

  getSelectedImage: async (projectId: string) => {
    const all = await db.generatedImages.where('projectId').equals(projectId).toArray()
    return all.find((img) => img.selected) || all[0]
  },
}))
