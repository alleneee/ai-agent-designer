export function buildPrompt(
  style: string,
  furnitureDescriptions: string[],
  customPrompt?: string
): string {
  let prompt = `将这个房间装修为${style}风格`

  if (furnitureDescriptions.length > 0) {
    prompt += `，放入${furnitureDescriptions.join('、')}`
  }

  prompt += '，保持房间结构不变，真实感室内摄影效果'

  if (customPrompt) {
    prompt += `。${customPrompt}`
  }

  return prompt
}
