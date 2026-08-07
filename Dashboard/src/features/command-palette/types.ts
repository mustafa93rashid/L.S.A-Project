import type { LucideIcon } from 'lucide-react'
import type { NavigateFunction } from 'react-router-dom'
import type { Role } from '@/constants/roles'

export type CommandGroup = 'Pages' | 'Actions'

export interface CommandContext {
  navigate: NavigateFunction
  logout: () => void
}

export interface CommandItem {
  id: string
  title: string
  subtitle?: string
  icon: LucideIcon
  group: CommandGroup
  /** Extra terms this item should also match on, besides its own title —
   * genuine synonyms only (e.g. "Profile" matching "user"), never a
   * hard-coded shortcut to force an unrelated result to appear. */
  keywords?: string[]
  /** The route this item ultimately lands on. Recents/favorites are
   * tracked by path, not by command id — so "Create Project" and the
   * plain "Projects" page both count as having visited /projects. */
  path: string
  /** Whether selecting this item should record `path` into the recent-
   * pages store. Defaults to true — every Page and "Open"/"Create" action
   * genuinely lands on a page worth remembering. The one exception is
   * Logout, which sets this to false: its `path` exists only so it type-
   * checks against `CommandItem`, not because /login is a page anyone
   * wants resurfaced under "Recent". */
  trackRecent?: boolean
  perform: (context: CommandContext) => void
}

export interface SearchProviderContext {
  /** Only items the current role can actually reach are ever returned —
   * mirrors Sidebar.tsx's hasModuleAccess filtering exactly. */
  role: Role | undefined
}

/**
 * Search provider abstraction. Today only `frontendSearchProvider`
 * (providers/frontendSearchProvider.ts) exists — it filters the static
 * in-memory registry (registry.ts) synchronously. A future
 * BackendSearchProvider implementing this exact same interface — e.g.
 * querying a real `/api/v1/search` endpoint once the backend has one —
 * could be swapped in inside CommandPalette.tsx by changing a single
 * import, with no change to the palette's UI, keyboard handling, or
 * grouping logic. The `Promise` return type is deliberate even though
 * today's provider resolves synchronously: it's the contract a network
 *-backed provider will need, decided now so switching providers later
 * never requires touching this interface.
 */
export interface SearchProvider {
  search(query: string, context: SearchProviderContext): Promise<CommandItem[]>
}
