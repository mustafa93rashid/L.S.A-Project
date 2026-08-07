import type { CommandItem } from '@/features/command-palette/types'

/**
 * Pure scoring/matching engine, deliberately kept free of any provider or
 * registry concerns — a future BackendSearchProvider is expected to do its
 * own server-side ranking, but this stays the single implementation any
 * client-side provider (today: frontendSearchProvider) uses, so ranking
 * behavior can't drift between call sites.
 *
 * Rank, highest first: an exact title match, a title that starts with the
 * query, a title with a word that starts with the query (so "requests"
 * matches "Equipment Requests"), a title that merely contains the query
 * anywhere, then the same three tiers again against the item's subtitle/
 * keywords. Case-insensitive throughout; the query is trimmed once by the
 * caller.
 */
const SCORE = {
  exactTitle: 100,
  titleStartsWith: 90,
  titleWordStartsWith: 80,
  titleContains: 60,
  secondaryStartsWith: 50,
  secondaryContains: 30,
} as const

function startsWithWord(haystack: string, needle: string): boolean {
  return haystack.split(/\s+/).some((word) => word.startsWith(needle))
}

/** Returns a match score for `item` against an already-lowercased,
 * already-trimmed `query`, or `null` if it isn't a match at all. */
export function scoreCommandItem(item: CommandItem, query: string): number | null {
  const title = item.title.toLowerCase()

  if (title === query) return SCORE.exactTitle
  if (title.startsWith(query)) return SCORE.titleStartsWith
  if (startsWithWord(title, query)) return SCORE.titleWordStartsWith
  if (title.includes(query)) return SCORE.titleContains

  const secondary = [item.subtitle, ...(item.keywords ?? [])]
    .filter((value): value is string => Boolean(value))
    .join(' ')
    .toLowerCase()

  if (!secondary) return null
  if (startsWithWord(secondary, query)) return SCORE.secondaryStartsWith
  if (secondary.includes(query)) return SCORE.secondaryContains

  return null
}

/** Filters `items` down to whatever matches `query` (partial words,
 * startsWith, contains — all case-insensitive) and sorts best match
 * first. An empty/whitespace-only query returns no results — the palette
 * shows Favorites/Recent instead of a search result list in that state. */
export function searchCommandItems(items: CommandItem[], query: string): CommandItem[] {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return []

  return items
    .map((item) => ({ item, score: scoreCommandItem(item, normalizedQuery) }))
    .filter(
      (result): result is { item: CommandItem; score: number } => result.score !== null,
    )
    .sort((a, b) => b.score - a.score)
    .map((result) => result.item)
}
