interface SeedreamRequest {
  prompt: string
  image?: string[]
  size?: string
  response_format?: 'url' | 'b64_json'
  output_format?: 'png' | 'jpeg'
  watermark?: boolean
  n?: number
}

interface SeedreamDataItem {
  url?: string
  b64_json?: string
  size?: string
}

interface SeedreamApiResponse {
  model: string
  created: number
  data: SeedreamDataItem[]
  usage: {
    generated_images: number
    output_tokens: number
    total_tokens: number
  }
}

export async function callSeedream(
  params: SeedreamRequest
): Promise<{ images: string[] }> {
  const apiKey = process.env.SEEDREAM_API_KEY
  const apiUrl = process.env.SEEDREAM_API_URL
  const model = process.env.SEEDREAM_MODEL

  if (!apiKey || !apiUrl || !model) {
    throw new Error('Seedream API configuration missing')
  }

  const body: Record<string, unknown> = {
    model,
    prompt: params.prompt,
    size: params.size ?? '2K',
    response_format: params.response_format ?? 'url',
    output_format: params.output_format ?? 'jpeg',
    watermark: params.watermark ?? false,
    n: params.n ?? 1,
  }

  if (params.image && params.image.length > 0) {
    body.image = params.image
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Seedream API error: ${response.status} - ${error}`)
  }

  const result: SeedreamApiResponse = await response.json()

  const images = result.data
    .map((item) => item.url ?? item.b64_json ?? '')
    .filter(Boolean)

  if (images.length === 0) {
    throw new Error('Seedream returned no images')
  }

  return { images }
}
