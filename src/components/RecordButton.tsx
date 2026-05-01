import type { RecorderState } from '../types'
import styles from './RecordButton.module.css'

interface Props {
  state: RecorderState
  levels: number[]
  durationSeconds: number
  onStart: () => void
  onStop: () => void
}

export default function RecordButton({ state, levels, durationSeconds, onStart, onStop }: Props) {
  const isRecording = state === 'recording'

  function formatTime(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  return (
    <div className={styles.wrapper}>
      {isRecording && (
        <div className={styles.waveform} aria-hidden>
          {levels.map((lvl, i) => (
            <div
              key={i}
              className={styles.bar}
              style={{ transform: `scaleY(${0.1 + lvl * 0.9})` }}
            />
          ))}
        </div>
      )}

      <button
        className={`${styles.btn} ${isRecording ? styles.recording : ''}`}
        onClick={isRecording ? onStop : onStart}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        disabled={state === 'stopped'}
      >
        {isRecording ? <StopIcon /> : <MicIcon />}
      </button>

      <span className={styles.label}>
        {state === 'idle' && 'Tap to record'}
        {state === 'recording' && formatTime(durationSeconds)}
        {state === 'stopped' && 'Recording saved'}
      </span>
    </div>
  )
}

function MicIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
      <rect x="4" y="4" width="16" height="16" rx="3" />
    </svg>
  )
}
