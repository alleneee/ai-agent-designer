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
