export interface DiaryEntry {
  id: string
  title: string
  audioBlob: Blob
  transcript?: string
  summary?: string
  category?: EntryCategory
  durationSeconds: number
  createdAt: string
  tags: string[]
}

export type EntryCategory = 'idea' | 'reminder' | 'reflection' | 'rant' | 'plan' | 'note'

export type RecorderState = 'idle' | 'recording' | 'stopped'

export type AppView = { screen: 'home' } | { screen: 'entry'; entryId: string }

export interface BrainstormMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export type PerspectivePersonality = 'listener' | 'comfort' | 'reality-check' | 'strategist' | 'challenger'

export type PerspectiveIntensity = 'soft' | 'direct' | 'tough'
