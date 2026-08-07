import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const MAX_RECENT_PAGES = 8

export interface RecentPageEntry {
  path: string
  visitedAt: number
}

interface RecentPagesState {
  byUser: Record<string, RecentPageEntry[]>
  addRecentPage: (userId: string, path: string) => void
}

/**
 * Persisted to localStorage — the first use of it in this codebase,
 * deliberately narrow in what it stores: a path and a timestamp, nothing
 * sensitive. Keyed by user id (`byUser`) rather than one global list, so
 * two different accounts signing into the same browser never see each
 * other's history. `useRecentPages` (the hook, not this store) is the
 * only place that scopes reads/writes to the current session — components
 * should use that, not this store directly.
 */
export const useRecentPagesStore = create<RecentPagesState>()(
  persist(
    (set) => ({
      byUser: {},
      addRecentPage: (userId, path) =>
        set((state) => {
          const existing = state.byUser[userId] ?? []
          const withoutPath = existing.filter((entry) => entry.path !== path)
          const next = [{ path, visitedAt: Date.now() }, ...withoutPath].slice(
            0,
            MAX_RECENT_PAGES,
          )
          return { byUser: { ...state.byUser, [userId]: next } }
        }),
    }),
    { name: 'lsa-dashboard:recent-pages' },
  ),
)
