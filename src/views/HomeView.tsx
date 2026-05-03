import { useState, useEffect, useRef } from 'react'
import { useAudioRecorder } from '../hooks/useAudioRecorder'
import { useEntries } from '../hooks/useEntries'
import { autoTagEntry } from '../services/autoTag'
import { transcribeAudio } from '../services/transcription'
import EntryCard from '../components/EntryCard'
import SettingsPanel from '../components/SettingsPanel'
import type { DiaryEntry } from '../types'
import styles from './HomeView.module.css'

interface Props {
  onOpenEntry: (id: string) => void
}

export default function HomeView({ onOpenEntry }: Props) {
  const recorder = useAudioRecorder()
  const { entries, loading, add, remove, updateEntry } = useEntries()
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [search, setSearch] = useState('')
  const [finalTranscript, setFinalTranscript] = useState('')
  const [transcribing, setTranscribing] = useState(false)
  const [reelAngle, setReelAngle] = useState(0)
  const animRef = useRef<number>()
  const transcriptRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (recorder.state !== 'recording') {
      cancelAnimationFrame(animRef.current!)
      return
    }
    const spin = () => {
      setReelAngle(a => (a + 2) % 360)
      animRef.current = requestAnimationFrame(spin)
    }
    animRef.current = requestAnimationFrame(spin)
    return () => cancelAnimationFrame(animRef.current!)
  }, [recorder.state])

  // Auto-scroll transcript to bottom whenever new words arrive
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [recorder.transcript])

  useEffect(() => {
    if (recorder.state !== 'stopped' || !recorder.audioBlob) return
    const openaiKey = localStorage.getItem('openai_api_key')
    if (openaiKey) {
      setTranscribing(true)
      setFinalTranscript(recorder.transcript)
      transcribeAudio(openaiKey, recorder.audioBlob)
        .then(t => setFinalTranscript(t))
        .catch(() => setFinalTranscript(recorder.transcript))
        .finally(() => setTranscribing(false))
    } else {
      setFinalTranscript(recorder.transcript)
    }
  }, [recorder.state, recorder.audioBlob])

  useEffect(() => {
    if (recorder.state === 'idle') setFinalTranscript('')
  }, [recorder.state])

  async function handleSave() {
    if (!recorder.audioBlob) return
    setSaving(true)
    setSaveError(null)
    const id = crypto.randomUUID()
    const entry: DiaryEntry = {
      id,
      title: title.trim() || 'Untitled entry',
      audioBlob: recorder.audioBlob,
      transcript: finalTranscript || undefined,
      durationSeconds: recorder.durationSeconds,
      createdAt: new Date().toISOString(),
      tags: [],
    }
    try {
      await add(entry)
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err
            ? String((err as Record<string, unknown>).message)
            : JSON.stringify(err)
      setSaveError(`Save failed: ${msg}`)
      setSaving(false)
      return
    }
    setTitle('')
    setFinalTranscript('')
    recorder.reset()
    setSaving(false)
    const anthropicKey = localStorage.getItem('anthropic_api_key')
    if (anthropicKey) {
      autoTagEntry(anthropicKey, entry.transcript || entry.title)
        .then(result => updateEntry(id, {
          category: result.category,
          summary: result.summary || undefined,
          ...(entry.title === 'Untitled entry' && result.suggestedTitle ? { title: result.suggestedTitle } : {}),
        }))
        .catch(() => {})
    }
  }

  const isRecording = recorder.state === 'recording'
  const isStopped = recorder.state === 'stopped'

  const filtered = search.trim()
    ? entries.filter(e =>
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.transcript?.toLowerCase().includes(search.toLowerCase()) ||
        e.summary?.toLowerCase().includes(search.toLowerCase())
      )
    : entries

  function formatLed(s: number) {
    const h = Math.floor(s / 3600).toString().padStart(2, '0')
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${h}:${m}:${sec}`
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <span className={styles.appTitle}>VOICE DIARY</span>
          <span className={styles.appTagline}>Capture · Reflect · Remember</span>
        </div>
        <button className={styles.settingsBtn} onClick={() => setShowSettings(true)} aria-label="Settings">
          <GearIcon />
        </button>
      </header>

      <div className={styles.recorderUnit}>
        <div className={`${styles.screw} ${styles.screwTL}`} />
        <div className={`${styles.screw} ${styles.screwTR}`} />
        <div className={`${styles.screw} ${styles.screwBL}`} />
        <div className={`${styles.screw} ${styles.screwBR}`} />

        <div className={styles.cassetteHousing}>
          <CassetteSVG
            title={isStopped ? (title || 'New recording…') : (entries[0]?.title ?? 'Voice Diary')}
            reelAngle={reelAngle}
            isRecording={isRecording}
          />
          <div className={styles.ledPanel}>
            <span className={`${styles.ledDisplay} ${isRecording ? styles.ledActive : ''}`}>
              {formatLed(recorder.durationSeconds)}
            </span>
          </div>
        </div>

        <div className={styles.statusRow}>
          <span className={styles.entryCount}>
            {String(entries.length).padStart(3, '0')}/{String(Math.max(entries.length, 99)).padStart(3, '0')}
          </span>
          <span className={`${styles.recIndicator} ${isRecording ? styles.recActive : ''}`}>
            <span className={styles.recDot} />
            REC
          </span>
        </div>

        {/* Live transcript window — visible as soon as recording starts */}
        {isRecording && (
          <div className={styles.liveTranscript}>
            <div className={styles.liveHeader}>
              <span className={styles.liveDot} />
              <span className={styles.liveLabel}>LIVE TRANSCRIPT</span>
            </div>
            <div className={styles.liveBody} ref={transcriptRef}>
              {recorder.transcript ? (
                <span className={styles.liveText}>{recorder.transcript}</span>
              ) : (
                <span className={styles.liveHint}>Listening…<span className={styles.cursor} /></span>
              )}
            </div>
          </div>
        )}

        {isStopped && (
          <div className={styles.saveForm}>
            <input
              className={styles.titleInput}
              type="text"
              placeholder="Label this tape…"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !transcribing && handleSave()}
              autoFocus
            />
            {transcribing && (
              <div className={styles.transcribingRow}>
                <span className={styles.transcribingDot} />
                Transcribing…
              </div>
            )}
            {!transcribing && finalTranscript && (
              <p className={styles.transcriptPreview}>{finalTranscript}</p>
            )}
            {saveError && (
              <p className={styles.saveErrorMsg}>{saveError}</p>
            )}
          </div>
        )}

        <div className={styles.controls}>
          <button
            className={`${styles.ctrlBtn} ${styles.recBtn} ${isRecording ? styles.btnActive : ''}`}
            onClick={recorder.state === 'idle' ? recorder.start : undefined}
            disabled={isStopped}
          >
            <RecIcon />
            <span>REC</span>
          </button>
          <button
            className={styles.ctrlBtn}
            onClick={isRecording ? recorder.stop : undefined}
            disabled={!isRecording}
          >
            <StopIcon />
            <span>STOP</span>
          </button>
          <button
            className={`${styles.ctrlBtn} ${styles.saveBtn}`}
            onClick={handleSave}
            disabled={!isStopped || saving || transcribing}
          >
            <SaveIcon />
            <span>{saving ? 'SAVE…' : 'SAVE'}</span>
          </button>
          <button
            className={styles.ctrlBtn}
            onClick={isStopped ? recorder.reset : undefined}
            disabled={!isStopped || saving}
            title="Discard this recording"
          >
            <RewIcon />
            <span>DISC</span>
          </button>
          <button className={styles.ctrlBtn} disabled>
            <FwdIcon />
            <span>FWD</span>
          </button>
        </div>
      </div>

      <div className={styles.library}>
        {entries.length > 0 && (
          <div className={styles.searchRow}>
            <SearchIcon />
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search tapes…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className={styles.clearSearch} onClick={() => setSearch('')}>×</button>
            )}
          </div>
        )}
        <div className={styles.libraryHeader}>
          <span className={styles.libraryLabel}>TAPE LIBRARY</span>
          {filtered.length > 0 && <span className={styles.libraryCount}>{filtered.length}</span>}
        </div>
        {loading ? (
          <p className={styles.emptyMsg}>Loading…</p>
        ) : entries.length === 0 ? (
          <p className={styles.emptyMsg}>Press REC to capture your first thought.</p>
        ) : filtered.length === 0 ? (
          <p className={styles.emptyMsg}>No tapes match "{search}"</p>
        ) : (
          filtered.map(e => (
            <EntryCard key={e.id} entry={e} onClick={() => onOpenEntry(e.id)} onDelete={() => remove(e.id)} />
          ))
        )}
      </div>

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  )
}

function CassetteSVG({ title, reelAngle, isRecording }: { title: string; reelAngle: number; isRecording: boolean }) {
  const lx = 95, ly = 140, rx = 205, ry = 140
  const spokeAngles = [0, 45, 90, 135, 180, 225, 270, 315]
  return (
    <svg className={styles.cassette} viewBox="0 0 300 190" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="190" rx="10" fill="#111008" stroke="#241c0e" strokeWidth="1.5"/>
      {Array.from({ length: 14 }).map((_, i) => (
        <line key={i} x1="0" y1={i * 14} x2="300" y2={i * 14} stroke="rgba(255,200,100,0.02)" strokeWidth="0.5"/>
      ))}
      {([[14,14],[286,14],[14,176],[286,176]] as [number,number][]).map(([x,y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="6" fill="#0a0806" stroke="#1e180c" strokeWidth="1"/>
          <line x1={x-3} y1={y} x2={x+3} y2={y} stroke="#2a2018" strokeWidth="1"/>
          <line x1={x} y1={y-3} x2={x} y2={y+3} stroke="#2a2018" strokeWidth="1"/>
        </g>
      ))}
      <rect x="20" y="14" width="260" height="80" rx="5" fill="#d0bfa0"/>
      {Array.from({ length: 8 }).map((_, i) => (
        <line key={i} x1="20" y1={22 + i * 10} x2="280" y2={22 + i * 10} stroke="rgba(37,28,10,0.07)" strokeWidth="0.5"/>
      ))}
      <rect x="20" y="14" width="260" height="18" rx="5" fill="#8a6a30" opacity="0.65"/>
      <text x="150" y="27" textAnchor="middle" fontFamily="Georgia, serif" fontSize="8" fill="#e8d8a0" letterSpacing="3">VOICE DIARY</text>
      <text x="150" y="63" textAnchor="middle" fontFamily="Courier New, monospace" fontSize="11" fill="#1e1608" letterSpacing="0.5">
        {title.length > 30 ? title.slice(0, 30) + '…' : title}
      </text>
      <text x="150" y="84" textAnchor="middle" fontFamily="Courier New, monospace" fontSize="7" fill="#5a4828" letterSpacing="2">C-60  ·  HIGH BIAS</text>
      <rect x="30" y="102" width="240" height="72" rx="6" fill="#060403" stroke="#1e180c" strokeWidth="1.5"/>
      <rect x="34" y="106" width="232" height="64" rx="4" fill="#0a0806"/>
      <circle cx={lx} cy={ly} r="26" fill="#0f0d08" stroke="#241c0e" strokeWidth="1.5"/>
      <g transform={`rotate(${reelAngle}, ${lx}, ${ly})`}>
        {spokeAngles.map((deg, i) => {
          const rad = (deg * Math.PI) / 180
          return <line key={i} x1={lx + 8*Math.cos(rad)} y1={ly + 8*Math.sin(rad)} x2={lx + 22*Math.cos(rad)} y2={ly + 22*Math.sin(rad)} stroke="#2a2010" strokeWidth="1.5"/>
        })}
      </g>
      <circle cx={lx} cy={ly} r="8" fill="#151208" stroke="#241c0e" strokeWidth="1"/>
      <circle cx={lx} cy={ly} r="3.5" fill="#0a0806"/>
      <circle cx={rx} cy={ry} r="26" fill="#0f0d08" stroke="#241c0e" strokeWidth="1.5"/>
      <g transform={`rotate(${-reelAngle}, ${rx}, ${ry})`}>
        {spokeAngles.map((deg, i) => {
          const rad = (deg * Math.PI) / 180
          return <line key={i} x1={rx + 8*Math.cos(rad)} y1={ry + 8*Math.sin(rad)} x2={rx + 22*Math.cos(rad)} y2={ry + 22*Math.sin(rad)} stroke="#2a2010" strokeWidth="1.5"/>
        })}
      </g>
      <circle cx={rx} cy={ry} r="8" fill="#151208" stroke="#241c0e" strokeWidth="1"/>
      <circle cx={rx} cy={ry} r="3.5" fill="#0a0806"/>
      <circle cx="55" cy="160" r="4" fill="#0f0d08" stroke="#241c0e"/>
      <circle cx="245" cy="160" r="4" fill="#0f0d08" stroke="#241c0e"/>
      <path d="M55 160 Q150 150 245 160" fill="none" stroke="#3a2c18" strokeWidth="2.5"/>
      <line x1={lx} y1={ly+26} x2="55" y2="160" stroke="#3a2c18" strokeWidth="2"/>
      <line x1={rx} y1={ry+26} x2="245" y2="160" stroke="#3a2c18" strokeWidth="2"/>
      {isRecording && (
        <circle cx="271" cy="120" r="5" fill="#ff2200" opacity="0.9">
          <animate attributeName="opacity" values="0.9;0.15;0.9" dur="0.9s" repeatCount="indefinite"/>
        </circle>
      )}
    </svg>
  )
}

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
}
function RecIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg> }
function StopIcon() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg> }
function SaveIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> }
function RewIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="11 19 2 12 11 5 11 19"/><polygon points="22 19 13 12 22 5 22 19"/></svg> }
function FwdIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 19 22 12 13 5 13 19"/><polygon points="2 19 11 12 2 5 2 19"/></svg> }
function SearchIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> }
