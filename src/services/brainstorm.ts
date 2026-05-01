import Anthropic from '@anthropic-ai/sdk'
import type { BrainstormMessage } from '../types'

const SYSTEM = `You are a warm, curious podcast co-host helping the user explore their own thoughts.
You've just heard their diary entry (provided as a transcript or title).
Your job:
- Ask one focused question or offer one fresh angle per turn
- Help the user dig deeper — challenge assumptions gently, surface patterns
- Keep each reply to 2-4 sentences so the conversation stays alive
- Never lecture. This is a safe, private space.`

export async function getNextTurn(
  apiKey: string,
  entryContext: string,
  history: BrainstormMessage[],
  onChunk: (text: string) => void,
): Promise<string> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: `My diary entry:\n\n${entryContext}\n\nLet's explore this.`,
    },
    ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  ]

  let full = ''
  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: SYSTEM,
    messages,
  })

  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      onChunk(chunk.delta.text)
      full += chunk.delta.text
    }
  }

  return full
}
