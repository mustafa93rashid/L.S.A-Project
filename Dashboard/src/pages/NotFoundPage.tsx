import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'

/** Catch-all for any unmatched URL — standalone (not behind RequireAuth),
 * since a stale bookmark or typo can be hit while signed out too. Links
 * back to "/", which the existing guards then route appropriately
 * (dashboard Overview if signed in, Login if not). */
export default function NotFoundPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-background p-6 text-center">
      <div className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Compass className="size-5" />
      </div>
      <p className="text-lg font-semibold tracking-tight text-foreground">
        Page not found
      </p>
      <p className="max-w-sm text-sm text-muted-foreground">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <Button asChild variant="outline" size="sm" className="mt-2">
        <Link to="/">Back to dashboard</Link>
      </Button>
    </div>
  )
}
