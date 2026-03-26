interface PromptOptions {
  style: string
  furnitureDescriptions: string[]
  hasRoomImage: boolean
  furnitureImageCount: number
  customPrompt?: string
}

export function buildPrompt(options: PromptOptions): string {
  const { style, furnitureDescriptions, hasRoomImage, furnitureImageCount, customPrompt } = options

  const parts: string[] = []

  if (hasRoomImage && furnitureImageCount > 0) {
    parts.push(`基于图1中的真实房间进行室内装修设计`)
    parts.push(`保持图1中房间的墙壁、地板、天花板、门窗、灯具等建筑结构和空间布局完全不变`)

    const furnitureRefs = Array.from({ length: furnitureImageCount }, (_, i) => `图${i + 2}`)
    parts.push(`将${furnitureRefs.join('、')}中的家具放入房间中，家具的款式、颜色、材质、造型必须与参考图中一致`)

    if (furnitureDescriptions.length > 0) {
      parts.push(`同时添加以下家具：${furnitureDescriptions.join('、')}`)
    }

    parts.push(`整体装修风格为${style}，家具摆放位置合理，空间布局协调`)
  } else if (hasRoomImage) {
    parts.push(`基于图1中的真实房间进行${style}风格的室内装修设计`)
    parts.push(`保持图1中房间的墙壁、地板、天花板、门窗等建筑结构完全不变`)

    if (furnitureDescriptions.length > 0) {
      parts.push(`在房间中添加以下家具：${furnitureDescriptions.join('、')}`)
    } else {
      parts.push(`在房间中添加${style}风格的家具和装饰`)
    }

    parts.push(`家具摆放位置合理，空间布局协调`)
  } else {
    parts.push(`生成一间${style}风格的室内装修效果图`)
    if (furnitureDescriptions.length > 0) {
      parts.push(`房间中包含以下家具：${furnitureDescriptions.join('、')}`)
    }
  }

  parts.push('专业室内设计效果图，高清写实风格，自然光照，8K质感')

  if (customPrompt) {
    parts.push(customPrompt)
  }

  return parts.join('。')
}
