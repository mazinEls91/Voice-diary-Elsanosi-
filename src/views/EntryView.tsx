import { useState, useEffect, useRef } from 'react'
import { getEntry } from '../db'
import { useAudioPlayer } from '../hooks/useAudioPlayer'
import AudioPlayer from '../components/AudioPlayer'
import PerspectiveMode from '../components/PerspectiveMode'
import type { DiaryEntry, EntryCategory } from '../types'
import styles from './EntryView.module.css'

const CAT_COLORS: Record<EntryCategory, string> = {
  idea: '#818cf8', reminder: '#fbbf24', reflection: '#a78bfa',
  rant: '#f87171', plan: '#34d399', note: '#94a3b8',
}

interface Props { entryId: string; onBack: () => void }

export default function EntryView({ entryId, onBack }: Props) {
  const [entry, setEntry] = useState<DiaryEntry | null>(null)
  const [showPerspective, setShowPerspective] = useState(false)
  const [reelAngle, setReelAngle] = useState(0)
  const animRef = useRef<number>()
  const player = useAudioPlayer(entry?.audioBlob ?? null)

  useEffect(() => { getEntry(entryId).then(e => setEntry(e ?? null)) }, [entryId])

  useEffect(() => {
    if (!player.isPlaying) { cancelAnimationFrame(animRef.current!); return }
    const spin = () => { setReelAngle(a => (a + 2) % 360); animRef.current = requestAnimationFrame(spin) }
    animRef.current = requestAnimationFrame(spin)
    return () => cancelAnimationFrame(animRef.current!)
  }, [player.isPlaying])

  if (!entry) return <div className={styles.loading}>Loading…</div>

  const date = new Date(entry.createdAt).toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
  const catColor = entry.category ? CAT_COLORS[entry.category] : undefined

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>
          <BackIcon /> Back
        </button>
        {entry.category && (
          <span className={styles.category} style={{ color: catColor, borderColor: (catColor ?? '') + '44' }}>
            {entry.category}
          </span>
        )}
      </header>

      <div className={styles.recorderUnit}>
        <div className={`${styles.screw} ${styles.screwTL}`} />
        <div className={`${styles.screw} ${styles.screwTR}`} />
        <div className={`${styles.screw} ${styles.screwBL}`} />
        <div className={`${styles.screw} ${styles.screwBR}`} />

        <div className={styles.cassetteHousing}>
          <PlaybackCassette title={entry.title} reelAngle={reelAngle} isPlaying={player.isPlaying} />
          <div className={styles.ledPanel}>
            <span className={`${styles.ledDisplay} ${player.isPlaying ? styles.ledActive : ''}`}>
              {fmtLed(player.currentTime)}
            </span>
          </div>
        </div>

        <div className={styles.meta}>
          <span className={styles.date}>{date}</span>
          <span className={styles.dur}>{fmtDur(entry.durationSeconds)}</span>
        </div>

        <h1 className={styles.title}>{entry.title}</h1>

        <AudioPlayer player={player} />
      </div>

      <div className={styles.content}>
        {entry.summary && (
          <div className={styles.section}>
            <span className={styles.sectionLabel}>AI SUMMARY</span>
            <p className={styles.summaryText}>{entry.summary}</p>
          </div>
        )}
        {entry.transcript && (
          <div className={styles.section}>
            <span className={styles.sectionLabel}>TRANSCRIPT</span>
            <p className={styles.transcriptText}>{entry.transcript}</p>
          </div>
        )}
        {!showPerspective ? (
          <button className={styles.perspBtn} onClick={() => setShowPerspective(true)}>
            <PerspIcon /> Perspective Mode
          </button>
        ) : (
          <PerspectiveMode entry={entry} />
        )}
      </div>
    </div>
  )
}

