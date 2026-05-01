export interface Profile {
  id: string
  username: string
  avatarUrl: string | null
  createdAt: string
}

export interface DiaryEntry {
  id: string
  userId: string
  title: string
  audioPath: string       // local file URI or Supabase storage path
  audioUrl?: string       // signed playback URL (hydrated at runtime)
  transcript?: string
  durationSeconds: number
  syncedAt?: string
  createdAt: string
  updatedAt: string
  tags: string[]
}

export interface BrainstormSession {
  id: string
  entryId: string
  userId: string
  title: string
  messages: BrainstormMessage[]
  createdAt: string
}

export interface BrainstormMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  audioPath?: string      // set for user voice turns
  createdAt: string
}

export interface SharedEntry {
  id: string
  entryId: string
  sharedBy: string
  sharedWith: string
  canComment: boolean
  createdAt: string
}

export type RecorderState = 'idle' | 'recording' | 'stopped'

export type SyncStatus = 'local_only' | 'syncing' | 'synced' | 'error'
