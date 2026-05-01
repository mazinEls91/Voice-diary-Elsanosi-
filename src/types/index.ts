export interface DiaryEntry {
  id: string
  title: string
  audioBlob: Blob
  transcript?: string
  durationSeconds: number
  createdAt: string
  tags: string[]
}

export type RecorderState = 'idle' | 'recording' | 'stopped'

export type AppView = { screen: 'home' } | { screen: 'entry'; entryId: string }

export interface BrainstormMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}
