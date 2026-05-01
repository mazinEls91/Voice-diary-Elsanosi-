import { useState, useEffect } from 'react'
import { getEntry } from '../db'
import { useAudioPlayer } from '../hooks/useAudioPlayer'
import AudioPlayer from '../components/AudioPlayer'
import PerspectiveMode from '../components/PerspectiveMode'
import type { DiaryEntry, EntryCategory } from '../types'
import styles from './EntryView.module.css'

interface Props {
  entryId: string
  onBack: () => void
}

const CATEGORY_COLORS: Record<EntryCategory, string> = {
  idea: '#818cf8',
  reminder: '#fbbf24',
  reflection: '#a78bfa',
  rant: '#f87171',
  plan: '#34d399',
  note: '#94a3b8',
}

export default function EntryView({ entryId, onBack }: Props) {
  const [entry, setEntry] = useState<DiaryEntry | null>(null)
  const [showPerspective, setShowPerspective] = useState(false)
  const player = useAudioPlayer(entry?.audioBlob ?? null)

  useEffect(() => {
    getEntry(entryId).then((e) => setEntry(e ?? null))
  }, [entryId])

  if (!entry) return <div className={styles.loading}>Loading…</div>

  const date = new Date(entry.createdAt).toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>
          <BackIcon /> Back
        </button>
      </header>

      <div className={styles.content}>
        <div className={styles.meta}>
          <span className={styles.date}>{date}</span>
          <div className={styles.metaRight}>
            {entry.category && (
              <span
                className={styles.categoryBadge}
                style={{ color: CATEGORY_COLORS[entry.category], borderColor: CATEGORY_COLORS[entry.category] + '40' }}
              >
                {entry.category}
              </span>
            )}
            <span className={styles.duration}>{formatDuration(entry.durationSeconds)}</span>
          </div>
        </div>

        <h1 className={styles.title}>{entry.title}</h1>

        {entry.summary && (
          <p className={styles.summary}>{entry.summary}</p>
        )}

        <AudioPlayer player={player} />

        {entry.transcript && (
          <div className={styles.section}>
            <h2 className={styles.sectionLabel}>Transcript</h2>
            <p className={styles.sectionText}>{entry.transcript}</p>
          </div>
        )}

        {!showPerspective ? (
          <button className={styles.perspectiveBtn} onClick={() => setShowPerspective(true)}>
            <PerspectiveIcon />
            Perspective Mode
          </button>
        ) : (
          <PerspectiveMode entry={entry} />
        )}
      </div>
    </div>
  )
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0')
  const sec = (s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  )
}

function PerspectiveIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}
