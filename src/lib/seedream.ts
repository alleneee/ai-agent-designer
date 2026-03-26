interface SeedreamRequest {
  prompt: string
  images?: string[]
  size?: string
  max_images?: number
  watermark?: boolean
}

interface SeedreamResponse {
  images: string[]
}

export async function callSeedream(
  params: SeedreamRequest
): Promise<SeedreamResponse> {
  const apiKey = process.env.SEEDREAM_API_KEY
  const apiUrl = process.env.SEEDREAM_API_URL

  if (!apiKey || !apiUrl) {
    throw new Error('Seedream API configuration missing')
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      prompt: params.prompt,
      images: params.images,
      size: params.size ?? '2K',
      max_images: params.max_images ?? 4,
      watermark: params.watermark ?? false,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Seedream API error: ${response.status} - ${error}`)
  }

  return response.json()
}
