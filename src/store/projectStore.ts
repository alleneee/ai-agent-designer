import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { db } from '@/lib/db'
import type { Project, GeneratedImage } from '@/types'

interface ProjectState {
  projects: Project[]
  currentProjectId: string | null
  loadProjects: () => Promise<void>
  createProject: (name: string, roomImage: Blob, style: string) => Promise<string>
  setCurrentProject: (id: string | null) => void
  deleteProject: (id: string) => Promise<void>
  getGeneratedImages: (projectId: string) => Promise<GeneratedImage[]>
  saveGeneratedImages: (projectId: string, images: GeneratedImage[]) => Promise<void>
}

export const useProjectStore = create<ProjectState>((set, get) => ({
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
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      currentProjectId: state.currentProjectId === id ? null : state.currentProjectId,
    }))
  },

  getGeneratedImages: async (projectId: string) => {
    return db.generatedImages.where('projectId').equals(projectId).toArray()
  },

  saveGeneratedImages: async (_projectId: string, images: GeneratedImage[]) => {
    await db.generatedImages.bulkAdd(images)
  },
}))
