import OpenAI from 'openai'

let client: OpenAI | null = null

export function getOpenAIClient(): OpenAI | null {
  const key = process.env.READYBOT_LLM_API_KEY || process.env.OPENAI_API_KEY
  if (!key?.trim()) return null
  if (!client) client = new OpenAI({ apiKey: key })
  return client
}

export function getReadyBotModel(): string {
  return process.env.READYBOT_LLM_MODEL || 'gpt-4o-mini'
}
