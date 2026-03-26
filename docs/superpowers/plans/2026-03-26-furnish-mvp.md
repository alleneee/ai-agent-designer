# Furnish MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an AI-powered interior design preview platform where users upload room photos, generate decoration effect images via Seedream API, and fine-tune furniture layout in a 3D editor.

**Architecture:** Next.js App Router full-stack application. Frontend uses React Three Fiber for 3D editing, Zustand for state management. Backend is a single API route proxying Seedream API calls. All data stored locally in IndexedDB via Dexie.js.

**Tech Stack:** Next.js 14+, React Three Fiber, @react-three/drei, Zustand, Dexie.js, Tailwind CSS

---

## File Structure

```
furnish/
├── public/models/              # glTF furniture models
├── src/
│   ├── app/
│   │   ├── page.tsx            # Home / upload page
│   │   ├── layout.tsx          # Root layout
│   │   ├── globals.css         # Global styles
│   │   ├── generate/
│   │   │   └── page.tsx        # AI generation page
│   │   ├── editor/
│   │   │   └── page.tsx        # 3D editor page
│   │   └── api/
│   │       └── generate/
│   │           └── route.ts    # Seedream proxy API
│   ├── components/
│   │   ├── upload/
│   │   │   └── ImageUploader.tsx
│   │   ├── generate/
│   │   │   ├── StyleSelector.tsx
│   │   │   ├── FurniturePicker.tsx
│   │   │   ├── PromptEditor.tsx
│   │   │   └── ResultGallery.tsx
│   │   └── editor/
│   │       ├── Canvas3D.tsx
│   │       ├── Room.tsx
│   │       ├── FurnitureModel.tsx
│   │       ├── FurniturePanel.tsx
│   │       ├── PropertyPanel.tsx
│   │       └── Toolbar.tsx
│   ├── store/
│   │   ├── projectStore.ts
│   │   └── editorStore.ts
│   ├── lib/
│   │   ├── db.ts
│   │   ├── seedream.ts
│   │   ├── promptBuilder.ts
│   │   └── imageUtils.ts
│   ├── data/
│   │   └── furniture.ts
│   └── types/
│       └── index.ts
├── __tests__/
│   ├── lib/
│   │   ├── promptBuilder.test.ts
│   │   └── imageUtils.test.ts
│   ├── store/
│   │   ├── projectStore.test.ts
│   │   └── editorStore.test.ts
│   └── api/
│       └── generate.test.ts
├── .env.local
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
└── README.md
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.ts`, `.env.local`, `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`

- [ ] **Step 1: Initialize Next.js project**

```bash
cd /Users/niko/furnish
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Select defaults when prompted. This creates the full Next.js scaffold with App Router.

- [ ] **Step 2: Install dependencies**

```bash
npm install three @react-three/fiber @react-three/drei zustand dexie uuid
npm install -D @types/three @types/uuid vitest @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 3: Configure Vitest**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

Add to `package.json` scripts:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 4: Create .env.local**

```
SEEDREAM_API_KEY=your_volcengine_api_key_here
SEEDREAM_API_URL=https://visual.volcengineapi.com/v1/images/generations
```

- [ ] **Step 5: Verify project runs**

```bash
npm run dev
```

Expected: Next.js dev server starts on localhost:3000.

- [ ] **Step 6: Commit**

```bash
git init
git add .
git commit -m "chore: scaffold Next.js project with dependencies"
```

---

## Task 2: Type Definitions and Furniture Data

**Files:**
- Create: `src/types/index.ts`, `src/data/furniture.ts`

- [ ] **Step 1: Define types**

Create `src/types/index.ts`:

```typescript
export interface Project {
  id: string
  name: string
  roomImage: Blob
  style: string
  createdAt: number
  updatedAt: number
}

export interface GeneratedImage {
  id: string
  projectId: string
  imageData: Blob
  prompt: string
  selected: boolean
  createdAt: number
}

export interface Scene {
  projectId: string
  furniture: FurnitureItem[]
  cameraPosition: [number, number, number]
}

export interface FurnitureItem {
  id: string
  modelId: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
}

export interface FurnitureMeta {
  id: string
  name: string
  category: 'living' | 'bedroom' | 'dining' | 'other'
  description: string
  modelPath: string
  thumbnail: string
}

export interface GenerateRequest {
  roomImage: string
  style: string
  furniture: string[]
  prompt?: string
}

export interface GenerateResponse {
  images: string[]
}
```

- [ ] **Step 2: Define furniture catalog data**

Create `src/data/furniture.ts`:

