import { useState, useRef } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useEntriesStore } from '@/store/entries'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'
import { transcribeAudio } from '@/services/transcription'
import { getNextBrainstormTurn } from '@/services/brainstorm'
import type { BrainstormMessage } from '@/types'

export default function BrainstormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const entry = useEntriesStore((s) => s.entries.find((e) => e.id === id))
  const [messages, setMessages] = useState<BrainstormMessage[]>([])
  const [streamingText, setStreamingText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [textInput, setTextInput] = useState('')
  const { state: recState, uri: recUri, start, stop, reset } = useAudioRecorder()
  const listRef = useRef<FlatList>(null)

  if (!entry) return <View style={s.container}><Text>Entry not found</Text></View>

  async function sendTurn(content: string) {
    const userMsg: BrainstormMessage = {
      id: crypto.randomUUID(),
      sessionId: entry!.id,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setAiLoading(true)
    setStreamingText('')

    try {
      let full = ''
      await getNextBrainstormTurn(
        entry!.transcript ?? entry!.title,
        updated,
        (chunk) => {
          full += chunk
          setStreamingText(full)
        }
      )

      const aiMsg: BrainstormMessage = {
        id: crypto.randomUUID(),
        sessionId: entry!.id,
        role: 'assistant',
        content: full,
        createdAt: new Date().toISOString(),
      }
      setMessages((m) => [...m, aiMsg])
      setStreamingText('')
    } finally {
      setAiLoading(false)
    }
  }

  async function handleVoiceSend() {
    if (recState === 'idle') { start(); return }
    await stop()
    if (!recUri) return
    const transcript = await transcribeAudio(recUri)
    reset()
    sendTurn(transcript)
  }

  async function handleTextSend() {
    if (!textInput.trim()) return
    const text = textInput.trim()
    setTextInput('')
    sendTurn(text)
  }

  function renderMessage({ item }: { item: BrainstormMessage }) {
    const isUser = item.role === 'user'
    return (
      <View style={[s.bubble, isUser ? s.userBubble : s.aiBubble]}>
        <Text style={[s.bubbleText, isUser ? s.userText : s.aiText]}>{item.content}</Text>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={s.heading}>Brainstorm</Text>
      <Text style={s.subheading}>{entry.title}</Text>

      {messages.length === 0 && !aiLoading && (
        <Text style={s.hint}>Start the conversation — type or record your first thought.</Text>
      )}

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={renderMessage}
        contentContainerStyle={s.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />

      {streamingText !== '' && (
        <View style={[s.bubble, s.aiBubble, s.streaming]}>
          <Text style={s.aiText}>{streamingText}</Text>
        </View>
      )}

      {aiLoading && streamingText === '' && <ActivityIndicator style={s.spinner} />}

      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          placeholder="Type a reply…"
          value={textInput}
          onChangeText={setTextInput}
          multiline
        />
        <TouchableOpacity style={s.sendBtn} onPress={handleTextSend}>
          <Text style={s.sendBtnText}>Send</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.voiceBtn, recState === 'recording' && s.voiceBtnActive]}
          onPress={handleVoiceSend}
        >
          <Text style={s.voiceBtnText}>{recState === 'recording' ? 'Stop' : 'Mic'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  heading: { fontSize: 20, fontWeight: '700', padding: 16, paddingBottom: 2 },
  subheading: { fontSize: 13, color: '#6b7280', paddingHorizontal: 16, marginBottom: 8 },
  hint: { textAlign: 'center', color: '#9ca3af', padding: 40 },
  list: { padding: 16, gap: 12 },
  bubble: { maxWidth: '80%', borderRadius: 14, padding: 12 },
  userBubble: { backgroundColor: '#3b82f6', alignSelf: 'flex-end' },
  aiBubble: { backgroundColor: '#fff', alignSelf: 'flex-start', borderWidth: 1, borderColor: '#e5e7eb' },
  streaming: { margin: 16, marginTop: 0 },
  userText: { color: '#fff' },
  aiText: { color: '#111827' },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  spinner: { padding: 12 },
  inputRow: { flexDirection: 'row', padding: 12, gap: 8, borderTopWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff' },
  input: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 8, padding: 10, fontSize: 15, maxHeight: 100 },
  sendBtn: { backgroundColor: '#3b82f6', borderRadius: 8, padding: 10, justifyContent: 'center' },
  sendBtnText: { color: '#fff', fontWeight: '600' },
  voiceBtn: { backgroundColor: '#7c3aed', borderRadius: 8, padding: 10, justifyContent: 'center' },
  voiceBtnActive: { backgroundColor: '#ef4444' },
  voiceBtnText: { color: '#fff', fontWeight: '600' },
})
