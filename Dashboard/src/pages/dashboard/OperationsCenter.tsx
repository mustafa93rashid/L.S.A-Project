import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export interface OperationsQueue {
  key: string
  label: string
  icon: LucideIcon
  href: string
  total: number
  newCount: number
  inProgress: number
  resolved: number
}

interface OperationsCenterProps {
  queues: OperationsQueue[]
  isLoading: boolean
}

/** A slim 3-segment proportion bar — new/in-progress/resolved as a share
 * of the queue's real total. Purely derived from numbers already on the
 * page; never its own data source. */
function ProportionBar({ queue }: { queue: OperationsQueue }) {
  const { total, newCount, inProgress, resolved } = queue
  if (total === 0) {
    return <div className="h-1.5 w-full rounded-full bg-muted" />
  }

  return (
    <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
      {newCount > 0 ? (
        <div className="bg-info" style={{ width: `${(newCount / total) * 100}%` }} />
      ) : null}
      {inProgress > 0 ? (
        <div className="bg-warning" style={{ width: `${(inProgress / total) * 100}%` }} />
      ) : null}
      {resolved > 0 ? (
        <div className="bg-success" style={{ width: `${(resolved / total) * 100}%` }} />
      ) : null}
    </div>
  )
}

/**
 * "Mission control" — one card, one row per work queue, instead of three
 * separate full-width sections. Every number here is one of the
 * accessible queue's own real statistics fields; this component only
 * arranges them.
 */
export function OperationsCenter({ queues, isLoading }: OperationsCenterProps) {
  if (queues.length === 0) return null

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">Operations Center</h2>
        <span className="text-xs text-muted-foreground">Live queue status</span>
      </div>

      {isLoading ? (
        <div className="flex flex-col divide-y divide-border">
          {queues.map((queue) => (
            <div key={queue.key} className="flex items-center gap-4 px-5 py-4">
              <Skeleton className="size-10 rounded-xl" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-1.5 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {queues.map((queue) => {
            const Icon = queue.icon
            return (
              <li key={queue.key}>
                <Link
                  to={queue.href}
                  className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-accent/40 focus-visible:bg-accent/40 focus-visible:outline-none"
                >
                  <div
                    className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-xl',
                      queue.newCount > 0
                        ? 'bg-info-subtle text-info'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <span className="text-sm font-semibold text-foreground">
                        {queue.label}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {queue.total} total
                      </span>
                    </div>
                    <ProportionBar queue={queue} />
                  </div>

                  <div className="flex shrink-0 items-center gap-3 pl-1">
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums',
                        queue.newCount > 0
                          ? 'bg-info-subtle text-info'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {queue.newCount} new
                    </span>
                    <ChevronRight
                      className="size-4 text-muted-foreground/60"
                      aria-hidden="true"
                    />
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