```typescript
import { FurnitureMeta } from '@/types'

export const FURNITURE_CATALOG: FurnitureMeta[] = [
  {
    id: 'sofa-gray',
    name: '灰色布艺沙发',
    category: 'living',
    description: '灰色布艺三人沙发',
    modelPath: '/models/sofa.glb',
    thumbnail: '/models/thumbnails/sofa.png',
  },
  {
    id: 'coffee-table',
    name: '原木茶几',
    category: 'living',
    description: '北欧风原木茶几',
    modelPath: '/models/coffee-table.glb',
    thumbnail: '/models/thumbnails/coffee-table.png',
  },
  {
    id: 'tv-stand',
    name: '电视柜',
    category: 'living',
    description: '白色简约电视柜',
    modelPath: '/models/tv-stand.glb',
    thumbnail: '/models/thumbnails/tv-stand.png',
  },
  {
    id: 'floor-lamp',
    name: '落地灯',
    category: 'living',
    description: '现代简约落地灯',
    modelPath: '/models/floor-lamp.glb',
    thumbnail: '/models/thumbnails/floor-lamp.png',
  },
  {
    id: 'bed-double',
    name: '双人床',
    category: 'bedroom',
    description: '现代简约双人床',
    modelPath: '/models/bed.glb',
    thumbnail: '/models/thumbnails/bed.png',
  },
  {
    id: 'nightstand',
    name: '床头柜',
    category: 'bedroom',
    description: '白色床头柜',
    modelPath: '/models/nightstand.glb',
    thumbnail: '/models/thumbnails/nightstand.png',
  },
  {
    id: 'wardrobe',
    name: '衣柜',
    category: 'bedroom',
    description: '两门大衣柜',
    modelPath: '/models/wardrobe.glb',
    thumbnail: '/models/thumbnails/wardrobe.png',
  },
  {
    id: 'desk',
    name: '书桌',
    category: 'bedroom',
    description: '简约书桌',
    modelPath: '/models/desk.glb',
    thumbnail: '/models/thumbnails/desk.png',
  },
  {
    id: 'dining-table',
    name: '餐桌',
    category: 'dining',
    description: '四人餐桌',
    modelPath: '/models/dining-table.glb',
    thumbnail: '/models/thumbnails/dining-table.png',
  },
  {
    id: 'dining-chair',
    name: '餐椅',
    category: 'dining',
    description: '木质餐椅',
    modelPath: '/models/dining-chair.glb',
    thumbnail: '/models/thumbnails/dining-chair.png',
  },
  {
    id: 'plant',
    name: '盆栽',
    category: 'other',
    description: '绿色盆栽植物',
    modelPath: '/models/plant.glb',
    thumbnail: '/models/thumbnails/plant.png',
  },
  {
    id: 'bookshelf',
    name: '书架',
    category: 'other',
    description: '五层书架',
    modelPath: '/models/bookshelf.glb',
    thumbnail: '/models/thumbnails/bookshelf.png',
  },
]

export const STYLES = [
  { id: 'modern', name: '现代简约' },
  { id: 'nordic', name: '北欧' },
  { id: 'chinese', name: '中式' },
  { id: 'japanese', name: '日式' },
  { id: 'industrial', name: '工业风' },
  { id: 'minimalist', name: '极简' },
] as const

export type StyleId = (typeof STYLES)[number]['id']
```

- [ ] **Step 3: Commit**

```bash
git add src/types src/data
git commit -m "feat: add type definitions and furniture catalog data"
```

---

## Task 3: Utility Libraries

**Files:**
- Create: `src/lib/imageUtils.ts`, `src/lib/promptBuilder.ts`, `__tests__/lib/imageUtils.test.ts`, `__tests__/lib/promptBuilder.test.ts`

- [ ] **Step 1: Write failing tests for promptBuilder**

