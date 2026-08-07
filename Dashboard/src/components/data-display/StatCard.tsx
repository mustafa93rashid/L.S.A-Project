import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { StatusTone } from '@/components/data-display/StatusBadge'

interface StatCardProps {
  label: string
  value: string | number
  icon?: LucideIcon
  tone?: StatusTone
}

const TONE_ICON_WRAP: Record<StatusTone, string> = {
  info: 'bg-info-subtle text-info',
  success: 'bg-success-subtle text-success',
  warning: 'bg-warning-subtle text-warning',
  danger: 'bg-destructive-subtle text-destructive',
  neutral: 'bg-accent text-primary',
}

/** Presentational stat/KPI card — Dashboard Home and per-module statistics
 * strips compose these from real numbers only; no business logic lives
 * here. No trend/delta indicator by design: the backend has no historical
 * aggregation to back one honestly. */
export function StatCard({ label, value, icon: Icon, tone = 'neutral' }: StatCardProps) {
  return (
    <Card className="gap-0 py-0">
      <CardContent className="flex items-center justify-between gap-4 px-5 py-5">
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {label}
          </span>
          <span className="text-[1.75rem] leading-none font-semibold tracking-tight text-foreground tabular-nums">
            {value}
          </span>
        </div>
        {Icon ? (
          <div
            className={cn(
              'flex size-11 shrink-0 items-center justify-center rounded-xl',
              TONE_ICON_WRAP[tone],
            )}
          >
            <Icon className="size-5" />
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
