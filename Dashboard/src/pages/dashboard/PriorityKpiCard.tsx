import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface PriorityBreakdownEntry {
  label: string
  count: number
}

interface PriorityKpiCardProps {
  total: number
  breakdown: PriorityBreakdownEntry[]
  isLoading: boolean
}

/**
 * The one KPI on the page that outranks every other number — a distinct
 * accent and a bigger number instead of sitting in the same grid cell
 * size as everything else, but otherwise matching the secondary
 * StatCards' own padding and icon-chip size (`py-5`, `size-11`) so it
 * reads as part of the same KPI family rather than a different
 * component. Composed purely from each accessible queue's real `new`
 * count (see DashboardOverviewPage); the "all caught up" state is just
 * as real — total === 0 is a genuine, verifiable state, not a
 * placeholder. When there's nothing pending, a short reassurance line
 * fills the space the breakdown pills would otherwise take; when there
 * is, the pills already carry that context, so no second line is needed.
 */
export function PriorityKpiCard({ total, breakdown, isLoading }: PriorityKpiCardProps) {
  const isClear = total === 0
  const visibleBreakdown = breakdown.filter((entry) => entry.count > 0)

  return (
    <Card className={cn('border-l-4', isClear ? 'border-l-success' : 'border-l-info')}>
      <CardContent className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex size-11 shrink-0 items-center justify-center rounded-xl',
              isClear ? 'bg-success-subtle text-success' : 'bg-info-subtle text-info',
            )}
          >
            {isClear ? (
              <CheckCircle2 className="size-5" aria-hidden="true" />
            ) : (
              <AlertCircle className="size-5" aria-hidden="true" />
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Needs attention
            </span>
            {isLoading ? (
              <Skeleton className="h-9 w-16" />
            ) : (
              <span className="text-4xl leading-none font-semibold tracking-tight text-foreground tabular-nums">
                {total}
              </span>
            )}
          </div>
        </div>

        {visibleBreakdown.length > 0 ? (
          <div className="flex flex-wrap gap-2 sm:justify-end">
            {visibleBreakdown.map((entry) => (
              <span
                key={entry.label}
                className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-foreground"
              >
                <span className="tabular-nums">{entry.count}</span>
                {entry.label}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">
            Nothing pending across your queues right now.
          </span>
        )}
      </CardContent>
    </Card>
  )
}
