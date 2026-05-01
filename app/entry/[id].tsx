import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEntriesStore } from '@/store/entries'
import { useAudioPlayer } from '@/hooks/useAudioPlayer'
import { getSignedUrl } from '@/services/storage'
import { supabase } from '@/services/supabase'

export default function EntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const entry = useEntriesStore((s) => s.entries.find((e) => e.id === id))
  const router = useRouter()
  const [playUri, setPlayUri] = useState<string | null>(null)

  useEffect(() => {
    if (!entry) return
    // Prefer local file; fall back to signed cloud URL
    if (entry.audioPath.startsWith('file://')) {
      setPlayUri(entry.audioPath)
    } else {
      getSignedUrl(entry.audioPath).then(setPlayUri).catch(console.error)
    }
  }, [entry])

  const player = useAudioPlayer(playUri ?? '')

  async function handleShare() {
    const username = await promptUsername()
    if (!username) return

    const { data: target } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single()

    if (!target) { Alert.alert('User not found'); return }

    const { error } = await supabase.from('shared_entries').insert({
      entry_id: id,
      shared_by: entry?.userId,
      shared_with: target.id,
    })

    if (error) Alert.alert('Share failed', error.message)
    else Alert.alert('Shared', `Entry shared with ${username}`)
  }

  if (!entry) return <View style={styles.container}><Text>Entry not found</Text></View>

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{entry.title}</Text>
      <Text style={styles.date}>{new Date(entry.createdAt).toLocaleString()}</Text>

      {playUri && (
        <TouchableOpacity
          style={styles.playBtn}
          onPress={player.isPlaying ? player.pause : player.play}
        >
          <Text style={styles.playBtnText}>{player.isPlaying ? 'Pause' : 'Play'}</Text>
        </TouchableOpacity>
      )}

      {entry.transcript && (
        <View style={styles.transcript}>
          <Text style={styles.transcriptLabel}>Transcript</Text>
          <Text style={styles.transcriptText}>{entry.transcript}</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.brainstormBtn}
        onPress={() => router.push(`/entry/${id}/brainstorm`)}
      >
        <Text style={styles.brainstormBtnText}>Brainstorm with AI</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
        <Text style={styles.shareBtnText}>Share Entry</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

function promptUsername(): Promise<string | null> {
  return new Promise((resolve) => {
    Alert.prompt(
      'Share with',
      'Enter the username of the person to share with',
      (text) => resolve(text ?? null),
      'plain-text'
    )
  })
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 20, gap: 16 },
  back: { marginBottom: 8 },
  backText: { color: '#3b82f6', fontSize: 16 },
  title: { fontSize: 22, fontWeight: '700' },
  date: { color: '#6b7280', fontSize: 13 },
  playBtn: { backgroundColor: '#111827', borderRadius: 8, padding: 14, alignItems: 'center' },
  playBtnText: { color: '#fff', fontWeight: '600' },
  transcript: { backgroundColor: '#fff', borderRadius: 10, padding: 16 },
  transcriptLabel: { fontWeight: '600', marginBottom: 8, color: '#374151' },
  transcriptText: { color: '#4b5563', lineHeight: 22 },
  brainstormBtn: { backgroundColor: '#7c3aed', borderRadius: 8, padding: 14, alignItems: 'center' },
  brainstormBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  shareBtn: { backgroundColor: '#f3f4f6', borderRadius: 8, padding: 14, alignItems: 'center' },
  shareBtnText: { color: '#374151', fontWeight: '600' },
})