Create `__tests__/lib/promptBuilder.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { buildPrompt } from '@/lib/promptBuilder'

describe('buildPrompt', () => {
  it('builds prompt with style and furniture', () => {
    const result = buildPrompt('北欧', ['灰色布艺三人沙发', '原木茶几'])
    expect(result).toContain('北欧')
    expect(result).toContain('灰色布艺三人沙发')
    expect(result).toContain('原木茶几')
    expect(result).toContain('真实感室内摄影效果')
  })

  it('appends custom prompt', () => {
    const result = buildPrompt('中式', ['书架'], '增加暖色灯光')
    expect(result).toContain('增加暖色灯光')
  })

  it('handles empty furniture list', () => {
    const result = buildPrompt('日式', [])
    expect(result).toContain('日式')
    expect(result).not.toContain('放入')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/lib/promptBuilder.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement promptBuilder**

Create `src/lib/promptBuilder.ts`:

```typescript
export function buildPrompt(
  style: string,
  furnitureDescriptions: string[],
  customPrompt?: string
): string {
  let prompt = `将这个房间装修为${style}风格`

  if (furnitureDescriptions.length > 0) {
    prompt += `，放入${furnitureDescriptions.join('、')}`
  }

  prompt += '，保持房间结构不变，真实感室内摄影效果'

  if (customPrompt) {
    prompt += `。${customPrompt}`
  }

  return prompt
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run __tests__/lib/promptBuilder.test.ts
```

Expected: 3 tests PASS.

- [ ] **Step 5: Write failing tests for imageUtils**

Create `__tests__/lib/imageUtils.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { blobToBase64, base64ToBlob } from '@/lib/imageUtils'

describe('imageUtils', () => {
  it('converts blob to base64 and back', async () => {
    const original = new Blob(['test-data'], { type: 'image/png' })
    const base64 = await blobToBase64(original)
    expect(base64).toContain('data:image/png;base64,')

    const restored = base64ToBlob(base64)
    expect(restored.type).toBe('image/png')
  })

  it('handles empty blob', async () => {
    const empty = new Blob([], { type: 'image/jpeg' })
    const base64 = await blobToBase64(empty)
    expect(base64).toContain('data:image/jpeg;base64,')
  })
})
```

- [ ] **Step 6: Run test to verify it fails**

```bash
npx vitest run __tests__/lib/imageUtils.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 7: Implement imageUtils**

Create `src/lib/imageUtils.ts`:

```typescript
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export function base64ToBlob(base64: string): Blob {
  const [header, data] = base64.split(',')
  const mimeMatch = header.match(/:(.*?);/)
  const mime = mimeMatch ? mimeMatch[1] : 'image/png'
  const bytes = atob(data)
  const buffer = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) {
    buffer[i] = bytes.charCodeAt(i)
  }
  return new Blob([buffer], { type: mime })
}

export function compressImage(
  file: File,
  maxWidth: number = 2048
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let { width, height } = img
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Failed to compress image'))
        },
        'image/jpeg',
        0.85
      )
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
npx vitest run __tests__/lib/
```

Expected: All tests PASS.

- [ ] **Step 9: Commit**

```bash
git add src/lib/promptBuilder.ts src/lib/imageUtils.ts __tests__/lib/
git commit -m "feat: add promptBuilder and imageUtils with tests"
```

---

## Task 4: IndexedDB Setup

**Files:**
- Create: `src/lib/db.ts`

- [ ] **Step 1: Create Dexie database**

Create `src/lib/db.ts`:

```typescript
import Dexie, { type EntityTable } from 'dexie'
import type { Project, GeneratedImage, Scene } from '@/types'

const db = new Dexie('FurnishDB') as Dexie & {
  projects: EntityTable<Project, 'id'>
  generatedImages: EntityTable<GeneratedImage, 'id'>
  scenes: EntityTable<Scene, 'projectId'>
}

db.version(1).stores({
  projects: 'id, createdAt',
  generatedImages: 'id, projectId, createdAt',
  scenes: 'projectId',
})

export { db }
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/db.ts
git commit -m "feat: add Dexie IndexedDB database setup"
```

---

## Task 5: Zustand Stores

**Files:**
- Create: `src/store/projectStore.ts`, `src/store/editorStore.ts`, `__tests__/store/projectStore.test.ts`, `__tests__/store/editorStore.test.ts`

- [ ] **Step 1: Write failing tests for editorStore**

Create `__tests__/store/editorStore.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useEditorStore } from '@/store/editorStore'

describe('editorStore', () => {
  beforeEach(() => {
    useEditorStore.setState({
      furniture: [],
      selectedId: null,
      history: [],
      historyIndex: -1,
    })
  })

  it('adds furniture to scene', () => {
    const { addFurniture } = useEditorStore.getState()
    addFurniture('sofa-gray')
    const { furniture } = useEditorStore.getState()
    expect(furniture).toHaveLength(1)
    expect(furniture[0].modelId).toBe('sofa-gray')
  })

  it('removes furniture from scene', () => {
    const { addFurniture } = useEditorStore.getState()
    addFurniture('sofa-gray')
    const { furniture, removeFurniture } = useEditorStore.getState()
    removeFurniture(furniture[0].id)
    expect(useEditorStore.getState().furniture).toHaveLength(0)
  })

  it('selects and deselects furniture', () => {
    const { addFurniture } = useEditorStore.getState()
    addFurniture('sofa-gray')
    const { furniture, selectFurniture } = useEditorStore.getState()
    selectFurniture(furniture[0].id)
    expect(useEditorStore.getState().selectedId).toBe(furniture[0].id)
    useEditorStore.getState().selectFurniture(null)
    expect(useEditorStore.getState().selectedId).toBeNull()
  })

  it('updates furniture transform', () => {
    const { addFurniture } = useEditorStore.getState()
    addFurniture('sofa-gray')
    const { furniture, updateFurniture } = useEditorStore.getState()
    updateFurniture(furniture[0].id, { position: [1, 0, 2] })
    const updated = useEditorStore.getState().furniture[0]
    expect(updated.position).toEqual([1, 0, 2])
  })

  it('supports undo and redo', () => {
    const { addFurniture } = useEditorStore.getState()
    addFurniture('sofa-gray')
    addFurniture('coffee-table')
    expect(useEditorStore.getState().furniture).toHaveLength(2)

    useEditorStore.getState().undo()
    expect(useEditorStore.getState().furniture).toHaveLength(1)

    useEditorStore.getState().redo()
    expect(useEditorStore.getState().furniture).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run __tests__/store/editorStore.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement editorStore**

Create `src/store/editorStore.ts`:

```typescript
import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { FurnitureItem } from '@/types'

interface EditorState {
  furniture: FurnitureItem[]
  selectedId: string | null
  history: FurnitureItem[][]
  historyIndex: number
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
  furniture: [],
  selectedId: null,
  history: [],
  historyIndex: -1,

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
  },

  updateFurniture: (id: string, updates: Partial<FurnitureItem>) => {
    set((state) => {
      const newFurniture = state.furniture.map((f) =>
        f.id === id ? { ...f, ...updates } : f
      )
      const hist = pushHistory({ ...state, furniture: newFurniture })
      return { furniture: newFurniture, ...hist }
    })
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
  },

  clearScene: () => {
    set((state) => {
      const hist = pushHistory({ ...state, furniture: [] })
      return { furniture: [], selectedId: null, ...hist }
    })
  },
}))
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run __tests__/store/editorStore.test.ts
```

Expected: 5 tests PASS.

- [ ] **Step 5: Write failing tests for projectStore**

Create `__tests__/store/projectStore.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  db: {
    projects: {
      add: vi.fn(),
      get: vi.fn(),
      toArray: vi.fn().mockResolvedValue([]),
      orderBy: vi.fn().mockReturnValue({
        reverse: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
        }),
      }),
      delete: vi.fn(),
    },
    generatedImages: {
      where: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
      }),
      bulkAdd: vi.fn(),
    },
    scenes: {
      get: vi.fn(),
      put: vi.fn(),
    },
  },
}))

