import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight, Activity } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { SectionHeader } from '@/components/layout/SectionHeader'
export interface TimelineEntry {
  id: string
  icon: LucideIcon
  tone: 'info' | 'warning' | 'success'
  title: string
  subtitle: string
  date: string
  href?: string
}

interface ActivityTimelineProps {
  entries: TimelineEntry[]
  isLoading: boolean
  emptyMessage: string
}


const TONE_STYLES: Record<TimelineEntry['tone'], { icon: string; indicator: string; label: string }> = {
  info: { icon: 'border-info/15 bg-info-subtle text-info', indicator: 'bg-info', label: 'New activity' },
  warning: { icon: 'border-warning/15 bg-warning-subtle text-warning', indicator: 'bg-warning', label: 'In progress' },
  success: { icon: 'border-success/15 bg-success-subtle text-success', indicator: 'bg-success', label: 'Completed' },
}


function ActivitySkeleton() {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 px-5 py-5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:px-6">
      <Skeleton className="size-11 rounded-xl" />

      <div className="min-w-0">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="mt-2 h-3 w-56 max-w-full" />
      </div>

      <Skeleton className="hidden h-4 w-20 sm:block" />
    </div>
  )
}


export function ActivityTimeline({ entries, isLoading, emptyMessage }: ActivityTimelineProps) {
  return (
    <section className="space-y-5">

      <SectionHeader
        eyebrow="Activity Stream"
        title="Recent Activity"
        description="Latest events across your operational workspace."
        icon={Activity}
        statLabel="Events"
        statValue={entries.length}
        showStat={!isLoading && entries.length > 0}
      />


      <Card className="overflow-hidden rounded-[20px] border-border/70 bg-card p-0 shadow-[0_1px_3px_rgba(0,0,0,0.025)]">
        {isLoading ? (
          <div className="divide-y divide-border/50">
            {Array.from({ length: 5 }).map((_, index) => (
              <ActivitySkeleton key={index} />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex min-h-[220px] items-center justify-center px-6 py-10">
            <div className="max-w-sm text-center">
              <p className="text-sm font-medium text-foreground">No recent activity</p>
              <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{emptyMessage}</p>
            </div>
          </div>
        ) : (
          <ol className="divide-y divide-border/50">
            {entries.map((entry) => {
              const Icon = entry.icon
              const tone = TONE_STYLES[entry.tone]

              const content = (
                <>
                  <div className={cn('relative flex size-10 shrink-0 items-center justify-center rounded-xl border transition-transform duration-200 group-hover:scale-[1.025]', tone.icon)}>
                    <Icon className="size-[17px]" strokeWidth={1.75} aria-hidden="true" />
                    <span aria-hidden="true" className={cn('absolute -right-[3px] -top-[3px] size-2.5 rounded-full border-2 border-card', tone.indicator)} />
                  </div>


                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <h4 className="truncate text-sm font-semibold tracking-tight text-foreground">{entry.title}</h4>
                      <span className="hidden shrink-0 text-[9px] font-semibold tracking-[0.07em] text-muted-foreground/60 uppercase lg:inline">{tone.label}</span>
                    </div>

                    <p className="mt-1 truncate text-xs leading-5 text-muted-foreground">{entry.subtitle}</p>

                    <time dateTime={entry.date} className="mt-1.5 block text-[10px] font-medium text-muted-foreground/65 tabular-nums sm:hidden">
                      {formatDistanceToNow(new Date(entry.date), { addSuffix: true })}
                    </time>
                  </div>


                  <div className="hidden shrink-0 items-center gap-3 sm:flex">
                    <time dateTime={entry.date} className="min-w-[82px] text-right text-[11px] font-medium text-muted-foreground/65 tabular-nums">
                      {formatDistanceToNow(new Date(entry.date), { addSuffix: true })}
                    </time>

                    {entry.href ? (
                      <div className="flex size-8 items-center justify-center rounded-lg border border-transparent text-muted-foreground/35 transition-all duration-200 group-hover:border-border group-hover:bg-background group-hover:text-foreground">
                        <ArrowUpRight className="size-3.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                      </div>
                    ) : null}
                  </div>
                </>
              )


              return (
                <li key={entry.id}>
                  {entry.href ? (
                    <Link to={entry.href} className="group relative grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3.5 px-5 py-3.5 transition-colors duration-150 hover:bg-muted/25 focus-visible:bg-muted/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/20 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:px-5">
                      <span aria-hidden="true" className="absolute bottom-3 left-0 top-3 w-[2px] origin-center scale-y-0 rounded-r-full bg-foreground/55 transition-transform duration-200 group-hover:scale-y-100" />
                      {content}
                    </Link>
                  ) : (
                    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3.5 px-5 py-3.5 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
                      {content}
                    </div>
                  )}
                </li>
              )
            })}
          </ol>
        )}
      </Card>

    </section>
  )
}