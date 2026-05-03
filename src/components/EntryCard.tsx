import type { DiaryEntry, EntryCategory } from '../types'
import styles from './EntryCard.module.css'

const CATEGORY_COLORS: Record<EntryCategory, string> = {
  idea: '#818cf8',
  reminder: '#fbbf24',
  reflection: '#a78bfa',
  rant: '#f87171',
  plan: '#34d399',
  note: '#94a3b8',
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function formatDuration(s: number): string {
  const m = Math.floor(s / 60).toString().padStart(2, '0')
  const sec = (s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

interface Props {
  entry: DiaryEntry
  onClick: () => void
  onDelete: () => void
}

export default function EntryCard({ entry, onClick, onDelete }: Props) {
  const catColor = entry.category ? CATEGORY_COLORS[entry.category] : undefined

  return (
    <div className={styles.card} onClick={onClick}>
      {/* Left spine — colour-coded by category */}
      <div
        className={styles.spine}
        style={catColor ? { background: catColor + '28', borderRightColor: catColor + '50' } : undefined}
      />

      {/* Label area */}
      <div className={styles.label}>
        <div className={styles.labelStripe} />
        <div className={styles.labelBody}>
          <div className={styles.topRow}>
            <span className={styles.title}>{entry.title}</span>
            {entry.category && (
              <span className={styles.category} style={{ color: catColor, borderColor: (catColor ?? '') + '55' }}>
                {entry.category}
              </span>
            )}
          </div>
          {(entry.summary || entry.transcript) && (
            <p className={styles.preview}>{entry.summary || entry.transcript}</p>
          )}
          <div className={styles.metaRow}>
            <span className={styles.metaTime}>{relativeTime(entry.createdAt)}</span>
            <span className={styles.metaDur}>{formatDuration(entry.durationSeconds)}</span>
          </div>
        </div>
      </div>

      {/* Mini reel visual */}
      <div className={styles.reels}>
        <div className={styles.reel}>
          <div className={styles.reelHub} />
        </div>
        <div className={styles.reel}>
          <div className={styles.reelHub} />
        </div>
      </div>

      <button
        className={styles.del}
        onClick={e => { e.stopPropagation(); onDelete() }}
        aria-label="Delete"
      >
        ×
      </button>
    </div>
  )
}
