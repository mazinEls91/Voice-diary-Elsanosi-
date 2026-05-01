import type { useAudioPlayer } from '../hooks/useAudioPlayer'
import styles from './AudioPlayer.module.css'

type Player = ReturnType<typeof useAudioPlayer>

interface Props {
  player: Player
}

export default function AudioPlayer({ player }: Props) {
  const { isPlaying, currentTime, duration, togglePlay, seek } = player
  const progress = duration > 0 ? currentTime / duration : 0

  return (
    <div className={styles.player}>
      <button className={styles.playBtn} onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>

      <div className={styles.track} onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        seek(((e.clientX - rect.left) / rect.width) * duration)
      }}>
        <div className={styles.fill} style={{ width: `${progress * 100}%` }} />
        <div className={styles.thumb} style={{ left: `${progress * 100}%` }} />
      </div>

      <span className={styles.time}>
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
    </div>
  )
}

function formatTime(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0')
  const sec = Math.floor(s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  )
}
