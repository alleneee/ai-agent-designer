import { describe, it, expect } from 'vitest'
import { buildPrompt } from '@/lib/promptBuilder'

describe('buildPrompt', () => {
  it('builds prompt with room image and furniture images using 图N references', () => {
    const result = buildPrompt({
      style: '北欧',
      furnitureDescriptions: ['原木茶几'],
      hasRoomImage: true,
      furnitureImageCount: 2,
    })
    expect(result).toContain('图1')
    expect(result).toContain('图2')
    expect(result).toContain('图3')
    expect(result).toContain('北欧')
    expect(result).toContain('原木茶几')
    expect(result).toContain('建筑结构')
  })

  it('builds prompt with room image only', () => {
    const result = buildPrompt({
      style: '中式',
      furnitureDescriptions: ['书架'],
      hasRoomImage: true,
      furnitureImageCount: 0,
    })
    expect(result).toContain('图1')
    expect(result).toContain('中式')
    expect(result).toContain('书架')
  })

  it('builds prompt without any images', () => {
    const result = buildPrompt({
      style: '日式',
      furnitureDescriptions: [],
      hasRoomImage: false,
      furnitureImageCount: 0,
    })
    expect(result).toContain('日式')
    expect(result).toContain('室内装修效果图')
  })

  it('appends custom prompt', () => {
    const result = buildPrompt({
      style: '现代简约',
      furnitureDescriptions: [],
      hasRoomImage: true,
      furnitureImageCount: 0,
      customPrompt: '增加暖色灯光',
    })
    expect(result).toContain('增加暖色灯光')
  })

  it('references single furniture image as 图2', () => {
    const result = buildPrompt({
      style: '北欧',
      furnitureDescriptions: [],
      hasRoomImage: true,
      furnitureImageCount: 1,
    })
    expect(result).toContain('图2')
    expect(result).not.toContain('图3')
  })
})
