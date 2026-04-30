import EntryList from './components/EntryList'
import AudioRecorder from './components/AudioRecorder'
import { useDiaryEntries } from './hooks/useDiaryEntries'
import styles from './App.module.css'

export default function App() {
  const { entries, addEntry } = useDiaryEntries()

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1>Voice Diary</h1>
      </header>
      <main className={styles.main}>
        <AudioRecorder onSave={addEntry} />
        <EntryList entries={entries} />
      </main>
    </div>
  )
}
