import type { useAudioPlayer } from '../hooks/useAudioPlayer'
import styles from './AudioPlayer.module.css'

type Player = ReturnType<typeof useAudioPlayer>
interface Props { player: Player }

export default function AudioPlayer({ player }: Props) {
  const { isPlaying, currentTime, duration, togglePlay, seek } = player
  const progress = duration > 0 ? currentTime / duration : 0

  return (
    <div className={styles.player}>
      <div className={styles.btnRow}>
        <button
          className={styles.btn}
          onClick={() => seek(Math.max(0, currentTime - 10))}
          title="Back 10s"
        >
          <RewIcon /><span>REW</span>
        </button>
        <button
          className={`${styles.btn} ${styles.playBtn} ${isPlaying ? styles.playing : ''}`}
          onClick={togglePlay}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
          <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
        </button>
        <button
          className={styles.btn}
          onClick={() => seek(Math.min(duration, currentTime + 10))}
          title="Forward 10s"
        >
          <FwdIcon /><span>FWD</span>
        </button>
      </div>

      <div className={styles.trackArea}>
        <span className={styles.time}>{fmt(currentTime)}</span>
        <div
          className={styles.track}
          onClick={e => {
            if (duration <= 0) return
            const r = e.currentTarget.getBoundingClientRect()
            seek(((e.clientX - r.left) / r.width) * duration)
          }}
        >
          <div className={styles.fill} style={{ width: `${progress * 100}%` }} />
          <div className={styles.head} style={{ left: `${progress * 100}%` }} />
        </div>
        <span className={styles.time}>{fmt(duration)}</span>
      </div>
    </div>
  )
}

function fmt(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${Math.floor(s % 60).toString().padStart(2, '0')}`
}

function PlayIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> }
function PauseIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg> }
function RewIcon() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="11 19 2 12 11 5 11 19"/><polygon points="22 19 13 12 22 5 22 19"/></svg> }
function FwdIcon() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 19 22 12 13 5 13 19"/><polygon points="2 19 11 12 2 5 2 19"/></svg> }
