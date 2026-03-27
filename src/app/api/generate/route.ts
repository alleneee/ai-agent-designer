import { NextRequest, NextResponse } from 'next/server'
import { optimizePrompt } from '@/lib/promptAgent'

export const maxDuration = 120

const SEEDREAM_API_KEY = process.env.SEEDREAM_API_KEY || ''
const SEEDREAM_MODEL = process.env.SEEDREAM_MODEL || 'doubao-seedream-5-0-260128'
const SEEDREAM_BASE_URL =
  process.env.SEEDREAM_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3'

interface FurnitureItem {
  name: string
  image?: string
}


function buildFallbackPrompt(
  style: string,
  furnitureItems: FurnitureItem[],
  extra?: string,
): string {
  const parts: string[] = []

  parts.push(`基于图1中的真实房间进行${style}风格的室内装修设计`)
  parts.push(
    '严格保持图1中房间的墙壁、地板、天花板、门窗、灯具等全部建筑结构和空间布局完全不变，' +
    '不得改变房间形状、面积、层高、窗户位置和大小，仅对室内软装和家具进行设计',
  )

  let imageIndex = 2
  for (const item of furnitureItems) {
    if (item.image) {
      parts.push(`图${imageIndex}是${item.name}的参考图片，放入房间时款式、颜色、材质必须与参考图一致`)
      imageIndex++
    } else {
      parts.push(`添加${style}风格的${item.name}`)
    }
  }

  if (furnitureItems.length === 0) {
    parts.push(`在房间中添加${style}风格的家具和装饰`)
  }

  parts.push('家具摆放位置合理，空间布局协调')
  if (extra) parts.push(extra)
  parts.push('专业室内设计效果图，高清写实风格，自然光照，8K质感')

  return parts.join('。')
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { room_image, style, furniture_items = [], extra } = body as {
    room_image: string
    style: string
    furniture_items: FurnitureItem[]
    extra?: string
  }

  if (!style) {
    return NextResponse.json({ detail: 'style is required' }, { status: 400 })
  }
  if (!room_image) {
    return NextResponse.json({ detail: 'room_image is required' }, { status: 400 })
  }

  const referenceImages: string[] = [room_image]
  for (const item of furniture_items) {
    if (item.image) referenceImages.push(item.image)
  }

  const furnitureImageCount = furniture_items.filter((i) => i.image).length

  const optimized = await optimizePrompt({
    style,
    furnitureItems: furniture_items.map((i) => ({ name: i.name, hasImage: !!i.image })),
    furnitureImageCount,
    extra,
  })

  const prompt = optimized || buildFallbackPrompt(style, furniture_items, extra)

  try {
    const response = await fetch(`${SEEDREAM_BASE_URL}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SEEDREAM_API_KEY}`,
      },
      body: JSON.stringify({
        model: SEEDREAM_MODEL,
        prompt,
        size: '2K',
        response_format: 'url',
        n: 1,
        output_format: 'jpeg',
        watermark: false,
        image: referenceImages,
      }),
      signal: AbortSignal.timeout(120_000),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { detail: `Seedream API error: ${response.status} ${errorText}` },
        { status: 502 },
      )
    }

    const data = await response.json()
    const images = (data.data || [])
      .map((item: { url?: string; b64_json?: string }) => item.url || item.b64_json || '')
      .filter(Boolean)

    if (images.length === 0) {
      return NextResponse.json({ detail: 'No images generated' }, { status: 500 })
    }

    return NextResponse.json({ images, prompt })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Generation failed'
    return NextResponse.json({ detail: message }, { status: 500 })
  }
}
