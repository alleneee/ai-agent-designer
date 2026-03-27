import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  db: {
    scenes: {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
    },
  },
}))

import { db } from '@/lib/db'
import { useEditorStore } from '@/store/editorStore'

describe('editorStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useEditorStore.setState({
      projectId: 'test-project',
      markers: [],
      selectedId: null,
      backgroundUrl: null,
    })
  })

  it('adds marker to scene', () => {
    useEditorStore.getState().addMarker('sofa', 100, 100)
    const { markers } = useEditorStore.getState()
    expect(markers).toHaveLength(1)
    expect(markers[0].catalogId).toBe('sofa')
    expect(markers[0].x).toBe(100)
  })

  it('removes marker from scene', () => {
    useEditorStore.getState().addMarker('sofa', 100, 100)
    const { markers } = useEditorStore.getState()
    useEditorStore.getState().removeMarker(markers[0].id)
    expect(useEditorStore.getState().markers).toHaveLength(0)
  })

  it('selects and deselects marker', () => {
    useEditorStore.getState().addMarker('sofa', 100, 100)
    const { markers } = useEditorStore.getState()
    useEditorStore.getState().selectMarker(markers[0].id)
    expect(useEditorStore.getState().selectedId).toBe(markers[0].id)
    useEditorStore.getState().selectMarker(null)
    expect(useEditorStore.getState().selectedId).toBeNull()
  })

  it('moves marker', () => {
    useEditorStore.getState().addMarker('sofa', 100, 100)
    const { markers } = useEditorStore.getState()
    useEditorStore.getState().moveMarker(markers[0].id, 200, 150)
    const moved = useEditorStore.getState().markers[0]
    expect(moved.x).toBe(200)
    expect(moved.y).toBe(150)
  })

  it('rotates marker by 90 degrees', () => {
    useEditorStore.getState().addMarker('sofa', 100, 100)
    const { markers } = useEditorStore.getState()
    useEditorStore.getState().rotateMarker(markers[0].id)
    expect(useEditorStore.getState().markers[0].rotation).toBe(90)
    useEditorStore.getState().rotateMarker(markers[0].id)
    expect(useEditorStore.getState().markers[0].rotation).toBe(180)
  })

  it('clears all markers', () => {
    useEditorStore.getState().addMarker('sofa', 100, 100)
    useEditorStore.getState().addMarker('desk', 200, 200)
    useEditorStore.getState().clearMarkers()
    expect(useEditorStore.getState().markers).toHaveLength(0)
  })

  it('saves scene to db', async () => {
    useEditorStore.getState().addMarker('sofa', 100, 100)
    await useEditorStore.getState().saveScene()
    expect(db.scenes.put).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'test-project',
        markers: expect.arrayContaining([
          expect.objectContaining({ catalogId: 'sofa' }),
        ]),
      })
    )
  })
})
