import { useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useEntriesStore } from '@/store/entries'
import { useAuthStore } from '@/store/auth'
import { fetchRemoteEntries } from '@/services/sync'
import type { DiaryEntry } from '@/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0')
  const sec = (s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

export default function LibraryScreen() {
  const { entries, setEntries } = useEntriesStore()
  const { session } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!session) return
    fetchRemoteEntries(session.user.id)
      .then((remote) => {
        if (remote) {
          const mapped: DiaryEntry[] = remote.map((r) => ({
            id: r.id,
            userId: r.user_id,
            title: r.title,
            audioPath: r.audio_path,
            transcript: r.transcript ?? undefined,
            durationSeconds: r.duration_seconds,
            syncedAt: r.synced_at ?? undefined,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
            tags: [],
          }))
          setEntries(mapped)
        }
      })
      .catch(console.error)
  }, [session])

  function renderEntry({ item }: { item: DiaryEntry }) {
    return (
      <TouchableOpacity style={styles.card} onPress={() => router.push(`/entry/${item.id}`)}>
        <View style={styles.cardMeta}>
          <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
          <Text style={styles.dur}>{formatDuration(item.durationSeconds)}</Text>
        </View>
        <Text style={styles.title}>{item.title}</Text>
        {item.transcript && (
          <Text style={styles.transcript} numberOfLines={2}>{item.transcript}</Text>
        )}
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Library</Text>
      <FlatList
        data={entries}
        keyExtractor={(e) => e.id}
        renderItem={renderEntry}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No entries yet. Hit Record to start.</Text>}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  heading: { fontSize: 22, fontWeight: '700', padding: 20, paddingBottom: 8 },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  date: { fontSize: 12, color: '#6b7280' },
  dur: { fontSize: 12, color: '#6b7280' },
  title: { fontWeight: '600', fontSize: 15, marginBottom: 4 },
  transcript: { fontSize: 13, color: '#6b7280' },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 60 },
})
