import { useState } from 'react'
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
  const [saved, setSaved] = useState(false)

  function save() {
    localStorage.setItem('anthropic_api_key', anthropicKey.trim())
    localStorage.setItem('openai_api_key', openaiKey.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Settings</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className={styles.fields}>
          <div className={styles.field}>
            <label className={styles.label}>Anthropic API Key</label>
            <p className={styles.hint}>
              Powers <strong>Perspective Mode</strong> and <strong>auto-tagging</strong>.
            </p>
            <input
              className={styles.input}
              type="password"
              placeholder="sk-ant-…"
              value={anthropicKey}
              onChange={(e) => setAnthropicKey(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>OpenAI API Key</label>
            <p className={styles.hint}>
              Powers <strong>Whisper transcription</strong>. Without this, the app
              falls back to the browser’s built-in speech recognition.
            </p>
            <input
              className={styles.input}
              type="password"
              placeholder="sk-…"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
            />
          </div>
        </div>

        <button className={styles.saveBtn} onClick={save}>
          {saved ? 'Saved!' : 'Save Keys'}
        </button>
      </div>
    </div>
  )
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
