import type { DiaryEntry } from '../types'
import DiaryEntryCard from './DiaryEntry'
import styles from './EntryList.module.css'

interface Props {
  entries: DiaryEntry[]
}

export default function EntryList({ entries }: Props) {
  if (entries.length === 0) {
    return <p className={styles.empty}>No entries yet. Hit record to capture your first thought.</p>
  }

  return (
    <section className={styles.list}>
      <h2 className={styles.heading}>Your Entries</h2>
      {entries.map((entry) => (
        <DiaryEntryCard key={entry.id} entry={entry} />
      ))}
    </section>
  )
}
