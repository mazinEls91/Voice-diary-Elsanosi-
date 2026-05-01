import { supabase } from './supabase'
import { uploadToCloud } from './storage'
import type { DiaryEntry } from '../types'

/**
 * Syncs a locally saved entry up to Supabase.
 * Called in the background after save, or when coming back online.
 */
export async function syncEntry(entry: DiaryEntry, userId: string): Promise<void> {
  // 1. Upload audio if not already in cloud
  const storagePath = await uploadToCloud(entry.audioPath, userId, entry.id)

  // 2. Upsert metadata to DB
  const { error } = await supabase.from('entries').upsert({
    id: entry.id,
    user_id: userId,
    title: entry.title,
    audio_path: storagePath,
    transcript: entry.transcript,
    duration_seconds: entry.durationSeconds,
    synced_at: new Date().toISOString(),
    created_at: entry.createdAt,
    updated_at: new Date().toISOString(),
  })

  if (error) throw error
}

/**
 * Fetches all entries for the current user from Supabase.
 * Used on first load or to merge remote changes.
 */
export async function fetchRemoteEntries(userId: string) {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}
