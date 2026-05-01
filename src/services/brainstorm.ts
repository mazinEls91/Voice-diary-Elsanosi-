import Anthropic from '@anthropic-ai/sdk'
import type { BrainstormMessage } from '../types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are a curious, warm podcast co-host helping the user explore their own thoughts.
You have just heard their recorded diary entry (provided as a transcript).
Your role is to:
- Ask one focused follow-up question or offer a fresh perspective per turn
- Help the user dig deeper — challenge assumptions gently, surface patterns, suggest connections
- Keep your responses concise (2-4 sentences) so the conversation stays dynamic
- Never lecture or moralize
- Treat every entry as a safe, confidential space`

/**
 * Send the conversation history to Claude and stream back the AI's next turn.
 * onChunk is called with each streamed text chunk for real-time display.
 */
export async function getNextBrainstormTurn(
  entryTranscript: string,
  history: BrainstormMessage[],
  onChunk: (chunk: string) => void,
): Promise<string> {
  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: `Here is my diary entry transcript:\n\n${entryTranscript}\n\nLet's explore this together.`,
    },
    ...history.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ]

  let fullText = ''

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages,
  })

  for await (const chunk of stream) {
    if (
      chunk.type === 'content_block_delta' &&
      chunk.delta.type === 'text_delta'
    ) {
      onChunk(chunk.delta.text)
      fullText += chunk.delta.text
    }
  }

  return fullText
}
