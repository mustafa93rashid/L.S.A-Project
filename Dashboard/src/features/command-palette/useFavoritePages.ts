import { useMemo } from 'react'
import { useSessionStore } from '@/stores/session.store'
import { useFavoritePagesStore } from '@/features/command-palette/stores/favoritePages.store'
import { getPageItems } from '@/features/command-palette/registry'
import type { CommandItem } from '@/features/command-palette/types'

// Same rationale as EMPTY_RECENT_ENTRIES in useRecentPages.ts — a stable
// reference so an empty favorites list doesn't loop useSyncExternalStore.
const EMPTY_FAVORITE_PATHS: string[] = []

interface UseFavoritePagesResult {
  /** Pinned pages, resolved into real Pages CommandItems the same way
   * useRecentPages resolves its entries — role-filtered, dead pins
   * silently dropped. Pin order (most recently pinned last). */
  items: CommandItem[]
  isFavorite: (path: string) => boolean
  toggleFavorite: (path: string) => void
}

export function useFavoritePages(): UseFavoritePagesResult {
  const user = useSessionStore((state) => state.user)
  const favoritePaths = useFavoritePagesStore((state) =>
    user ? (state.byUser[user._id] ?? EMPTY_FAVORITE_PATHS) : EMPTY_FAVORITE_PATHS,
  )
  const toggleFavoritePage = useFavoritePagesStore((state) => state.toggleFavoritePage)

  const pageItemsByPath = useMemo(() => {
    const pageItems = getPageItems(user?.role)
    return new Map(pageItems.map((item) => [item.path, item]))
  }, [user?.role])

  const items = useMemo(
    () =>
      favoritePaths
        .map((path) => pageItemsByPath.get(path))
        .filter((item): item is CommandItem => Boolean(item)),
    [favoritePaths, pageItemsByPath],
  )

  return {
    items,
    isFavorite: (path) => favoritePaths.includes(path),
    toggleFavorite: (path) => {
      if (user) toggleFavoritePage(user._id, path)
    },
  }
}
