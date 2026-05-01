import { useState, useCallback } from 'react'
import type { DiaryEntry } from '../types'

export function useDiaryEntries() {
  const [entries, setEntries] = useState<DiaryEntry[]>([])

  const addEntry = useCallback((entry: DiaryEntry) => {
    setEntries((prev) => [entry, ...prev])
  }, [])

  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }, [])

  return { entries, addEntry, deleteEntry }
}
