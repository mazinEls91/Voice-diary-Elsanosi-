import type { DiaryEntry as DiaryEntryType } from '../types'
import styles from './DiaryEntry.module.css'

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

interface Props {
  entry: DiaryEntryType
}

export default function DiaryEntry({ entry }: Props) {
  const date = entry.createdAt.toLocaleDateString(undefined, {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  })

  return (
    <article className={styles.entry}>
      <div className={styles.meta}>
        <span className={styles.date}>{date}</span>
        <span className={styles.duration}>{formatDuration(entry.durationSeconds)}</span>
      </div>
      <h2 className={styles.title}>{entry.title}</h2>
      <audio controls src={entry.audioUrl} className={styles.player} />
    </article>
  )
}
