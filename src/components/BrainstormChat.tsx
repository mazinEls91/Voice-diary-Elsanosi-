import { useState, useRef, useEffect } from 'react'
import { getNextTurn } from '../services/brainstorm'
import { useAudioRecorder } from '../hooks/useAudioRecorder'
import type { DiaryEntry, BrainstormMessage } from '../types'
import styles from './BrainstormChat.module.css'

interface Props {
  entry: DiaryEntry
}

export default function BrainstormChat({ entry }: Props) {
  const apiKey = localStorage.getItem('anthropic_api_key') ?? ''
  const [messages, setMessages] = useState<BrainstormMessage[]>([])
  const [streamingText, setStreamingText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [noKey, setNoKey] = useState(!apiKey)
  const bottomRef = useRef<HTMLDivElement>(null)
  const recorder = useAudioRecorder()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  // Kick off the first AI turn automatically
  useEffect(() => {
    if (!apiKey || messages.length > 0) return
    sendAiTurn([])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function sendAiTurn(history: BrainstormMessage[]) {
    setAiLoading(true)
    setStreamingText('')
    try {
      let full = ''
      await getNextTurn(
        apiKey,
        entry.transcript ?? entry.title,
        history,
        (chunk) => { full += chunk; setStreamingText(full) },
      )
      const aiMsg: BrainstormMessage = {
        id: crypto.randomUUID(),
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

  async function submitUserTurn(content: string) {
    if (!content.trim()) return
    const userMsg: BrainstormMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      createdAt: new Date().toISOString(),
    }
    const next = [...messages, userMsg]
    setMessages(next)
    await sendAiTurn(next)
  }

  async function handleVoice() {
    if (recorder.state === 'idle') { recorder.start(); return }
    if (recorder.state === 'recording') {
      await recorder.stop()
      // Voice-to-text: for now, prompt user to type — transcription comes in a later sprint
      setTextInput('[Voice message recorded — transcription coming soon]')
      recorder.reset()
    }
  }

  if (noKey) {
    return <ApiKeyPrompt onSave={(k) => { localStorage.setItem('anthropic_api_key', k); setNoKey(false) }} />
  }

  return (
    <div className={styles.chat}>
      <div className={styles.header}>
        <span className={styles.title}>Brainstorm</span>
        <span className={styles.subtitle}>AI co-host exploring your entry</span>
      </div>

      <div className={styles.messages}>
        {messages.map((m) => (
          <div key={m.id} className={`${styles.bubble} ${m.role === 'user' ? styles.user : styles.ai}`}>
            {m.content}
          </div>
        ))}
        {streamingText && (
          <div className={`${styles.bubble} ${styles.ai} ${styles.streaming}`}>
            {streamingText}<span className={styles.cursor} />
          </div>
        )}
        {aiLoading && !streamingText && (
          <div className={`${styles.bubble} ${styles.ai}`}>
            <span className={styles.dots}><span /><span /><span /></span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className={styles.inputRow}>
        <input
          className={styles.input}
          placeholder="Reply…"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitUserTurn(textInput); setTextInput('') } }}
          disabled={aiLoading}
        />
        <button
          className={styles.sendBtn}
          onClick={() => { submitUserTurn(textInput); setTextInput('') }}
          disabled={!textInput.trim() || aiLoading}
        >
          <SendIcon />
        </button>
        <button
          className={`${styles.voiceBtn} ${recorder.state === 'recording' ? styles.voiceActive : ''}`}
          onClick={handleVoice}
          aria-label="Voice input"
        >
          <MicIcon />
        </button>
      </div>
    </div>
  )
}

function ApiKeyPrompt({ onSave }: { onSave: (k: string) => void }) {
  const [val, setVal] = useState('')
  return (
    <div className={styles.keyPrompt}>
      <p>Enter your <strong>Anthropic API key</strong> to enable the AI brainstorm feature.<br />
        It is stored only in your browser’s local storage.</p>
      <input
        className={styles.input}
        type="password"
        placeholder="sk-ant-…"
        value={val}
        onChange={(e) => setVal(e.target.value)}
      />
      <button className={styles.sendBtn} style={{ padding: '0.7rem 1.5rem', borderRadius: '10px' }}
        onClick={() => val.trim() && onSave(val.trim())}>
        Save & Start
      </button>
    </div>
  )
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    </svg>
  )
}
