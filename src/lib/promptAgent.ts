import Anthropic from '@anthropic-ai/sdk'

const LLM_API_KEY = process.env.LLM_API_KEY
const LLM_API_BASE = process.env.LLM_API_BASE || 'https://api.minimaxi.com/anthropic'

function getClient() {
  if (!LLM_API_KEY) {
    throw new Error('LLM_API_KEY is not set')
  }
  return new Anthropic({ apiKey: LLM_API_KEY, baseURL: LLM_API_BASE })
}

const MODEL = process.env.LLM_MODEL || 'anthropic/MiniMax-M2.7'

const SYSTEM_PROMPT = `你是一个专业的室内设计效果图提示词优化专家。你的任务是将用户的装修需求转化为高质量的图像生成提示词。

## 强制格式要求（违反任何一条视为失败）

1. **提示词必须以"基于图1中的真实房间"开头**
2. **有参考图的家具：禁止描述其外观** —— 只写"将图N中的{家具名}原样放入房间，保持与图N完全一致的外观、款式、颜色、材质"。绝对不要用自己的文字描述该家具的颜色、材质、风格，因为文字描述会覆盖图片引用导致生成结果与参考图不符
3. **无参考图的家具：可以详细描述** —— 描述该家具适合的款式、颜色、材质
4. **只输出提示词本身** —— 不要解释、不要加引号、不要分段，整段输出
5. **保持中文**

## 错误示例（有参考图时）

错误：图2是沙发参考图，选用浅灰色亚麻面料搭配原木色沙发腿 ← 自行描述了颜色材质，会覆盖图片
正确：将图2中的沙发原样放入房间，保持与图2完全一致的外观、款式、颜色、材质 ← 不描述具体外观，让模型从图片读取

## 提示词结构

基于图1中的真实房间进行{风格}风格的室内装修设计。[结构说明]。[将图N中的XX原样放入房间，保持与图N完全一致的外观]。[添加YY家具+详细描述]。[氛围描述]。专业室内设计效果图，高清写实风格，自然光照，8K质感

## 优化方向（仅针对无参考图的元素和整体氛围）

- 整体光照氛围、色彩搭配、空间层次
- 无参考图家具的材质、色彩描述
- 地面、墙面、天花板等软装细节`

interface OptimizeInput {
  style: string
  furnitureItems: { name: string; hasImage: boolean }[]
  furnitureImageCount: number
  extra?: string
}

export async function optimizePrompt(input: OptimizeInput): Promise<string> {
  const { style, furnitureItems, furnitureImageCount, extra } = input

  let imageIndex = 2
  const itemDescriptions = furnitureItems.map((item) => {
    if (item.hasImage) {
      const desc = `- ${item.name}：图${imageIndex}为参考图（禁止描述其外观，只说"将图${imageIndex}中的${item.name}原样放入房间"）`
      imageIndex++
      return desc
    }
    return `- ${item.name}：无参考图（可以详细描述外观）`
  })

  const userMessage = [
    `装修风格：${style}`,
    `传入图片：图1=房间照片${furnitureImageCount > 0 ? '，' + Array.from({ length: furnitureImageCount }, (_, i) => `图${i + 2}=家具参考图`).join('，') : ''}`,
    `家具清单：\n${itemDescriptions.length > 0 ? itemDescriptions.join('\n') : '未指定具体家具'}`,
    extra ? `用户补充要求：${extra}` : '',
    '请输出优化后的提示词（必须以"基于图1中的真实房间"开头，有参考图的家具不要描述外观）。',
  ].filter(Boolean).join('\n')

  try {
    const response = await getClient().messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    let result = ''
    for (const block of response.content) {
      if (block.type === 'text') {
        result = block.text.trim()
        break
      }
    }

    if (!result) return ''

    if (!result.includes('图1')) {
      result = `基于图1中的真实房间进行${style}风格的室内装修设计。${result}`
    }

    let expectedIndex = 2
    for (const item of furnitureItems) {
      if (item.hasImage && !result.includes(`图${expectedIndex}`)) {
        const insertion = `将图${expectedIndex}中的${item.name}原样放入房间，保持与图${expectedIndex}完全一致的外观、款式、颜色、材质。`
        result = result.replace(
          '专业室内设计效果图',
          `${insertion}专业室内设计效果图`,
        )
      }
      if (item.hasImage) expectedIndex++
    }

    return result
  } catch (error) {
    console.error('Prompt optimization failed:', error)
    return ''
  }
}
