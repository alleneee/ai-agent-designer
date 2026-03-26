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
