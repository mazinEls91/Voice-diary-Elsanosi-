import { useState } from 'react'
import { useAudioRecorder } from '../hooks/useAudioRecorder'
import type { DiaryEntry } from '../types'
import styles from './AudioRecorder.module.css'

interface Props {
  onSave: (entry: DiaryEntry) => void
}

export default function AudioRecorder({ onSave }: Props) {
  const { state, audioBlob, durationSeconds, start, stop, reset } = useAudioRecorder()
  const [title, setTitle] = useState('')

  function handleSave() {
    if (!audioBlob) return
    const url = URL.createObjectURL(audioBlob)
    onSave({
      id: crypto.randomUUID(),
      title: title.trim() || 'Untitled entry',
      audioBlob,
      audioUrl: url,
      durationSeconds,
      createdAt: new Date(),
      tags: [],
    })
    setTitle('')
    reset()
  }

  return (
    <div className={styles.recorder}>
      {state === 'idle' && (
        <button className={styles.recordBtn} onClick={start}>
          ● Start Recording
        </button>
      )}

      {state === 'recording' && (
        <button className={`${styles.recordBtn} ${styles.recording}`} onClick={stop}>
          ■ Stop Recording
        </button>
      )}

      {state === 'stopped' && audioBlob && (
        <div className={styles.saveForm}>
          <audio controls src={URL.createObjectURL(audioBlob)} />
          <input
            type="text"
            placeholder="Give this entry a title…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className={styles.actions}>
            <button onClick={handleSave}>Save Entry</button>
            <button onClick={reset}>Discard</button>
          </div>
        </div>
      )}
    </div>
  )
}
