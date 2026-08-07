import { getActionItems, getPageItems } from '@/features/command-palette/registry'
import { searchCommandItems } from '@/features/command-palette/matching'
import type {
  SearchProvider,
  SearchProviderContext,
} from '@/features/command-palette/types'

/**
 * Today's only SearchProvider — searches the static in-memory Pages +
 * Actions registry synchronously, wrapped in a resolved Promise to match
 * the interface a future network-backed provider needs. See
 * `docs/PRODUCTION_CHECKLIST.md`/`types.ts` for why: swapping this for a
 * `backendSearchProvider` once `GET /api/v1/search` exists (it doesn't
 * today — no backend change was made for this feature) is a one-import
 * change in CommandPalette.tsx, nothing else.
 */
export const frontendSearchProvider: SearchProvider = {
  search(query: string, context: SearchProviderContext) {
    const items = [...getPageItems(context.role), ...getActionItems(context.role)]
    return Promise.resolve(searchCommandItems(items, query))
  },
}