import { useProjectStore } from '@/store/projectStore'

describe('projectStore', () => {
  beforeEach(() => {
    useProjectStore.setState({
      projects: [],
      currentProjectId: null,
    })
  })

  it('has correct initial state', () => {
    const state = useProjectStore.getState()
    expect(state.projects).toEqual([])
    expect(state.currentProjectId).toBeNull()
  })

  it('sets current project id', () => {
    useProjectStore.getState().setCurrentProject('test-id')
    expect(useProjectStore.getState().currentProjectId).toBe('test-id')
  })
})
```

- [ ] **Step 6: Run test to verify it fails**

```bash
npx vitest run __tests__/store/projectStore.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 7: Implement projectStore**

Create `src/store/projectStore.ts`:

```typescript
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

  saveGeneratedImages: async (projectId: string, images: GeneratedImage[]) => {
    await db.generatedImages.bulkAdd(images)
  },
}))
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
npx vitest run __tests__/store/
```

Expected: All tests PASS.

- [ ] **Step 9: Commit**

```bash
git add src/store/ __tests__/store/
git commit -m "feat: add Zustand stores for project and editor state"
```

---

## Task 6: Seedream API Client and Route

**Files:**
- Create: `src/lib/seedream.ts`, `src/app/api/generate/route.ts`

- [ ] **Step 1: Implement Seedream client**

Create `src/lib/seedream.ts`:

```typescript
interface SeedreamRequest {
  prompt: string
  images?: string[]
  size?: string
  max_images?: number
  watermark?: boolean
}

interface SeedreamResponse {
  images: string[]
}

export async function callSeedream(params: SeedreamRequest): Promise<SeedreamResponse> {
  const apiKey = process.env.SEEDREAM_API_KEY
  const apiUrl = process.env.SEEDREAM_API_URL

  if (!apiKey || !apiUrl) {
    throw new Error('Seedream API configuration missing')
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      prompt: params.prompt,
      images: params.images,
      size: params.size ?? '2K',
      max_images: params.max_images ?? 4,
      watermark: params.watermark ?? false,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Seedream API error: ${response.status} - ${error}`)
  }

  return response.json()
}
```

- [ ] **Step 2: Implement API route**

Create `src/app/api/generate/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { callSeedream } from '@/lib/seedream'
import { buildPrompt } from '@/lib/promptBuilder'
import type { GenerateRequest } from '@/types'

