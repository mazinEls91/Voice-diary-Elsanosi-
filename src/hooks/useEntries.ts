import { useState, useEffect, useCallback } from 'react'
import { getAllEntries, saveEntry, deleteEntry } from '../db'
import type { DiaryEntry } from '../types'

export function useEntries() {
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllEntries().then((all) => { setEntries(all); setLoading(false) })
  }, [])

  const add = useCallback(async (entry: DiaryEntry) => {
    await saveEntry(entry)
    setEntries((prev) => [entry, ...prev])
  }, [])

  const remove = useCallback(async (id: string) => {
    await deleteEntry(id)
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const updateTranscript = useCallback(async (id: string, transcript: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, transcript } : e))
    )
    const all = await getAllEntries()
    const target = all.find((e) => e.id === id)
    if (target) await saveEntry({ ...target, transcript })
  }, [])

  return { entries, loading, add, remove, updateTranscript }
}
