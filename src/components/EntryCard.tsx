import type { DiaryEntry } from '../types'
import styles from './EntryCard.module.css'

interface Props {
  entry: DiaryEntry
  onClick: () => void
  onDelete: () => void
}

export default function EntryCard({ entry, onClick, onDelete }: Props) {
  const date = formatRelative(entry.createdAt)
  const duration = formatDuration(entry.durationSeconds)

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (confirm('Delete this entry?')) onDelete()
  }

  return (
    <article className={styles.card} onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}>
      <div className={styles.top}>
        <div className={styles.left}>
          <span className={styles.date}>{date}</span>
          <span className={styles.duration}>{duration}</span>
        </div>
        <button className={styles.deleteBtn} onClick={handleDelete} aria-label="Delete entry">
          <TrashIcon />
        </button>
      </div>
      <h3 className={styles.title}>{entry.title}</h3>
      {entry.transcript && (
        <p className={styles.preview}>{entry.transcript}</p>
      )}
      <div className={styles.footer}>
        <PlayIcon />
        <span>Tap to open</span>
      </div>
    </article>
  )
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0')
  const sec = (s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  )
}