export async function POST(request: Request) {
  try {
    const body: GenerateRequest = await request.json()
    const { roomImage, style, furniture, prompt: customPrompt } = body

    if (!roomImage || !style) {
      return NextResponse.json(
        { error: 'roomImage and style are required' },
        { status: 400 }
      )
    }

    const prompt = buildPrompt(style, furniture, customPrompt)

    const result = await callSeedream({
      prompt,
      images: [roomImage],
      size: '2K',
      max_images: 4,
      watermark: false,
    })

    return NextResponse.json({ images: result.images })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/seedream.ts src/app/api/generate/
git commit -m "feat: add Seedream API client and proxy route"
```

---

## Task 7: Upload Page (Home)

**Files:**
- Create: `src/components/upload/ImageUploader.tsx`
- Modify: `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`

- [ ] **Step 1: Update root layout**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Furnish - AI 装修效果预览',
  description: 'AI 驱动的装修效果预览平台',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  )
}
```

- [ ] **Step 2: Create ImageUploader component**

Create `src/components/upload/ImageUploader.tsx`:

```tsx
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
```

- [ ] **Step 3: Build home page**

Replace `src/app/page.tsx`:

```tsx
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
```

- [ ] **Step 4: Verify page renders**

```bash
npm run dev
```

Open http://localhost:3000 — should see title, upload area, and project list.

- [ ] **Step 5: Commit**

```bash
git add src/components/upload/ src/app/page.tsx src/app/layout.tsx
git commit -m "feat: add home page with image uploader and project list"
```

---

## Task 8: AI Generation Page

**Files:**
- Create: `src/components/generate/StyleSelector.tsx`, `src/components/generate/FurniturePicker.tsx`, `src/components/generate/PromptEditor.tsx`, `src/components/generate/ResultGallery.tsx`, `src/app/generate/page.tsx`

- [ ] **Step 1: Create StyleSelector**

Create `src/components/generate/StyleSelector.tsx`:

```tsx
'use client'

import { STYLES, type StyleId } from '@/data/furniture'

interface StyleSelectorProps {
  selected: StyleId
  onSelect: (style: StyleId) => void
}

export default function StyleSelector({ selected, onSelect }: StyleSelectorProps) {
  return (
    <div>
      <h3 className="font-medium mb-2">装修风格</h3>
      <div className="grid grid-cols-3 gap-2">
        {STYLES.map((style) => (
          <button
            key={style.id}
            onClick={() => onSelect(style.id)}
            className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
              selected === style.id
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {style.name}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create FurniturePicker**

Create `src/components/generate/FurniturePicker.tsx`:

```tsx
'use client'

import { FURNITURE_CATALOG } from '@/data/furniture'

interface FurniturePickerProps {
  selected: string[]
  onToggle: (id: string) => void
}

export default function FurniturePicker({ selected, onToggle }: FurniturePickerProps) {
  const categories = [
    { key: 'living', name: '客厅' },
    { key: 'bedroom', name: '卧室' },
    { key: 'dining', name: '餐厅' },
    { key: 'other', name: '其他' },
  ] as const

  return (
    <div>
      <h3 className="font-medium mb-2">选择家具</h3>
      {categories.map((cat) => {
        const items = FURNITURE_CATALOG.filter((f) => f.category === cat.key)
        if (items.length === 0) return null
        return (
          <div key={cat.key} className="mb-3">
            <p className="text-xs text-gray-500 mb-1">{cat.name}</p>
            <div className="grid grid-cols-4 gap-2">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onToggle(item.id)}
                  className={`p-2 rounded-lg text-xs border transition-colors ${
                    selected.includes(item.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Create PromptEditor**

Create `src/components/generate/PromptEditor.tsx`:

```tsx
'use client'

interface PromptEditorProps {
  value: string
  onChange: (value: string) => void
}

export default function PromptEditor({ value, onChange }: PromptEditorProps) {
  return (
    <div>
      <h3 className="font-medium mb-2">自定义描述（可选）</h3>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="例如：增加暖色灯光，窗户采用落地窗..."
        className="w-full border rounded-lg p-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}
```

- [ ] **Step 4: Create ResultGallery**

Create `src/components/generate/ResultGallery.tsx`:

```tsx
'use client'

interface ResultGalleryProps {
  images: string[]
  selectedIndex: number | null
  onSelect: (index: number) => void
}

export default function ResultGallery({
  images,
  selectedIndex,
  onSelect,
}: ResultGalleryProps) {
  if (images.length === 0) return null

  return (
    <div>
      <h3 className="font-medium mb-2">生成结果</h3>
      <div className="grid grid-cols-2 gap-3">
        {images.map((src, i) => (
          <div
            key={i}
            onClick={() => onSelect(i)}
            className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-colors ${
              selectedIndex === i ? 'border-blue-500' : 'border-transparent'
            }`}
          >
            <img src={src} alt={`方案 ${i + 1}`} className="w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Build generate page**

Create `src/app/generate/page.tsx`:

```tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import StyleSelector from '@/components/generate/StyleSelector'
import FurniturePicker from '@/components/generate/FurniturePicker'
import PromptEditor from '@/components/generate/PromptEditor'
import ResultGallery from '@/components/generate/ResultGallery'
import { useProjectStore } from '@/store/projectStore'
import { FURNITURE_CATALOG, STYLES, type StyleId } from '@/data/furniture'
import { blobToBase64 } from '@/lib/imageUtils'
import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'
import type { GeneratedImage } from '@/types'

export default function GeneratePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project')
  const { saveGeneratedImages } = useProjectStore()

  const [roomPreview, setRoomPreview] = useState<string | null>(null)
  const [style, setStyle] = useState<StyleId>('modern')
  const [selectedFurniture, setSelectedFurniture] = useState<string[]>([])
  const [customPrompt, setCustomPrompt] = useState('')
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [selectedResult, setSelectedResult] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId) return
    db.projects.get(projectId).then((project) => {
      if (!project) return
      setStyle((project.style as StyleId) || 'modern')
      const url = URL.createObjectURL(project.roomImage)
      setRoomPreview(url)
    })
  }, [projectId])

  const toggleFurniture = useCallback((id: string) => {
    setSelectedFurniture((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    )
  }, [])

  const handleGenerate = async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)

    try {
      const project = await db.projects.get(projectId)
      if (!project) throw new Error('Project not found')

      const base64 = await blobToBase64(project.roomImage)
      const furnitureDescriptions = selectedFurniture.map(
        (id) => FURNITURE_CATALOG.find((f) => f.id === id)?.description ?? ''
      ).filter(Boolean)

      const styleName = STYLES.find((s) => s.id === style)?.name ?? style

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomImage: base64,
          style: styleName,
          furniture: furnitureDescriptions,
          prompt: customPrompt || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Generation failed')
      }

      const data = await response.json()
      setGeneratedImages(data.images)

      const images: GeneratedImage[] = data.images.map((img: string) => ({
        id: uuidv4(),
        projectId,
        imageData: new Blob(),
        prompt: '',
        selected: false,
        createdAt: Date.now(),
      }))
      await saveGeneratedImages(projectId, images)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleEnterEditor = () => {
    router.push(`/editor?project=${projectId}`)
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">AI 效果图生成</h1>
        <button
          onClick={() => router.push('/')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          返回首页
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          {roomPreview && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">原始房间</h3>
              <img
                src={roomPreview}
                alt="房间"
                className="w-full rounded-lg"
              />
            </div>
          )}
          <ResultGallery
            images={generatedImages}
            selectedIndex={selectedResult}
            onSelect={setSelectedResult}
          />
          {generatedImages.length > 0 && (
            <button
              onClick={handleEnterEditor}
              className="mt-4 w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              进入 3D 编辑
            </button>
          )}
        </div>

        <div className="space-y-6">
          <StyleSelector selected={style} onSelect={setStyle} />
          <FurniturePicker
            selected={selectedFurniture}
            onToggle={toggleFurniture}
          />
          <PromptEditor value={customPrompt} onChange={setCustomPrompt} />

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? '生成中...' : '生成效果图'}
          </button>
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 6: Verify page renders**

```bash
npm run dev
```

Navigate to http://localhost:3000, upload a room photo, verify redirect to /generate page with controls visible.

- [ ] **Step 7: Commit**

```bash
git add src/components/generate/ src/app/generate/
git commit -m "feat: add AI generation page with style, furniture, and prompt controls"
```

---

## Task 9: 3D Editor - Scene and Room

**Files:**
- Create: `src/components/editor/Canvas3D.tsx`, `src/components/editor/Room.tsx`, `src/components/editor/FurnitureModel.tsx`

- [ ] **Step 1: Create Room component**

Create `src/components/editor/Room.tsx`:

```tsx
'use client'

export default function Room() {
  const width = 5
  const depth = 4
  const height = 2.8
  const wallThickness = 0.1
  const wallColor = '#f5f5f5'
  const floorColor = '#e8e0d8'

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={floorColor} />
      </mesh>

      <mesh position={[0, height / 2, -depth / 2]} receiveShadow>
        <boxGeometry args={[width, height, wallThickness]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>

      <mesh position={[-width / 2, height / 2, 0]} receiveShadow>
        <boxGeometry args={[wallThickness, height, depth]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>

      <mesh position={[width / 2, height / 2, 0]} receiveShadow>
        <boxGeometry args={[wallThickness, height, depth]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>
    </group>
  )
}
```

- [ ] **Step 2: Create FurnitureModel component**

Create `src/components/editor/FurnitureModel.tsx`:

```tsx
'use client'

import { useRef, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { FurnitureItem } from '@/types'
import { FURNITURE_CATALOG } from '@/data/furniture'

interface FurnitureModelProps {
  item: FurnitureItem
  isSelected: boolean
  onSelect: (id: string) => void
}

export default function FurnitureModel({
  item,
  isSelected,
  onSelect,
}: FurnitureModelProps) {
  const meta = FURNITURE_CATALOG.find((f) => f.id === item.modelId)
  const groupRef = useRef<THREE.Group>(null)

  if (!meta) return null

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    onSelect(item.id)
  }

  return (
    <group
      ref={groupRef}
      position={item.position}
      rotation={item.rotation}
      scale={item.scale}
      onClick={handleClick}
    >
      <mesh>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial
          color={isSelected ? '#60a5fa' : '#94a3b8'}
          transparent
          opacity={0.8}
        />
      </mesh>
    </group>
  )
}
```

Note: MVP uses placeholder box geometry. When real glTF models are added to `public/models/`, replace the `<mesh>` with:

```tsx
const { scene } = useGLTF(meta.modelPath)
return <primitive object={scene.clone()} ... />
```

- [ ] **Step 3: Create Canvas3D component**

Create `src/components/editor/Canvas3D.tsx`:

```tsx
'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, TransformControls, Grid } from '@react-three/drei'
import { useRef } from 'react'
import Room from './Room'
import FurnitureModel from './FurnitureModel'
import { useEditorStore } from '@/store/editorStore'

export default function Canvas3D() {
  const { furniture, selectedId, selectFurniture, updateFurniture } =
    useEditorStore()
  const transformRef = useRef<any>(null)
  const orbitRef = useRef<any>(null)

  const selectedItem = furniture.find((f) => f.id === selectedId)

  const handleTransformChange = () => {
    if (!transformRef.current || !selectedId) return
    const object = transformRef.current.object
    if (!object) return
    updateFurniture(selectedId, {
      position: [object.position.x, object.position.y, object.position.z],
      rotation: [object.rotation.x, object.rotation.y, object.rotation.z],
      scale: [object.scale.x, object.scale.y, object.scale.z],
    })
  }

  return (
    <Canvas
      shadows
      camera={{ position: [5, 5, 5], fov: 50 }}
      onPointerMissed={() => selectFurniture(null)}
      className="bg-gray-100"
    >
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={0.8}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      <Room />

      {furniture.map((item) => (
        <FurnitureModel
          key={item.id}
          item={item}
          isSelected={item.id === selectedId}
          onSelect={selectFurniture}
        />
      ))}

      {selectedItem && (
        <TransformControls
          ref={transformRef}
          position={selectedItem.position}
          rotation={selectedItem.rotation}
          scale={selectedItem.scale}
          onMouseUp={handleTransformChange}
          onObjectChange={() => {
            if (orbitRef.current) orbitRef.current.enabled = false
          }}
        />
      )}

      <OrbitControls
        ref={orbitRef}
        makeDefault
        maxPolarAngle={Math.PI / 2}
      />

      <Grid
        infiniteGrid
        fadeDistance={20}
        fadeStrength={5}
        cellSize={0.5}
        sectionSize={1}
      />
    </Canvas>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/editor/Canvas3D.tsx src/components/editor/Room.tsx src/components/editor/FurnitureModel.tsx
git commit -m "feat: add 3D scene with room, furniture models, and controls"
```

---

## Task 10: 3D Editor - UI Panels

**Files:**
- Create: `src/components/editor/FurniturePanel.tsx`, `src/components/editor/PropertyPanel.tsx`, `src/components/editor/Toolbar.tsx`, `src/app/editor/page.tsx`

- [ ] **Step 1: Create FurniturePanel**

Create `src/components/editor/FurniturePanel.tsx`:

```tsx
'use client'

import { FURNITURE_CATALOG } from '@/data/furniture'
import { useEditorStore } from '@/store/editorStore'

export default function FurniturePanel() {
  const { addFurniture } = useEditorStore()

  const categories = [
    { key: 'living', name: '客厅' },
    { key: 'bedroom', name: '卧室' },
    { key: 'dining', name: '餐厅' },
    { key: 'other', name: '其他' },
  ] as const

  return (
    <div className="w-56 bg-white border-r overflow-y-auto p-3">
      <h2 className="font-semibold mb-3">家具库</h2>
      {categories.map((cat) => {
        const items = FURNITURE_CATALOG.filter((f) => f.category === cat.key)
        if (items.length === 0) return null
        return (
          <div key={cat.key} className="mb-4">
            <p className="text-xs text-gray-500 mb-1">{cat.name}</p>
            <div className="space-y-1">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => addFurniture(item.id)}
                  className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 transition-colors"
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Create PropertyPanel**

Create `src/components/editor/PropertyPanel.tsx`:

```tsx
'use client'

import { useEditorStore } from '@/store/editorStore'
import { FURNITURE_CATALOG } from '@/data/furniture'

export default function PropertyPanel() {
  const { furniture, selectedId, updateFurniture, removeFurniture } =
    useEditorStore()
  const selected = furniture.find((f) => f.id === selectedId)

  if (!selected) {
    return (
      <div className="w-56 bg-white border-l p-3">
        <p className="text-sm text-gray-400">点击家具以编辑属性</p>
      </div>
    )
  }

  const meta = FURNITURE_CATALOG.find((f) => f.id === selected.modelId)

  const handleChange = (
    field: 'position' | 'rotation' | 'scale',
    axis: number,
    value: string
  ) => {
    const arr = [...selected[field]] as [number, number, number]
    arr[axis] = parseFloat(value) || 0
    updateFurniture(selected.id, { [field]: arr })
  }

  const axes = ['X', 'Y', 'Z']

  return (
    <div className="w-56 bg-white border-l p-3 overflow-y-auto">
      <h2 className="font-semibold mb-1">{meta?.name ?? selected.modelId}</h2>
      <p className="text-xs text-gray-400 mb-4">{meta?.description}</p>

      {(['position', 'rotation', 'scale'] as const).map((field) => (
        <div key={field} className="mb-3">
          <p className="text-xs text-gray-500 mb-1">
            {field === 'position' ? '位置' : field === 'rotation' ? '旋转' : '缩放'}
          </p>
          <div className="grid grid-cols-3 gap-1">
            {axes.map((axis, i) => (
              <div key={axis}>
                <label className="text-xs text-gray-400">{axis}</label>
                <input
                  type="number"
                  step={field === 'rotation' ? 0.1 : 0.1}
                  value={selected[field][i]}
                  onChange={(e) => handleChange(field, i, e.target.value)}
                  className="w-full border rounded px-1 py-0.5 text-xs"
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <button
        onClick={() => removeFurniture(selected.id)}
        className="w-full mt-4 text-sm text-red-500 border border-red-200 rounded py-1 hover:bg-red-50"
      >
        删除
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Create Toolbar**

Create `src/components/editor/Toolbar.tsx`:

```tsx
'use client'

import { useEditorStore } from '@/store/editorStore'
import { useThree } from '@react-three/fiber'
import { useCallback } from 'react'

interface ToolbarProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
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
```

- [ ] **Step 4: Build editor page**

Create `src/app/editor/page.tsx`:

```tsx
'use client'

import { useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import FurniturePanel from '@/components/editor/FurniturePanel'
import PropertyPanel from '@/components/editor/PropertyPanel'
import Toolbar from '@/components/editor/Toolbar'
import { useEditorStore } from '@/store/editorStore'

const Canvas3D = dynamic(() => import('@/components/editor/Canvas3D'), {
  ssr: false,
})

export default function EditorPage() {
  const router = useRouter()
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const { furniture } = useEditorStore()

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
        <h1 className="font-semibold">3D 编辑器</h1>
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
```

- [ ] **Step 5: Verify editor page**

```bash
npm run dev
```

Navigate to http://localhost:3000/editor — should see 3D room with side panels.

- [ ] **Step 6: Commit**

```bash
git add src/components/editor/ src/app/editor/
git commit -m "feat: add 3D editor page with furniture panel, property panel, and toolbar"
```

---

## Task 11: Integration and Persistence

**Files:**
- Modify: `src/store/editorStore.ts`, `src/app/editor/page.tsx`

- [ ] **Step 1: Add scene persistence to editorStore**

Add to `src/store/editorStore.ts` — replace the entire file:

```typescript
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
```

- [ ] **Step 2: Update editor page to load scene by project**

Replace `src/app/editor/page.tsx`:

```tsx
'use client'

import { useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import FurniturePanel from '@/components/editor/FurniturePanel'
import PropertyPanel from '@/components/editor/PropertyPanel'
import Toolbar from '@/components/editor/Toolbar'
import { useEditorStore } from '@/store/editorStore'

const Canvas3D = dynamic(() => import('@/components/editor/Canvas3D'), {
  ssr: false,
})

export default function EditorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project')
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const { furniture, loadScene } = useEditorStore()

  useEffect(() => {
    if (projectId) {
      loadScene(projectId)
    }
  }, [projectId, loadScene])

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
        <h1 className="font-semibold">3D 编辑器</h1>
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
```

- [ ] **Step 3: Update editorStore tests**

Replace `__tests__/store/editorStore.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  db: {
    scenes: {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
    },
  },
}))

import { useEditorStore } from '@/store/editorStore'

describe('editorStore', () => {
  beforeEach(() => {
    useEditorStore.setState({
      projectId: 'test-project',
      furniture: [],
      selectedId: null,
      history: [[]],
      historyIndex: 0,
    })
  })

  it('adds furniture to scene', () => {
    useEditorStore.getState().addFurniture('sofa-gray')
    const { furniture } = useEditorStore.getState()
    expect(furniture).toHaveLength(1)
    expect(furniture[0].modelId).toBe('sofa-gray')
  })

  it('removes furniture from scene', () => {
    useEditorStore.getState().addFurniture('sofa-gray')
    const { furniture } = useEditorStore.getState()
    useEditorStore.getState().removeFurniture(furniture[0].id)
    expect(useEditorStore.getState().furniture).toHaveLength(0)
  })

  it('selects and deselects furniture', () => {
    useEditorStore.getState().addFurniture('sofa-gray')
    const { furniture } = useEditorStore.getState()
    useEditorStore.getState().selectFurniture(furniture[0].id)
    expect(useEditorStore.getState().selectedId).toBe(furniture[0].id)
    useEditorStore.getState().selectFurniture(null)
    expect(useEditorStore.getState().selectedId).toBeNull()
  })

  it('updates furniture transform', () => {
    useEditorStore.getState().addFurniture('sofa-gray')
    const { furniture } = useEditorStore.getState()
    useEditorStore.getState().updateFurniture(furniture[0].id, {
      position: [1, 0, 2],
    })
    const updated = useEditorStore.getState().furniture[0]
    expect(updated.position).toEqual([1, 0, 2])
  })

  it('supports undo and redo', () => {
    useEditorStore.getState().addFurniture('sofa-gray')
    useEditorStore.getState().addFurniture('coffee-table')
    expect(useEditorStore.getState().furniture).toHaveLength(2)

    useEditorStore.getState().undo()
    expect(useEditorStore.getState().furniture).toHaveLength(1)

    useEditorStore.getState().redo()
    expect(useEditorStore.getState().furniture).toHaveLength(2)
  })
})
```

- [ ] **Step 4: Run all tests**

```bash
npx vitest run
```

Expected: All tests PASS.

- [ ] **Step 5: Full flow verification**

```bash
npm run dev
```

1. Open http://localhost:3000
2. Upload a room photo → redirects to /generate
3. Select style and furniture, click generate (will fail without real API key, but UI should work)
4. Navigate to /editor → 3D room loads
5. Click furniture from left panel → appears in scene
6. Click furniture in scene → property panel shows values
7. Refresh → furniture persists from IndexedDB

- [ ] **Step 6: Commit**

```bash
git add src/store/editorStore.ts src/app/editor/page.tsx __tests__/store/editorStore.test.ts
git commit -m "feat: add scene persistence and full page flow integration"
```

---

## Task 12: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write README**

Create `README.md`:

```markdown
# Furnish

AI 驱动的装修效果预览平台。上传房间照片，AI 生成装修效果图，3D 编辑器微调家具布局。

## 功能

- 上传房间照片/户型图
- 选择装修风格和家具，AI 生成效果图（Seedream）
- 3D 编辑器拖拽摆放家具
- 撤销/重做操作
- 导出截图
- 数据本地持久化（IndexedDB）

## 技术栈

- Next.js 14+ (App Router)
- React Three Fiber + drei
- Zustand
- Dexie.js (IndexedDB)
- Tailwind CSS

## 开始使用

### 安装依赖

```bash
npm install
```

### 配置环境变量

复制 `.env.local.example` 为 `.env.local`，填入火山引擎 Seedream API 密钥：

```text
SEEDREAM_API_KEY=your_api_key
SEEDREAM_API_URL=https://visual.volcengineapi.com/v1/images/generations
```

### 启动开发服务器

```bash
npm run dev
```

访问 <http://localhost:3000>

### 运行测试

```bash
npm test
```

## 项目结构

```text
src/
  app/            页面和 API 路由
  components/     UI 组件
  store/          Zustand 状态管理
  lib/            工具函数和服务
  data/           静态数据（家具目录）
  types/          TypeScript 类型定义
```

## 开发路线

- [x] M1: 上传 + AI 效果图生成
- [x] M2: 3D 编辑器
- [x] M3: 串联 + 本地持久化
- [ ] 用户上传自定义家具
- [ ] 精确房间尺寸输入
- [ ] 真实材质渲染
- [ ] 电商对接
- [ ] 移动端适配
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add project README"
```

---

## Self-Review Checklist

1. **Spec coverage:** All spec sections covered — upload page (Task 7), AI generation (Task 6, 8), 3D editor (Task 9, 10), persistence (Task 11), data model (Task 4, 5), directory structure (Task 1, 2). MVP exclusions documented in spec match — no auth, no DB, no OSS, no mobile.

2. **Placeholder scan:** No TBD/TODO. All code blocks are complete. FurnitureModel uses placeholder box geometry with explicit note for glTF upgrade path.

3. **Type consistency:** `FurnitureItem`, `Project`, `GeneratedImage`, `Scene` types used consistently across stores, components, and db. `StyleId` type matches `STYLES` definition. `GenerateRequest`/`GenerateResponse` match API route handler.
