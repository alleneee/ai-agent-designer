import { NextResponse } from 'next/server'
import { callSeedream } from '@/lib/seedream'
import { buildPrompt } from '@/lib/promptBuilder'
import type { GenerateRequest } from '@/types'

export async function POST(request: Request) {
  try {
    const body: GenerateRequest = await request.json()
    const { roomImage, style, furniture, prompt: customPrompt } = body

    if (!roomImage || !style) {
      return NextResponse.json(
        { error: 'roomImage and style are required' },
        { status: 400 }
      )
    }

    const prompt = buildPrompt(style, furniture, customPrompt)

    const result = await callSeedream({
      prompt,
      images: [roomImage],
      size: '2K',
      max_images: 4,
      watermark: false,
    })

    return NextResponse.json({ images: result.images })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
