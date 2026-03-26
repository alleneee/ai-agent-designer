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
