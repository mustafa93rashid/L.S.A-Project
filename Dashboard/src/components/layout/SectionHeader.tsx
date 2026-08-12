import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'


interface SectionHeaderProps {
  eyebrow: string
  title: string
  description: string
  icon?: LucideIcon
  statLabel?: string
  statValue?: ReactNode
  showStat?: boolean
}


export function SectionHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  statLabel,
  statValue,
  showStat = true,
}: SectionHeaderProps) {
  return (
    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <span className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          {eyebrow}
        </span>

        <h2 className="mt-1.5 text-[15px] font-semibold tracking-[-0.015em] text-foreground">
          {title}
        </h2>

        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>


      {showStat && Icon && statLabel && statValue !== undefined ? (
        <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-card px-3 py-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-muted/40 text-muted-foreground">
            <Icon className="size-3.5" strokeWidth={1.8} />
          </div>

          <div>
            <p className="text-[9px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
              {statLabel}
            </p>

            <p className="mt-0.5 text-sm font-semibold text-foreground tabular-nums">
              {statValue}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}