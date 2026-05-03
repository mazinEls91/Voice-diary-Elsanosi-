import { supabase } from '../lib/supabase'
import type { DiaryEntry, EntryCategory } from '../types'

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function base64ToBlob(b64: string): Blob {
  const bytes = atob(b64)
  const arr = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  return new Blob([arr], { type: 'audio/webm' })
}

function rowToEntry(row: Record<string, unknown>, withAudio: boolean): DiaryEntry {
  return {
    id: row.id as string,
    title: row.title as string,
    audioBlob: withAudio && row.audio_data
      ? base64ToBlob(row.audio_data as string)
      : null,
    transcript: (row.transcript as string | null) ?? undefined,
    summary: (row.summary as string | null) ?? undefined,
    category: (row.category as EntryCategory | null) ?? undefined,
    durationSeconds: row.duration_seconds as number,
    createdAt: row.created_at as string,
    tags: Array.isArray(row.tags)
      ? (row.tags as string[])
      : row.tags ? String(row.tags).split(',').filter(Boolean) : [],
  }
}

// List view: skip audio_data to keep the response small
export async function getAllEntries(): Promise<DiaryEntry[]> {
  const { data, error } = await supabase
    .from('diary_entries')
    .select('id, title, transcript, summary, category, duration_seconds, tags, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(row => rowToEntry(row as Record<string, unknown>, false))
}

// Entry view: fetch full row including audio_data
export async function getEntry(id: string): Promise<DiaryEntry | undefined> {
  const { data, error } = await supabase
    .from('diary_entries')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return undefined
  return rowToEntry(data as Record<string, unknown>, true)
}

export async function saveEntry(entry: DiaryEntry): Promise<void> {
  const row: Record<string, unknown> = {
    id: entry.id,
    title: entry.title,
    transcript: entry.transcript ?? null,
    summary: entry.summary ?? null,
    category: entry.category ?? null,
    duration_seconds: entry.durationSeconds,
    tags: entry.tags,
    audio_path: `${entry.id}.webm`,
    created_at: entry.createdAt,
  }

  if (entry.audioBlob) {
    row.audio_data = await blobToBase64(entry.audioBlob)
  }

  const { error } = await supabase.from('diary_entries').upsert(row)
  if (error) throw error
}

export async function deleteEntry(id: string): Promise<void> {
  const { error } = await supabase.from('diary_entries').delete().eq('id', id)
  if (error) throw error
}
