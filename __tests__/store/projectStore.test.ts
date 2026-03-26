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
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
        }),
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
