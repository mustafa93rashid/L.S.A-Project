import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export interface TimelineEntry {
  id: string
  icon: LucideIcon
  tone: 'info' | 'warning' | 'success'
  title: string
  subtitle: string
  date: string
  href?: string
}

const TONE_CLASSES: Record<TimelineEntry['tone'], string> = {
  info: 'bg-info-subtle text-info',
  warning: 'bg-warning-subtle text-warning',
  success: 'bg-success-subtle text-success',
}

interface ActivityTimelineProps {
  entries: TimelineEntry[]
  isLoading: boolean
  emptyMessage: string
}

/**
 * One chronological feed mixing every accessible module's real recent
 * items, instead of three separate "recent N" lists — sorted purely by
 * each item's own `createdAt`. Built entirely from data already fetched
 * for the (now-retired) per-module lists, so this adds no new requests.
 */
export function ActivityTimeline({
  entries,
  isLoading,
  emptyMessage,
}: ActivityTimelineProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 py-5">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Recent Activity</h2>

        {isLoading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton className="size-7 shrink-0 rounded-full" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <ol className="flex flex-col">
            {entries.map((entry, index) => {
              const Icon = entry.icon
              const isLast = index === entries.length - 1
              const content = (
                <>
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        'flex size-7 shrink-0 items-center justify-center rounded-full',
                        TONE_CLASSES[entry.tone],
                      )}
                    >
                      <Icon className="size-3.5" aria-hidden="true" />
                    </span>
                    {!isLast ? <span className="w-px flex-1 bg-border" /> : null}
                  </div>
                  <div
                    className={cn(
                      'flex min-w-0 flex-1 flex-col gap-0.5',
                      isLast ? 'pb-0' : 'pb-5',
                    )}
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                      <span className="truncate text-sm font-medium text-foreground">
                        {entry.title}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {formatDistanceToNow(new Date(entry.date), { addSuffix: true })}
                      </span>
                    </div>
                    <span className="truncate text-xs text-muted-foreground">
                      {entry.subtitle}
                    </span>
                  </div>
                </>
              )

              return (
                <li key={entry.id} className="flex gap-3">
                  {entry.href ? (
                    <Link
                      to={entry.href}
                      className="flex flex-1 gap-3 rounded-md transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div className="flex flex-1 gap-3">{content}</div>
                  )}
                </li>
              )
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
