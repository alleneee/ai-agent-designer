import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { db } from '@/lib/db'
import type { FurnitureItem, Scene } from '@/types'

interface EditorState {
  projectId: string | null
  furniture: FurnitureItem[]
  selectedId: string | null
  history: FurnitureItem[][]
  historyIndex: number
  setProjectId: (id: string) => void
  loadScene: (projectId: string) => Promise<void>
  saveScene: () => Promise<void>
  addFurniture: (modelId: string) => void
  removeFurniture: (id: string) => void
  updateFurniture: (id: string, updates: Partial<FurnitureItem>) => void
  selectFurniture: (id: string | null) => void
  undo: () => void
  redo: () => void
  clearScene: () => void
}

function pushHistory(state: EditorState): Partial<EditorState> {
  const newHistory = state.history.slice(0, state.historyIndex + 1)
  newHistory.push(structuredClone(state.furniture))
  return { history: newHistory, historyIndex: newHistory.length - 1 }
}

export const useEditorStore = create<EditorState>((set, get) => ({
  projectId: null,
  furniture: [],
  selectedId: null,
  history: [],
  historyIndex: -1,

  setProjectId: (id: string) => {
    set({ projectId: id })
  },

  loadScene: async (projectId: string) => {
    const scene = await db.scenes.get(projectId)
    if (scene) {
      set({
        projectId,
        furniture: scene.furniture,
        history: [structuredClone(scene.furniture)],
        historyIndex: 0,
        selectedId: null,
      })
    } else {
      set({
        projectId,
        furniture: [],
        history: [[]],
        historyIndex: 0,
        selectedId: null,
      })
    }
  },

  saveScene: async () => {
    const { projectId, furniture } = get()
    if (!projectId) return
    const scene: Scene = {
      projectId,
      furniture: structuredClone(furniture),
      cameraPosition: [5, 5, 5],
    }
    await db.scenes.put(scene)
  },

  addFurniture: (modelId: string) => {
    set((state) => {
      const item: FurnitureItem = {
        id: uuidv4(),
        modelId,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      }
      const newFurniture = [...state.furniture, item]
      const hist = pushHistory({ ...state, furniture: newFurniture })
      return { furniture: newFurniture, ...hist }
    })
    get().saveScene()
  },

  removeFurniture: (id: string) => {
    set((state) => {
      const newFurniture = state.furniture.filter((f) => f.id !== id)
      const hist = pushHistory({ ...state, furniture: newFurniture })
      return {
        furniture: newFurniture,
        selectedId: state.selectedId === id ? null : state.selectedId,
        ...hist,
      }
    })
    get().saveScene()
  },

  updateFurniture: (id: string, updates: Partial<FurnitureItem>) => {
    set((state) => {
      const newFurniture = state.furniture.map((f) =>
        f.id === id ? { ...f, ...updates } : f
      )
      const hist = pushHistory({ ...state, furniture: newFurniture })
      return { furniture: newFurniture, ...hist }
    })
    get().saveScene()
  },

  selectFurniture: (id: string | null) => {
    set({ selectedId: id })
  },

  undo: () => {
    set((state) => {
      if (state.historyIndex <= 0) return state
      const newIndex = state.historyIndex - 1
      return {
        furniture: structuredClone(state.history[newIndex]),
        historyIndex: newIndex,
      }
    })
    get().saveScene()
  },

  redo: () => {
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state
      const newIndex = state.historyIndex + 1
      return {
        furniture: structuredClone(state.history[newIndex]),
        historyIndex: newIndex,
      }
    })
    get().saveScene()
  },

  clearScene: () => {
    set((state) => {
      const hist = pushHistory({ ...state, furniture: [] })
      return { furniture: [], selectedId: null, ...hist }
    })
    get().saveScene()
  },
}))
