import { NextResponse } from 'next/server'
import { callSeedream } from '@/lib/seedream'
import { buildPrompt } from '@/lib/promptBuilder'
import type { GenerateRequest } from '@/types'

export const maxDuration = 120

export async function POST(request: Request) {
  try {
    const body: GenerateRequest = await request.json()
    const { roomImage, style, furniture, furnitureImages, prompt: customPrompt } = body

    if (!style) {
      return NextResponse.json(
        { error: 'style is required' },
        { status: 400 }
      )
    }

    const referenceImages: string[] = []
    if (roomImage) {
      referenceImages.push(roomImage)
    }
    if (furnitureImages) {
      referenceImages.push(...furnitureImages)
    }

    const prompt = buildPrompt({
      style,
      furnitureDescriptions: furniture || [],
      hasRoomImage: !!roomImage,
      furnitureImageCount: furnitureImages?.length ?? 0,
      customPrompt,
    })

    const result = await callSeedream({
      prompt,
      image: referenceImages.length > 0 ? referenceImages : undefined,
      size: '2K',
      output_format: 'jpeg',
      watermark: false,
      n: 1,
    })

    return NextResponse.json({ images: result.images })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
