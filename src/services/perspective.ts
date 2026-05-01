import Anthropic from '@anthropic-ai/sdk'
import type { BrainstormMessage, PerspectivePersonality, PerspectiveIntensity } from '../types'

export interface PersonalityDef {
  id: PerspectivePersonality
  name: string
  tagline: string
  color: string
  system: string
}

export const PERSONALITIES: PersonalityDef[] = [
  {
    id: 'listener',
    name: 'Listener',
    tagline: 'I just want to be heard',
    color: '#6366f1',
    system: `You are a compassionate active listener. Make the user feel deeply heard and understood. Reflect back what they say in your own words, validate emotions without judgment, and ask one gentle clarifying question to help them go deeper. Never give advice unless explicitly asked. No silver linings, no solutions — just presence and understanding.`,
  },
  {
    id: 'comfort',
    name: 'Comfort',
    tagline: 'I need encouragement',
    color: '#ec4899',
    system: `You are a warm, caring companion — the best version of a close friend. Acknowledge what the user is experiencing. Find genuine positives without dismissing real struggles. Offer gentle perspective and remind them of their strength. Be emotionally warm and genuinely supportive.`,
  },
  {
    id: 'reality-check',
    name: 'Reality Check',
    tagline: 'Be honest with me',
    color: '#f59e0b',
    system: `You are an honest, balanced friend who cares enough to tell the truth. First acknowledge the emotion. Then gently but clearly point out where thinking might be distorted, one-sided, catastrophizing, or missing important context. Be kind but unflinching. Help the user see the full picture.`,
  },
  {
    id: 'strategist',
    name: 'Strategist',
    tagline: 'Help me take action',
    color: '#10b981',
    system: `You are a sharp, focused strategist. Transform chaos into clarity and feeling into action. Extract the core goal, identify the real obstacle, suggest the single most important next step. Be direct and efficient. Ask: what do you actually want? What is in your way? What will you do about it?`,
  },
  {
    id: 'challenger',
    name: 'Challenger',
    tagline: 'Push back on me',
    color: '#ef4444',
    system: `You are a rigorous, respectful devil's advocate. Stress-test thinking, not feelings. Challenge assumptions, poke holes in reasoning, ask the questions the user has not asked themselves. Be intellectually demanding but never cruel. Push: why do you believe that? What is the evidence? What if you are wrong?`,
  },
]

const INTENSITY_SUFFIX: Record<PerspectiveIntensity, string> = {
  soft: '\n\nTone: Lead every message with empathy. Cushion all hard truths in warmth. Prioritise emotional safety.',
  direct: '\n\nTone: Be clear and direct without unnecessary padding, but remain considerate.',
  tough: '\n\nTone: Be blunt and unfiltered. No sugarcoating. Push hard. The user has explicitly requested this.',
}

const SAFETY_FOOTER = `\n\nSafety: You are not a therapist or mental health professional. If the user expresses thoughts of self-harm or a mental health crisis, pause and compassionately suggest they speak to a qualified professional or crisis line. Keep each reply to 2-4 sentences to maintain conversational rhythm.`

export async function getPerspectiveTurn(
  apiKey: string,
  personality: PerspectivePersonality,
  intensity: PerspectiveIntensity,
  entryContext: string,
  history: BrainstormMessage[],
  onChunk: (text: string) => void,
): Promise<string> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
  const def = PERSONALITIES.find((p) => p.id === personality)!
  const system = def.system + INTENSITY_SUFFIX[intensity] + SAFETY_FOOTER

  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: `My diary entry:\n\n${entryContext}\n\nLet's talk about this.`,
    },
    ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  ]

  let full = ''
  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system,
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
