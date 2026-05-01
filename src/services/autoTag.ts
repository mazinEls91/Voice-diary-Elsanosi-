import Anthropic from '@anthropic-ai/sdk'
import type { EntryCategory } from '../types'

export interface AutoTagResult {
  category: EntryCategory
  summary: string
  suggestedTitle: string
}

export async function autoTagEntry(
  apiKey: string,
  content: string,
): Promise<AutoTagResult> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 150,
    messages: [{
      role: 'user',
      content: `Analyse this voice diary entry. Return ONLY valid JSON, no explanation.

Entry: "${content.slice(0, 600)}"

JSON schema:
{
  "category": "idea|reminder|reflection|rant|plan|note",
  "summary": "one sentence, max 20 words",
  "suggestedTitle": "3-5 words, title case"
}`,
    }],
  })

  const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '{}'
  try {
    return JSON.parse(raw) as AutoTagResult
  } catch {
    return { category: 'note', summary: '', suggestedTitle: '' }
  }
}
