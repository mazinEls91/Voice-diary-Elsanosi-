import { supabase, STORAGE_BUCKET, audioPublicUrl } from '../lib/supabase'
import type { DiaryEntry, EntryCategory } from '../types'

function rowToEntry(row: Record<string, unknown>): DiaryEntry {
  return {
    id: row.id as string,
    title: row.title as string,
    audioBlob: null,
    audioUrl: audioPublicUrl(row.audio_path as string),
    transcript: (row.transcript as string | null) ?? undefined,
    summary: (row.summary as string | null) ?? undefined,
    category: (row.category as EntryCategory | null) ?? undefined,
    durationSeconds: row.duration_seconds as number,
    createdAt: row.created_at as string,
    tags: row.tags ? (row.tags as string).split(',').filter(Boolean) : [],
  }
}

export async function getAllEntries(): Promise<DiaryEntry[]> {
  const { data, error } = await supabase
    .from('diary_entries')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(rowToEntry)
}

export async function getEntry(id: string): Promise<DiaryEntry | undefined> {
  const { data, error } = await supabase
    .from('diary_entries')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return undefined
  return rowToEntry(data as Record<string, unknown>)
}

export async function saveEntry(entry: DiaryEntry): Promise<void> {
  const audioPath = `${entry.id}.webm`

  if (entry.audioBlob) {
    const { error: uploadErr } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(audioPath, entry.audioBlob, {
        contentType: entry.audioBlob.type || 'audio/webm',
        upsert: true,
      })
    if (uploadErr) throw uploadErr
  }

  const { error } = await supabase.from('diary_entries').upsert({
    id: entry.id,
    title: entry.title,
    transcript: entry.transcript ?? null,
    summary: entry.summary ?? null,
    category: entry.category ?? null,
    duration_seconds: entry.durationSeconds,
    tags: entry.tags.join(','),
    audio_path: audioPath,
    created_at: entry.createdAt,
  })
  if (error) throw error
}

export async function deleteEntry(id: string): Promise<void> {
  await supabase.storage.from(STORAGE_BUCKET).remove([`${id}.webm`])
  const { error } = await supabase.from('diary_entries').delete().eq('id', id)
  if (error) throw error
}
