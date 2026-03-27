import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { db } from '@/lib/db'
import type { FurnitureMarker, Scene } from '@/types'
import { FURNITURE_SIZES } from '@/data/furniture'

interface EditorState {
  projectId: string | null
  markers: FurnitureMarker[]
  selectedId: string | null
  backgroundUrl: string | null
  loadScene: (projectId: string) => Promise<void>
  saveScene: () => Promise<void>
  setBackground: (url: string) => void
  addMarker: (catalogId: string, x: number, y: number) => void
  removeMarker: (id: string) => void
  moveMarker: (id: string, x: number, y: number) => void
  rotateMarker: (id: string) => void
  selectMarker: (id: string | null) => void
  clearMarkers: () => void
}

export const useEditorStore = create<EditorState>((set, get) => ({
  projectId: null,
  markers: [],
  selectedId: null,
  backgroundUrl: null,

  loadScene: async (projectId: string) => {
    const scene = await db.scenes.get(projectId)
    set({
      projectId,
      markers: scene?.markers ?? [],
      selectedId: null,
      backgroundUrl: null,
    })
  },

  saveScene: async () => {
    const { projectId, markers } = get()
    if (!projectId) return
    await db.scenes.put({ projectId, markers: structuredClone(markers) })
  },

  setBackground: (url: string) => {
    set({ backgroundUrl: url })
  },

  addMarker: (catalogId: string, x: number, y: number) => {
    const size = FURNITURE_SIZES[catalogId] ?? { w: 30, h: 30 }
    const marker: FurnitureMarker = {
      id: uuidv4(),
      catalogId,
      x,
      y,
      w: size.w,
      h: size.h,
      rotation: 0,
    }
    set((state) => ({ markers: [...state.markers, marker], selectedId: marker.id }))
    get().saveScene()
  },

  removeMarker: (id: string) => {
    set((state) => ({
      markers: state.markers.filter((m) => m.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    }))
    get().saveScene()
  },

  moveMarker: (id: string, x: number, y: number) => {
    set((state) => ({
      markers: state.markers.map((m) => (m.id === id ? { ...m, x, y } : m)),
    }))
    get().saveScene()
  },

  rotateMarker: (id: string) => {
    set((state) => ({
      markers: state.markers.map((m) =>
        m.id === id ? { ...m, rotation: (m.rotation + 90) % 360 } : m
      ),
    }))
    get().saveScene()
  },

  selectMarker: (id: string | null) => {
    set({ selectedId: id })
  },

  clearMarkers: () => {
    set({ markers: [], selectedId: null })
    get().saveScene()
  },
}))
