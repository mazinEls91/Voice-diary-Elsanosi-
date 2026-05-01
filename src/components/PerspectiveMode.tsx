import { useState, useRef, useEffect } from 'react'
import { getPerspectiveTurn, PERSONALITIES } from '../services/perspective'
import { useAudioRecorder } from '../hooks/useAudioRecorder'
import type { DiaryEntry, BrainstormMessage, PerspectivePersonality, PerspectiveIntensity } from '../types'
import styles from './PerspectiveMode.module.css'

interface Props {
  entry: DiaryEntry
}

export default function PerspectiveMode({ entry }: Props) {
  const apiKey = localStorage.getItem('anthropic_api_key') ?? ''
  const [personality, setPersonality] = useState<PerspectivePersonality>('listener')
  const [intensity, setIntensity] = useState<PerspectiveIntensity>('direct')
  const [messages, setMessages] = useState<BrainstormMessage[]>([])
  const [started, setStarted] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [noKey, setNoKey] = useState(!apiKey)
  const bottomRef = useRef<HTMLDivElement>(null)
  const recorder = useAudioRecorder()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  async function sendAiTurn(history: BrainstormMessage[]) {
    setAiLoading(true)
    setStreamingText('')
    const key = localStorage.getItem('anthropic_api_key') ?? ''
    try {
      let full = ''
      await getPerspectiveTurn(
        key, personality, intensity,
        entry.transcript ?? entry.summary ?? entry.title,
        history,
        (chunk) => { full += chunk; setStreamingText(full) },
      )
      const aiMsg: BrainstormMessage = {
        id: crypto.randomUUID(), role: 'assistant',
        content: full, createdAt: new Date().toISOString(),
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
      id: crypto.randomUUID(), role: 'user',
      content: content.trim(), createdAt: new Date().toISOString(),
    }
    const next = [...messages, userMsg]
    setMessages(next)
    await sendAiTurn(next)
  }

  async function handleVoiceTap() {
    if (recorder.state === 'idle') { recorder.start(); return }
    if (recorder.state === 'recording') {
      await recorder.stop()
      setTextInput('[Voice note — transcription coming in next sprint]')
      recorder.reset()
    }
  }

  if (noKey) {
    return (
      <div className={styles.keyPrompt}>
        <p>Add your <strong>Anthropic API key</strong> in Settings to unlock Perspective Mode.</p>
        <input
          className={styles.keyInput}
          type="password"
          placeholder="sk-ant-…"
          onBlur={(e) => {
            if (e.target.value.trim()) {
              localStorage.setItem('anthropic_api_key', e.target.value.trim())
              setNoKey(false)
            }
          }}
        />
      </div>
    )
  }

  const currentDef = PERSONALITIES.find((p) => p.id === personality)!

  // --- Setup screen ---
  if (!started) {
    return (
      <div className={styles.setup}>
        <div className={styles.setupHeader}>
          <span className={styles.setupTitle}>Perspective Mode</span>
          <span className={styles.setupSub}>How do you want to explore this entry?</span>
        </div>

        <div className={styles.personalities}>
          {PERSONALITIES.map((p) => (
            <button
              key={p.id}
              className={`${styles.pCard} ${personality === p.id ? styles.pSelected : ''}`}
              style={{ '--p-color': p.color } as React.CSSProperties}
              onClick={() => setPersonality(p.id)}
            >
              <span className={styles.pName}>{p.name}</span>
              <span className={styles.pTagline}>{p.tagline}</span>
            </button>
          ))}
        </div>

        <div className={styles.intensityRow}>
          <span className={styles.intensityLabel}>Intensity</span>
          <div className={styles.intensityPills}>
            {(['soft', 'direct', 'tough'] as PerspectiveIntensity[]).map((i) => (
              <button
                key={i}
                className={`${styles.pill} ${intensity === i ? styles.pillActive : ''}`}
                onClick={() => setIntensity(i)}
              >
                {i[0].toUpperCase() + i.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <button
          className={styles.startBtn}
          style={{ '--p-color': currentDef.color } as React.CSSProperties}
          onClick={() => { setStarted(true); sendAiTurn([]) }}
        >
          Start with {currentDef.name}
        </button>
      </div>
    )
  }

  // --- Chat screen ---
  return (
    <div className={styles.chat}>
      <div className={styles.chatHeader} style={{ '--p-color': currentDef.color } as React.CSSProperties}>
        <div className={styles.chatHeaderLeft}>
          <span className={styles.chatPersonality}>{currentDef.name}</span>
          <span className={styles.chatIntensity}>{intensity}</span>
        </div>
        <button
          className={styles.changeBtn}
          onClick={() => { setStarted(false); setMessages([]) }}
        >
          Change
        </button>
      </div>

      <div className={styles.messages}>
        {messages.map((m) => (
          <div
            key={m.id}
            className={`${styles.bubble} ${m.role === 'user' ? styles.userBubble : styles.aiBubble}`}
            style={m.role === 'assistant' ? { '--p-color': currentDef.color } as React.CSSProperties : {}}
          >
            {m.content}
          </div>
        ))}
        {streamingText && (
          <div className={`${styles.bubble} ${styles.aiBubble}`} style={{ '--p-color': currentDef.color } as React.CSSProperties}>
            {streamingText}<span className={styles.cursor} />
          </div>
        )}
        {aiLoading && !streamingText && (
          <div className={`${styles.bubble} ${styles.aiBubble}`}>
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
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submitUserTurn(textInput)
              setTextInput('')
            }
          }}
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
          onClick={handleVoiceTap}
          aria-label="Voice input"
        >
          <MicIcon />
        </button>
      </div>
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
