import type { DiaryEntry } from '../types'

interface StoredEntry extends Omit<DiaryEntry, 'audioBlob'> {
  audiob64: string
  audioType: string
}

const LS_KEY = 'voice-diary-v1'

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function base64ToBlob(b64: string, type: string): Blob {
  const bytes = atob(b64)
  const arr = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  return new Blob([arr], { type })
}

function loadAll(): StoredEntry[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveAll(entries: StoredEntry[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(entries))
}

export async function getAllEntries(): Promise<DiaryEntry[]> {
  return loadAll()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(({ audiob64, audioType, ...rest }) => ({
      ...rest,
      audioBlob: base64ToBlob(audiob64, audioType),
    }))
}

export async function getEntry(id: string): Promise<DiaryEntry | undefined> {
  const stored = loadAll().find(e => e.id === id)
  if (!stored) return undefined
  const { audiob64, audioType, ...rest } = stored
  return { ...rest, audioBlob: base64ToBlob(audiob64, audioType) }
}

export async function saveEntry(entry: DiaryEntry): Promise<void> {
  const all = loadAll()
  const b64 = await blobToBase64(entry.audioBlob)
  const { audioBlob, ...rest } = entry
  const stored: StoredEntry = {
    ...rest,
    audiob64: b64,
    audioType: audioBlob.type || 'audio/webm',
  }
  const idx = all.findIndex(e => e.id === entry.id)
  if (idx !== -1) {
    all[idx] = stored
  } else {
    all.push(stored)
  }
  saveAll(all)
}

export async function deleteEntry(id: string): Promise<void> {
  saveAll(loadAll().filter(e => e.id !== id))
}
