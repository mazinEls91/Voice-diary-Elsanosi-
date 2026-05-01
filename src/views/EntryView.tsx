import { useState, useEffect } from 'react'
import { getEntry } from '../db'
import { useAudioPlayer } from '../hooks/useAudioPlayer'
import AudioPlayer from '../components/AudioPlayer'
import BrainstormChat from '../components/BrainstormChat'
import type { DiaryEntry } from '../types'
import styles from './EntryView.module.css'

interface Props {
  entryId: string
  onBack: () => void
}

export default function EntryView({ entryId, onBack }: Props) {
  const [entry, setEntry] = useState<DiaryEntry | null>(null)
  const [showBrainstorm, setShowBrainstorm] = useState(false)
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
          <span className={styles.duration}>{formatDuration(entry.durationSeconds)}</span>
        </div>
        <h1 className={styles.title}>{entry.title}</h1>

        <AudioPlayer player={player} />

        {entry.transcript && (
          <div className={styles.transcript}>
            <h2 className={styles.sectionLabel}>Transcript</h2>
            <p className={styles.transcriptText}>{entry.transcript}</p>
          </div>
        )}

        {!showBrainstorm ? (
          <button className={styles.brainstormBtn} onClick={() => setShowBrainstorm(true)}>
            <BrainIcon />
            Brainstorm with AI
          </button>
        ) : (
          <BrainstormChat entry={entry} />
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

function BrainIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
    </svg>
  )
}
