import { Loader2 } from 'lucide-react'

/** In-content loading state for the dashboard shell's content area — not
 * the whole-app boot gate (that's SessionBoundary's own loader). */
export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
      <Loader2 className="size-5 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  )
}
