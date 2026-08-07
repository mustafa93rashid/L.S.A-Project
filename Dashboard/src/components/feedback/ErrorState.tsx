import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
}

/** Query-error presentation — distinct from EmptyState (a failed request,
 * not "zero results"). onRetry typically wires to TanStack Query's
 * `refetch`. */
export function ErrorState({
  title = 'Something went wrong',
  description = 'This data could not be loaded. Please try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-destructive/30 px-6 py-16 text-center">
      <div className="flex size-11 items-center justify-center rounded-xl bg-destructive-subtle text-destructive">
        <AlertTriangle className="size-5" />
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {onRetry ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-2"
        >
          Retry
        </Button>
      ) : null}
    </div>
  )
}
