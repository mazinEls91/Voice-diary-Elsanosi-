import { useState } from 'react'
import styles from './SettingsPanel.module.css'

interface Props {
  onClose: () => void
}

export default function SettingsPanel({ onClose }: Props) {
  const [key, setKey] = useState(localStorage.getItem('anthropic_api_key') ?? '')
  const [saved, setSaved] = useState(false)

  function save() {
    localStorage.setItem('anthropic_api_key', key.trim())
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

        <div className={styles.field}>
          <label className={styles.label}>Anthropic API Key</label>
          <p className={styles.hint}>Required for the AI Brainstorm feature. Stored locally in your browser only.</p>
          <input
            className={styles.input}
            type="password"
            placeholder="sk-ant-…"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
          <button className={styles.saveBtn} onClick={save}>
            {saved ? 'Saved!' : 'Save Key'}
          </button>
        </div>
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
