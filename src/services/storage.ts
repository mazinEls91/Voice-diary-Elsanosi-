import * as FileSystem from 'expo-file-system'
import { supabase } from './supabase'

const AUDIO_DIR = FileSystem.documentDirectory + 'audio/'

export async function ensureAudioDir() {
  const info = await FileSystem.getInfoAsync(AUDIO_DIR)
  if (!info.exists) await FileSystem.makeDirectoryAsync(AUDIO_DIR, { intermediates: true })
}

/** Save a recorded audio file locally and return its local URI. */
export async function saveLocally(tempUri: string, entryId: string): Promise<string> {
  await ensureAudioDir()
  const dest = AUDIO_DIR + `${entryId}.m4a`
  await FileSystem.copyAsync({ from: tempUri, to: dest })
  return dest
}

/** Upload local audio file to Supabase Storage and return the storage path. */
export async function uploadToCloud(localUri: string, userId: string, entryId: string): Promise<string> {
  const path = `${userId}/${entryId}.m4a`
  const fileContent = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  })

  const { error } = await supabase.storage
    .from('audio-entries')
    .upload(path, decode(fileContent), { contentType: 'audio/m4a', upsert: true })

  if (error) throw error
  return path
}

/** Get a short-lived signed URL for playback. */
export async function getSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('audio-entries')
    .createSignedUrl(storagePath, 3600) // 1 hour
  if (error) throw error
  return data.signedUrl
}

function decode(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}
