import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, type LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'


interface PriorityBreakdownEntry {
  label: string
  count: number
  icon: LucideIcon
}


interface PriorityKpiCardProps {
  total: number
  breakdown: PriorityBreakdownEntry[]
  isLoading: boolean
}


function AnimatedCounter({ value, duration = 1500 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const startValue = displayValue
    const difference = value - startValue
    const startTime = performance.now()

    let animationFrame: number

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = 1 - Math.pow(1 - progress, 3)

      setDisplayValue(Math.round(startValue + difference * easedProgress))

      if (progress < 1) animationFrame = requestAnimationFrame(animate)
    }

    animationFrame = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationFrame)
  }, [value])

  return <span className="tabular-nums">{displayValue}</span>
}


export function PriorityKpiCard({ total, breakdown, isLoading }: PriorityKpiCardProps) {
  const isClear = total === 0
  const visibleBreakdown = breakdown.filter((entry) => entry.count > 0)

  return (
    <Card className={cn('relative overflow-hidden rounded-[20px] border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.025)]', isClear ? 'border-success/20' : 'border-info/20')}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className={cn('absolute -right-16 -top-24 size-[220px] rounded-full blur-[75px]', isClear ? 'bg-success/[0.05]' : 'bg-info/[0.05]')} />
        <div className={cn('absolute bottom-0 left-0 h-[2px] w-[28%] rounded-r-full', isClear ? 'bg-success/65' : 'bg-info/65')} />
      </div>


      <div className="relative z-10 grid gap-5 px-5 py-3.5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-7">
        <div className="flex min-w-0 items-center gap-3.5">
          <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl border', isClear ? 'border-success/15 bg-success-subtle text-success' : 'border-info/15 bg-info-subtle text-info')}>
            {isClear ? (
              <CheckCircle2 className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
            ) : (
              <AlertCircle className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
            )}
          </div>


          <div className="flex min-w-0 items-center gap-3">
            {isLoading ? (
              <Skeleton className="h-9 w-16 rounded-lg" />
            ) : (
              <span className="text-[38px] leading-none font-semibold tracking-[-0.05em] text-foreground">
                <AnimatedCounter value={total} />
              </span>
            )}

            <div className="min-w-0">
              <h3 className="text-sm font-semibold tracking-tight text-foreground">
                {isClear ? 'All queues are clear' : 'Items need attention'}
              </h3>

              <p className="mt-0.5 hidden text-[11px] text-muted-foreground sm:block">
                {isClear ? 'No pending items across your operational queues.' : 'Review outstanding items across your active queues.'}
              </p>
            </div>
          </div>
        </div>


        {!isLoading && visibleBreakdown.length > 0 ? (
          <div className="grid grid-cols-1 overflow-hidden rounded-xl border border-border/70 bg-background/65 sm:grid-cols-3 lg:min-w-[440px]">
            {visibleBreakdown.map((entry, index) => {
              const Icon = entry.icon

              return (
                <div key={entry.label} className={cn('flex min-w-0 items-center gap-3 px-3.5 py-2.5', index > 0 && 'border-t border-border/60 sm:border-t-0 sm:border-l')}>
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-info/10 bg-info-subtle text-info">
                    <Icon className="size-4" strokeWidth={1.8} aria-hidden="true" />
                  </div>

                  <div className="min-w-0">
                    <span className="block text-lg leading-none font-semibold tracking-[-0.03em] text-foreground tabular-nums">
                      {entry.count}
                    </span>

                    <span className="mt-1 block truncate text-[9px] font-medium text-muted-foreground">
                      {entry.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : isLoading ? (
          <div className="flex gap-2">
            <Skeleton className="h-12 w-28 rounded-xl" />
            <Skeleton className="h-12 w-28 rounded-xl" />
            <Skeleton className="h-12 w-28 rounded-xl" />
          </div>
        ) : (
          <div className="rounded-xl border border-success/15 bg-success-subtle/40 px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-success" strokeWidth={1.8} aria-hidden="true" />
              <span className="text-[11px] font-medium text-foreground">Nothing pending across your queues.</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}