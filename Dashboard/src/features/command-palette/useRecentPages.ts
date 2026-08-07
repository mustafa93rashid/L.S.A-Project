import { useMemo } from 'react'
import { useSessionStore } from '@/stores/session.store'
import {
  useRecentPagesStore,
  type RecentPageEntry,
} from '@/features/command-palette/stores/recentPages.store'
import { getPageItems } from '@/features/command-palette/registry'
import type { CommandItem } from '@/features/command-palette/types'

// A single stable reference for the "no history yet" case — returning a
// fresh `[]` literal from the selector below would make Zustand's
// useSyncExternalStore see a "changed" snapshot on every render (new
// reference, same content) and loop forever re-rendering.
const EMPTY_RECENT_ENTRIES: RecentPageEntry[] = []

interface UseRecentPagesResult {
  /** Newest first, resolved into real Pages CommandItems (icon/title/
   * subtitle) via the same role-filtered list search results use — a
   * path that's no longer reachable (e.g. after a role change) is
   * silently dropped rather than shown as a dead link. Capped at 8 by
   * the store itself. */
  items: CommandItem[]
  /** Records a visit to `path` for the signed-in user. No-ops if no user
   * is signed in (shouldn't happen — the palette only mounts inside
   * RequireAuth — but keeps this hook safe to call unconditionally). */
  recordVisit: (path: string) => void
}

export function useRecentPages(): UseRecentPagesResult {
  const user = useSessionStore((state) => state.user)
  const entries = useRecentPagesStore((state) =>
    user ? (state.byUser[user._id] ?? EMPTY_RECENT_ENTRIES) : EMPTY_RECENT_ENTRIES,
  )
  const addRecentPage = useRecentPagesStore((state) => state.addRecentPage)

  const pageItemsByPath = useMemo(() => {
    const pageItems = getPageItems(user?.role)
    return new Map(pageItems.map((item) => [item.path, item]))
  }, [user?.role])

  const items = useMemo(
    () =>
      entries
        .map((entry) => pageItemsByPath.get(entry.path))
        .filter((item): item is CommandItem => Boolean(item)),
    [entries, pageItemsByPath],
  )

  return {
    items,
    recordVisit: (path) => {
      if (user) addRecentPage(user._id, path)
    },
  }
}
