export interface DiaryEntry {
  id: string
  title: string
  audioBlob: Blob
  audioUrl: string
  durationSeconds: number
  createdAt: Date
  tags: string[]
}

export type RecorderState = 'idle' | 'recording' | 'stopped'
