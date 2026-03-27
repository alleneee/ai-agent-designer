import { describe, it, expect, beforeEach, vi } from 'vitest'

const generatedImagesQuery = vi.hoisted(() => ({
  toArray: vi.fn().mockResolvedValue([]),
  delete: vi.fn().mockResolvedValue(undefined),
}))

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
        equals: vi.fn().mockReturnValue(generatedImagesQuery),
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
import { db } from '@/lib/db'

describe('projectStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    generatedImagesQuery.toArray.mockResolvedValue([])
    generatedImagesQuery.delete.mockResolvedValue(undefined)
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

  it('saveGeneratedImages persists generated results as local data URLs when fetch succeeds', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['image-bytes'], { type: 'image/jpeg' }),
    }))

    const saved = await useProjectStore.getState().saveGeneratedImages(
      'project-1',
      ['https://cdn.example/render.jpg'],
      'prompt'
    )

    expect(fetch).toHaveBeenCalledWith('https://cdn.example/render.jpg')
    expect(saved[0].imageUrl).toMatch(/^data:image\/jpeg;base64,/)
    expect(db.generatedImages.bulkAdd).toHaveBeenCalledWith([
      expect.objectContaining({
        projectId: 'project-1',
        imageUrl: expect.stringMatching(/^data:image\/jpeg;base64,/),
        selected: true,
      }),
    ])
  })

  it('saveGeneratedImages falls back to original URL when local persistence fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('blocked by CORS')))

    const saved = await useProjectStore.getState().saveGeneratedImages(
      'project-1',
      ['https://cdn.example/render.jpg'],
      'prompt'
    )

    expect(saved[0].imageUrl).toBe('https://cdn.example/render.jpg')
  })
})
