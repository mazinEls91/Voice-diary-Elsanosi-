import { useState, useEffect, useCallback } from 'react'
import { getAllEntries, saveEntry, deleteEntry, getEntry } from '../db'
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

  const updateEntry = useCallback(async (id: string, patch: Partial<DiaryEntry>) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)))
    const target = await getEntry(id)
    if (target) await saveEntry({ ...target, ...patch })
  }, [])

  return { entries, loading, add, remove, updateEntry }
}
