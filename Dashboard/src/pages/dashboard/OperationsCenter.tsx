import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight } from 'lucide-react'

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

function QueueDistribution({ queue }: { queue: OperationsQueue }) {
  const total = queue.total || 1

  const newWidth = (queue.newCount / total) * 100
  const progressWidth = (queue.inProgress / total) * 100
  const resolvedWidth = (queue.resolved / total) * 100

  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
      {queue.newCount > 0 ? (
        <div
          className="bg-info transition-[width] duration-500"
          style={{ width: `${newWidth}%` }}
        />
      ) : null}

      {queue.inProgress > 0 ? (
        <div
          className="bg-warning transition-[width] duration-500"
          style={{ width: `${progressWidth}%` }}
        />
      ) : null}

      {queue.resolved > 0 ? (
        <div
          className="bg-success transition-[width] duration-500"
          style={{ width: `${resolvedWidth}%` }}
        />
      ) : null}
    </div>
  )
}

function Metric({
  label,
  value,
  dotClass,
}: {
  label: string
  value: number
  dotClass: string
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <span className={cn('size-1.5 rounded-full', dotClass)} />

        <span className="text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          {label}
        </span>
      </div>

      <p className="mt-1.5 pl-3.5 text-xl font-semibold tracking-[-0.03em] text-foreground tabular-nums">
        {value}
      </p>
    </div>
  )
}

function OperationsSkeleton() {
  return (
    <div className="overflow-hidden rounded-[22px] border border-border/70 bg-card">
      <div className="grid gap-0 lg:grid-cols-[220px_minmax(0,1fr)_300px]">
        <div className="border-b border-border/60 p-6 lg:border-r lg:border-b-0">
          <Skeleton className="size-12 rounded-2xl" />
          <Skeleton className="mt-7 h-5 w-32" />
          <Skeleton className="mt-2 h-3 w-20" />
        </div>

        <div className="border-b border-border/60 p-6 lg:border-r lg:border-b-0">
          <Skeleton className="h-2 w-full rounded-full" />

          <div className="mt-8 grid grid-cols-3 gap-6">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        </div>

        <div className="flex items-center justify-between p-6">
          <div>
            <Skeleton className="h-9 w-16" />
            <Skeleton className="mt-2 h-3 w-12" />
          </div>

          <Skeleton className="size-10 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export function OperationsCenter({
  queues,
  isLoading,
}: OperationsCenterProps) {
  if (queues.length === 0) return null

  return (
    <section className="space-y-5">
      {/* Section heading */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            Operations
          </p>

          <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-foreground">
            Operational workload
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            A consolidated view of current requests, active work, and completed items.
          </p>
        </div>

        <span className="hidden text-[11px] font-medium text-muted-foreground/70 sm:block">
          {queues.length} operational queue{queues.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Queues */}
      <div className="space-y-4">
        {isLoading
          ? queues.map((queue) => <OperationsSkeleton key={queue.key} />)
          : queues.map((queue, index) => {
              const Icon = queue.icon

              return (
                <article
                  key={queue.key}
                  className="
                    group
                    relative
                    overflow-hidden
                    rounded-[22px]
                    border
                    border-border/70
                    bg-card
                    shadow-[0_1px_3px_rgba(0,0,0,0.025)]
                    transition-all
                    duration-200
                    hover:border-border
                    hover:shadow-[0_10px_40px_rgba(0,0,0,0.055)]
                  "
                >
                  {/* subtle queue number */}
                  <span
                    aria-hidden="true"
                    className="
                      pointer-events-none
                      absolute
                      -right-2
                      -top-7
                      select-none
                      text-[92px]
                      font-bold
                      tracking-[-0.08em]
                      text-foreground/[0.025]
                      tabular-nums
                    "
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  <div className="grid lg:grid-cols-[240px_minmax(0,1fr)_280px]">
                    {/* =====================================================
                        Identity
                    ===================================================== */}

                    <div
                      className="
                        relative
                        flex
                        items-center
                        gap-4
                        border-b
                        border-border/60
                        p-5
                        sm:p-6
                        lg:flex-col
                        lg:items-start
                        lg:justify-between
                        lg:border-r
                        lg:border-b-0
                      "
                    >
                      <div
                        className={cn(
                          `
                            flex
                            size-12
                            shrink-0
                            items-center
                            justify-center
                            rounded-[14px]
                            border
                          `,
                          queue.newCount > 0
                            ? 'border-info/15 bg-info-subtle text-info'
                            : 'border-border bg-muted/40 text-muted-foreground',
                        )}
                      >
                        <Icon
                          className="size-5"
                          strokeWidth={1.7}
                          aria-hidden="true"
                        />
                      </div>

                      <div className="min-w-0 flex-1 lg:mt-7">
                        <p className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                          Queue
                        </p>

                        <h3 className="mt-1 truncate text-[15px] font-semibold tracking-tight text-foreground">
                          {queue.label}
                        </h3>
                      </div>
                    </div>

                    {/* =====================================================
                        Operational metrics
                    ===================================================== */}

                    <div className="border-b border-border/60 p-5 sm:p-6 lg:border-r lg:border-b-0">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">
                            Workload distribution
                          </p>
                        </div>

                        <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                          {queue.total > 0
                            ? Math.round((queue.resolved / queue.total) * 100)
                            : 0}
                          % resolved
                        </span>
                      </div>

                      <div className="mt-4">
                        <QueueDistribution queue={queue} />
                      </div>

                      <div className="mt-7 grid grid-cols-3 gap-5">
                        <Metric
                          label="New"
                          value={queue.newCount}
                          dotClass="bg-info"
                        />

                        <Metric
                          label="In progress"
                          value={queue.inProgress}
                          dotClass="bg-warning"
                        />

                        <Metric
                          label="Resolved"
                          value={queue.resolved}
                          dotClass="bg-success"
                        />
                      </div>
                    </div>

                    {/* =====================================================
                        Total / action
                    ===================================================== */}

                    <Link
                      to={queue.href}
                      className="
                        group/action
                        flex
                        items-center
                        justify-between
                        gap-6
                        p-5
                        transition-colors
                        hover:bg-muted/30
                        focus-visible:bg-muted/30
                        focus-visible:outline-none
                        sm:p-6
                      "
                    >
                      <div>
                        <p className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                          Total workload
                        </p>

                        <div className="mt-1.5 flex items-end gap-2">
                          <span className="text-[34px] leading-none font-semibold tracking-[-0.05em] text-foreground tabular-nums">
                            {queue.total}
                          </span>

                          <span className="pb-0.5 text-xs text-muted-foreground">
                            items
                          </span>
                        </div>

                        <p className="mt-3 text-xs font-medium text-muted-foreground transition-colors group-hover/action:text-foreground">
                          Open queue
                        </p>
                      </div>

                      <div
                        className="
                          flex
                          size-10
                          shrink-0
                          items-center
                          justify-center
                          rounded-xl
                          border
                          border-border
                          bg-background
                          text-muted-foreground
                          transition-all
                          duration-200
                          group-hover/action:border-foreground/15
                          group-hover/action:text-foreground
                          group-hover/action:shadow-sm
                        "
                      >
                        <ArrowUpRight
                          className="
                            size-[17px]
                            transition-transform
                            duration-200
                            group-hover/action:-translate-y-0.5
                            group-hover/action:translate-x-0.5
                          "
                          aria-hidden="true"
                        />
                      </div>
                    </Link>
                  </div>
                </article>
              )
            })}
      </div>
    </section>
  )
}
