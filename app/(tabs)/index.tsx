import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'
import { useEntriesStore } from '@/store/entries'
import { useAuthStore } from '@/store/auth'
import { saveLocally } from '@/services/storage'
import { transcribeAudio } from '@/services/transcription'
import { syncEntry } from '@/services/sync'
import { useState } from 'react'
import type { DiaryEntry } from '@/types'

export default function RecordScreen() {
  const { state, uri, durationSeconds, start, stop, reset } = useAudioRecorder()
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const { addEntry, setSyncStatus } = useEntriesStore()
  const { session } = useAuthStore()
  const router = useRouter()

  async function handleSave() {
    if (!uri || !session) return
    setSaving(true)
    try {
      const id = crypto.randomUUID()
      const localPath = await saveLocally(uri, id)

      // Transcribe in parallel with saving
      const transcript = await transcribeAudio(localPath).catch(() => undefined)

      const entry: DiaryEntry = {
        id,
        userId: session.user.id,
        title: title.trim() || 'Untitled entry',
        audioPath: localPath,
        transcript,
        durationSeconds,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: [],
      }

      addEntry(entry)
      setSyncStatus(id, 'syncing')
      reset()
      setTitle('')

      // Sync to cloud in background
      syncEntry(entry, session.user.id)
        .then(() => setSyncStatus(id, 'synced'))
        .catch(() => setSyncStatus(id, 'error'))

      router.push(`/entry/${id}`)
    } catch (err: unknown) {
      Alert.alert('Save failed', err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Voice Diary</Text>

      {state === 'idle' && (
        <TouchableOpacity style={styles.recordBtn} onPress={start}>
          <Text style={styles.recordBtnText}>Hold to Record</Text>
        </TouchableOpacity>
      )}

      {state === 'recording' && (
        <TouchableOpacity style={[styles.recordBtn, styles.recording]} onPress={stop}>
          <Text style={styles.recordBtnText}>Stop</Text>
        </TouchableOpacity>
      )}

      {state === 'stopped' && (
        <View style={styles.saveForm}>
          <TextInput
            style={styles.input}
            placeholder="Title this entry…"
            value={title}
            onChangeText={setTitle}
          />
          <Text style={styles.duration}>{durationSeconds}s recorded</Text>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save Entry'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={reset}>
            <Text style={styles.discard}>Discard</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#f9fafb' },
  heading: { fontSize: 24, fontWeight: '700', marginBottom: 48 },
  recordBtn: {
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center',
  },
  recording: { backgroundColor: '#374151' },
  recordBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  saveForm: { width: '100%', gap: 12 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db',
    borderRadius: 8, padding: 12, fontSize: 16,
  },
  duration: { color: '#6b7280', textAlign: 'center' },
  saveBtn: { backgroundColor: '#3b82f6', borderRadius: 8, padding: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  discard: { color: '#6b7280', textAlign: 'center', padding: 8 },
})