function PlaybackCassette({ title, reelAngle, isPlaying }: { title: string; reelAngle: number; isPlaying: boolean }) {
  const lx = 95, ly = 140, rx = 205, ry = 140
  const spokes = [0, 45, 90, 135, 180, 225, 270, 315]
  return (
    <svg className={styles.cassette} viewBox="0 0 300 190" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="190" rx="10" fill="#111008" stroke="#241c0e" strokeWidth="1.5"/>
      {Array.from({length:14}).map((_,i)=>(
        <line key={i} x1="0" y1={i*14} x2="300" y2={i*14} stroke="rgba(255,200,100,0.02)" strokeWidth="0.5"/>
      ))}
      {([[14,14],[286,14],[14,176],[286,176]] as [number,number][]).map(([x,y],i)=>(
        <g key={i}>
          <circle cx={x} cy={y} r="6" fill="#0a0806" stroke="#1e180c" strokeWidth="1"/>
          <line x1={x-3} y1={y} x2={x+3} y2={y} stroke="#2a2018" strokeWidth="1"/>
          <line x1={x} y1={y-3} x2={x} y2={y+3} stroke="#2a2018" strokeWidth="1"/>
        </g>
      ))}
      <rect x="20" y="14" width="260" height="80" rx="5" fill="#d0bfa0"/>
      {Array.from({length:8}).map((_,i)=>(
        <line key={i} x1="20" y1={22+i*10} x2="280" y2={22+i*10} stroke="rgba(37,28,10,0.07)" strokeWidth="0.5"/>
      ))}
      <rect x="20" y="14" width="260" height="18" rx="5" fill="#8a6a30" opacity="0.65"/>
      <text x="150" y="27" textAnchor="middle" fontFamily="Georgia, serif" fontSize="8" fill="#e8d8a0" letterSpacing="3">VOICE DIARY</text>
      <text x="150" y="63" textAnchor="middle" fontFamily="Courier New, monospace" fontSize="11" fill="#1e1608" letterSpacing="0.5">
        {title.length > 30 ? title.slice(0,30)+'…' : title}
      </text>
      <text x="150" y="84" textAnchor="middle" fontFamily="Courier New, monospace" fontSize="7" fill="#5a4828" letterSpacing="2">C-60  ·  HIGH BIAS</text>
      <rect x="30" y="102" width="240" height="72" rx="6" fill="#060403" stroke="#1e180c" strokeWidth="1.5"/>
      <rect x="34" y="106" width="232" height="64" rx="4" fill="#0a0806"/>
      <circle cx={lx} cy={ly} r="26" fill="#0f0d08" stroke="#241c0e" strokeWidth="1.5"/>
      <g transform={`rotate(${reelAngle}, ${lx}, ${ly})`}>
        {spokes.map((deg,i)=>{ const r=(deg*Math.PI)/180; return <line key={i} x1={lx+8*Math.cos(r)} y1={ly+8*Math.sin(r)} x2={lx+22*Math.cos(r)} y2={ly+22*Math.sin(r)} stroke="#2a2010" strokeWidth="1.5"/> })}
      </g>
      <circle cx={lx} cy={ly} r="8" fill="#151208" stroke="#241c0e" strokeWidth="1"/>
      <circle cx={lx} cy={ly} r="3.5" fill="#0a0806"/>
      <circle cx={rx} cy={ry} r="26" fill="#0f0d08" stroke="#241c0e" strokeWidth="1.5"/>
      <g transform={`rotate(${-reelAngle}, ${rx}, ${ry})`}>
        {spokes.map((deg,i)=>{ const r=(deg*Math.PI)/180; return <line key={i} x1={rx+8*Math.cos(r)} y1={ry+8*Math.sin(r)} x2={rx+22*Math.cos(r)} y2={ry+22*Math.sin(r)} stroke="#2a2010" strokeWidth="1.5"/> })}
      </g>
      <circle cx={rx} cy={ry} r="8" fill="#151208" stroke="#241c0e" strokeWidth="1"/>
      <circle cx={rx} cy={ry} r="3.5" fill="#0a0806"/>
      <circle cx="55" cy="160" r="4" fill="#0f0d08" stroke="#241c0e"/>
      <circle cx="245" cy="160" r="4" fill="#0f0d08" stroke="#241c0e"/>
      <path d="M55 160 Q150 150 245 160" fill="none" stroke="#3a2c18" strokeWidth="2.5"/>
      <line x1={lx} y1={ly+26} x2="55" y2="160" stroke="#3a2c18" strokeWidth="2"/>
      <line x1={rx} y1={ry+26} x2="245" y2="160" stroke="#3a2c18" strokeWidth="2"/>
      {isPlaying && (
        <circle cx="271" cy="120" r="5" fill="#ff6a00" opacity="0.9">
          <animate attributeName="opacity" values="0.9;0.15;0.9" dur="1s" repeatCount="indefinite"/>
        </circle>
      )}
    </svg>
  )
}

function fmtLed(s: number) {
  const h = Math.floor(s/3600).toString().padStart(2,'0')
  const m = Math.floor((s%3600)/60).toString().padStart(2,'0')
  const sec = Math.floor(s%60).toString().padStart(2,'0')
  return `${h}:${m}:${sec}`
}
function fmtDur(s: number) {
  return `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`
}
function BackIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg> }
function PerspIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> }
