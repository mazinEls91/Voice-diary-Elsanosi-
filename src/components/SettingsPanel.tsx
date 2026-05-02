import { useState, useRef } from 'react'
import { exportBackup, importBackup } from '../db'
import styles from './SettingsPanel.module.css'

interface Props {
  onClose: () => void
}

export default function SettingsPanel({ onClose }: Props) {
  const [anthropicKey, setAnthropicKey] = useState(
    localStorage.getItem('anthropic_api_key') ?? ''
  )
  const [openaiKey, setOpenaiKey] = useState(
    localStorage.getItem('openai_api_key') ?? ''
  )
  const [hideAnthropic, setHideAnthropic] = useState(true)
  const [hideOpenai, setHideOpenai] = useState(true)
  const [saved, setSaved] = useState(false)
  const [importStatus, setImportStatus] = useState<'idle' | 'ok' | 'err'>('idle')
  const fileRef = useRef<HTMLInputElement>(null)

  function save() {
    localStorage.setItem('anthropic_api_key', anthropicKey.trim())
    localStorage.setItem('openai_api_key', openaiKey.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleExport() {
    const data = exportBackup()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `voice-diary-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        importBackup(reader.result as string)
        setImportStatus('ok')
        setTimeout(() => {
          setImportStatus('idle')
          window.location.reload()
        }, 1200)
      } catch {
        setImportStatus('err')
        setTimeout(() => setImportStatus('idle'), 2500)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Settings</h2>
            <p className={styles.subtitle}>Keys stored in your browser only.</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        {/* Data backup section */}
        <div className={styles.backupSection}>
          <span className={styles.backupLabel}>DATA BACKUP</span>
          <p className={styles.backupHint}>
            StackBlitz resets storage on each reload. Export your recordings
            before refreshing, then import them after to keep your data.
          </p>
          <div className={styles.backupRow}>
            <button className={styles.backupBtn} onClick={handleExport}>
              <DownloadIcon /> Export
            </button>
            <button className={styles.backupBtn} onClick={() => fileRef.current?.click()}>
              <UploadIcon />
              {importStatus === 'ok' ? 'Imported ✓' : importStatus === 'err' ? 'Invalid file' : 'Import'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              className={styles.fileInput}
              onChange={handleImport}
            />
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.fields}>
          <div className={styles.field}>
            <label className={styles.label}>Anthropic API Key</label>
            <div className={styles.keyUsage}>
              <UsageTag>Perspective Mode</UsageTag>
              <UsageTag>Auto-tagging</UsageTag>
              <UsageTag>AI Summary</UsageTag>
              <UsageTag>Smart Title</UsageTag>
            </div>
            <p className={styles.hint}>
              Claude reads your transcript after saving and auto-assigns a category,
              writes a summary, and suggests a title. Perspective Mode lets you
              explore your thoughts through five AI personalities.
            </p>
            <div className={styles.inputRow}>
              <input
                className={styles.input}
                type={hideAnthropic ? 'password' : 'text'}
                placeholder="sk-ant-api03-…"
                value={anthropicKey}
                onChange={e => setAnthropicKey(e.target.value)}
                spellCheck={false}
                autoComplete="off"
              />
              <button className={styles.toggleBtn} onClick={() => setHideAnthropic(h => !h)} type="button">
                {hideAnthropic ? <EyeIcon /> : <EyeOffIcon />}
              </button>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>OpenAI API Key</label>
            <div className={styles.keyUsage}>
              <UsageTag>Whisper Transcription</UsageTag>
            </div>
            <p className={styles.hint}>
              Sends audio to Whisper after recording stops for an accurate transcript.
              Leave blank to fall back to browser speech recognition.
            </p>
            <div className={styles.inputRow}>
              <input
                className={styles.input}
                type={hideOpenai ? 'password' : 'text'}
                placeholder="sk-proj-…"
                value={openaiKey}
                onChange={e => setOpenaiKey(e.target.value)}
                spellCheck={false}
                autoComplete="off"
              />
              <button className={styles.toggleBtn} onClick={() => setHideOpenai(h => !h)} type="button">
                {hideOpenai ? <EyeIcon /> : <EyeOffIcon />}
              </button>
            </div>
          </div>
        </div>

        <button className={styles.saveBtn} onClick={save}>
          {saved ? '✓ Saved' : 'Save Keys'}
        </button>
      </div>
    </div>
  )
}

function UsageTag({ children }: { children: string }) {
  return <span className={styles.usageTag}>{children}</span>
}
function CloseIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
}
function EyeIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
}
function EyeOffIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
}
function DownloadIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
}
function UploadIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
}
