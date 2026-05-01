import { useState } from 'react'
import { useAudioRecorder } from '../hooks/useAudioRecorder'
import { useEntries } from '../hooks/useEntries'
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
  const { entries, loading, add, remove } = useEntries()
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  async function handleSave() {
    if (!recorder.audioBlob) return
    setSaving(true)
    const entry: DiaryEntry = {
      id: crypto.randomUUID(),
      title: title.trim() || 'Untitled entry',
      audioBlob: recorder.audioBlob,
      durationSeconds: recorder.durationSeconds,
      createdAt: new Date().toISOString(),
      tags: [],
    }
    await add(entry)
    setTitle('')
    recorder.reset()
    setSaving(false)
  }

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

        {recorder.state === 'stopped' && recorder.audioBlob && (
          <div className={styles.saveForm}>
            <input
              className={styles.titleInput}
              type="text"
              placeholder="Name this entry…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
            <div className={styles.saveActions}>
              <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save Entry'}
              </button>
              <button className={styles.discardBtn} onClick={recorder.reset}>Discard</button>
            </div>
          </div>
        )}
      </section>

      <section className={styles.listSection}>
        {loading ? (
          <p className={styles.hint}>Loading…</p>
        ) : entries.length === 0 ? (
          <p className={styles.hint}>Your entries will appear here.</p>
        ) : (
          <>
            <h2 className={styles.listHeading}>Entries</h2>
            {entries.map((e) => (
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
