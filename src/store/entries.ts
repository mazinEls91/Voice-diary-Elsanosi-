import { create } from 'zustand'
import type { DiaryEntry, SyncStatus } from '../types'

interface EntriesState {
  entries: DiaryEntry[]
  syncStatuses: Record<string, SyncStatus>
  addEntry: (entry: DiaryEntry) => void
  updateEntry: (id: string, patch: Partial<DiaryEntry>) => void
  deleteEntry: (id: string) => void
  setSyncStatus: (id: string, status: SyncStatus) => void
  setEntries: (entries: DiaryEntry[]) => void
}

export const useEntriesStore = create<EntriesState>((set) => ({
  entries: [],
  syncStatuses: {},

  addEntry: (entry) =>
    set((s) => ({ entries: [entry, ...s.entries] })),

  updateEntry: (id, patch) =>
    set((s) => ({
      entries: s.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    })),

  deleteEntry: (id) =>
    set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),

  setSyncStatus: (id, status) =>
    set((s) => ({ syncStatuses: { ...s.syncStatuses, [id]: status } })),

  setEntries: (entries) => set({ entries }),
}))
