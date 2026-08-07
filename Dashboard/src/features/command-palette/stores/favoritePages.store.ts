import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface FavoritePagesState {
  byUser: Record<string, string[]>
  toggleFavoritePage: (userId: string, path: string) => void
}

/**
 * Persisted to localStorage, keyed by user id — same per-user scoping
 * rationale as `recentPages.store.ts`. Stores pinned page paths only, in
 * pin order (most recently pinned last). `useFavoritePages` is the only
 * place that should read/write this scoped to the current session.
 */
export const useFavoritePagesStore = create<FavoritePagesState>()(
  persist(
    (set) => ({
      byUser: {},
      toggleFavoritePage: (userId, path) =>
        set((state) => {
          const existing = state.byUser[userId] ?? []
          const next = existing.includes(path)
            ? existing.filter((favoritePath) => favoritePath !== path)
            : [...existing, path]
          return { byUser: { ...state.byUser, [userId]: next } }
        }),
    }),
    { name: 'lsa-dashboard:favorite-pages' },
  ),
)
