import { useState, useEffect } from 'react'
import { useAudioRecorder } from '../hooks/useAudioRecorder'
import { useEntries } from '../hooks/useEntries'
import { autoTagEntry } from '../services/autoTag'
import { transcribeAudio } from '../services/transcription'
import RecordButton from '../components/RecordButton'
import EntryCard from '../components/EntryCard'
import SettingsPanel from '../components/SettingsPanel'
import type { DiaryEntry } from '../types'
import styles from './HomeView.module.css'

interface Props {
  onOpenEntry: (id: string) => void
}

export default function HomeView({ onOpenEntry }: Props) {
  const recorder = useAudioRecorder()
  const { entries, loading, add, remove, updateEntry } = useEntries()
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [search, setSearch] = useState('')
  const [finalTranscript, setFinalTranscript] = useState('')
  const [transcribing, setTranscribing] = useState(false)

  // When recording stops, run Whisper if an OpenAI key is available.
  // Web Speech API result is used as instant fallback while Whisper runs.
  useEffect(() => {
    if (recorder.state !== 'stopped' || !recorder.audioBlob) return

    const openaiKey = localStorage.getItem('openai_api_key')

    if (openaiKey) {
      setTranscribing(true)
      setFinalTranscript(recorder.transcript) // show Web Speech result immediately
      transcribeAudio(openaiKey, recorder.audioBlob)
        .then((t) => setFinalTranscript(t))
        .catch(() => setFinalTranscript(recorder.transcript)) // graceful fallback
        .finally(() => setTranscribing(false))
    } else {
      // No OpenAI key — use Web Speech API result as-is
      setFinalTranscript(recorder.transcript)
    }
  }, [recorder.state, recorder.audioBlob])

  // Reset transcript when user discards
  useEffect(() => {
    if (recorder.state === 'idle') setFinalTranscript('')
  }, [recorder.state])

  async function handleSave() {
    if (!recorder.audioBlob) return
    setSaving(true)

    const id = crypto.randomUUID()
    const entry: DiaryEntry = {
      id,
      title: title.trim() || 'Untitled entry',
      audioBlob: recorder.audioBlob,
      transcript: finalTranscript || undefined,
      durationSeconds: recorder.durationSeconds,
      createdAt: new Date().toISOString(),
      tags: [],
    }
    await add(entry)
    setTitle('')
    setFinalTranscript('')
    recorder.reset()
    setSaving(false)

    // Auto-tag using Whisper transcript for richer context
    const anthropicKey = localStorage.getItem('anthropic_api_key')
    if (anthropicKey) {
      const context = entry.transcript || entry.title
      autoTagEntry(anthropicKey, context)
        .then((result) => {
          updateEntry(id, {
            category: result.category,
            summary: result.summary || undefined,
            ...(entry.title === 'Untitled entry' && result.suggestedTitle
              ? { title: result.suggestedTitle }
              : {}),
          })
        })
        .catch(() => {})
    }
  }

  const filtered = search.trim()
    ? entries.filter((e) =>
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.transcript?.toLowerCase().includes(search.toLowerCase()) ||
        e.summary?.toLowerCase().includes(search.toLowerCase()),
      )
    : entries

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.logo}>Voice Diary</span>
        <button className={styles.settingsBtn} onClick={() => setShowSettings(true)} aria-label="Settings">
          <SettingsIcon />
        </button>
      </header>

      <section className={styles.recordSection}>
        <RecordButton
          state={recorder.state}
          levels={recorder.levels}
          durationSeconds={recorder.durationSeconds}
          onStart={recorder.start}
          onStop={recorder.stop}
        />

        {/* Live Web Speech preview while recording */}
        {recorder.state === 'recording' && recorder.transcript && (
          <div className={styles.liveTranscript}>
            <span className={styles.liveTranscriptText}>{recorder.transcript}</span>
          </div>
        )}

        {recorder.state === 'stopped' && recorder.audioBlob && (
          <div className={styles.saveForm}>
            <input
              className={styles.titleInput}
              type="text"
              placeholder="Name this entry… (leave blank for AI title)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !transcribing && handleSave()}
              autoFocus
            />

            {/* Transcript area */}
            {transcribing ? (
              <div className={styles.transcribing}>
                <span className={styles.transcribingDot} />
                Transcribing with Whisper…
              </div>
            ) : finalTranscript ? (
              <div className={styles.transcriptPreview}>
                <span className={styles.transcriptLabel}>Transcript</span>
                <p className={styles.transcriptText}>{finalTranscript}</p>
              </div>
            ) : null}

            <div className={styles.saveActions}>
              <button
                className={styles.saveBtn}
                onClick={handleSave}
                disabled={saving || transcribing}
              >
                {saving ? 'Saving…' : transcribing ? 'Wait…' : 'Save Entry'}
              </button>
              <button className={styles.discardBtn} onClick={recorder.reset}>Discard</button>
            </div>
          </div>
        )}
      </section>

      <section className={styles.listSection}>
        {entries.length > 0 && (
          <div className={styles.searchRow}>
            <SearchIcon />
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search your entries…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className={styles.clearSearch} onClick={() => setSearch('')}>×</button>
            )}
          </div>
        )}

        {loading ? (
          <p className={styles.hint}>Loading…</p>
        ) : entries.length === 0 ? (
          <p className={styles.hint}>Your entries will appear here.</p>
        ) : filtered.length === 0 ? (
          <p className={styles.hint}>No entries match “{search}”</p>
        ) : (
          <>
            <div className={styles.listMeta}>
              <h2 className={styles.listHeading}>Entries</h2>
              <span className={styles.count}>{filtered.length}</span>
            </div>
            {filtered.map((e) => (
              <EntryCard
                key={e.id}
                entry={e}
                onClick={() => onOpenEntry(e.id)}
                onDelete={() => remove(e.id)}
              />
            ))}
          </>
        )}
      </section>

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  )
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}
