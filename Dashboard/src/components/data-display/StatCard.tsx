import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: number | string
  icon: LucideIcon
  index?: string
  tone?: 'default' | 'info' | 'warning' | 'success' | 'danger'
  className?: string
}

export function StatCard({ label, value, icon: Icon, index, tone = 'default', className = '' }: StatCardProps) {
  const iconStyles = {
    default: 'border-border/70 bg-muted/40 text-muted-foreground',
    info: 'border-info/15 bg-info-subtle text-info',
    warning: 'border-warning/15 bg-warning-subtle text-warning',
    success: 'border-success/15 bg-success-subtle text-success',
    danger: 'border-destructive/15 bg-destructive-subtle text-destructive',
  }

  const hoverStyles = {
    default: 'hover:border-foreground/10',
    info: 'hover:border-info/20',
    warning: 'hover:border-warning/20',
    success: 'hover:border-success/20',
    danger: 'hover:border-destructive/20',
  }

  const indexStyles = {
    default: 'text-foreground/[0.025]',
    info: 'text-info/[0.035]',
    warning: 'text-warning/[0.035]',
    success: 'text-success/[0.035]',
    danger: 'text-destructive/[0.035]',
  }

  const railStyles = {
    default: 'bg-foreground/20',
    info: 'bg-info/40',
    warning: 'bg-warning/40',
    success: 'bg-success/40',
    danger: 'bg-destructive/40',
  }

  const dotStyles = {
    default: 'bg-muted-foreground/40',
    info: 'bg-info',
    warning: 'bg-warning',
    success: 'bg-success',
    danger: 'bg-destructive',
  }

  return (
    <div className={`group relative overflow-hidden rounded-[18px] border border-border/70 bg-card px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.025)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.045)] ${hoverStyles[tone]} ${className}`}>
      {index ? (
        <span aria-hidden="true" className={`pointer-events-none absolute -bottom-5 right-1 select-none text-[76px] leading-none font-semibold tracking-[-0.08em] ${indexStyles[tone]}`}>
          {index}
        </span>
      ) : null}

      <div className="relative flex items-center gap-4">
        <div className={`flex size-11 shrink-0 items-center justify-center rounded-[13px] border ${iconStyles[tone]}`}>
          <Icon className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
        </div>

        <div className="min-w-0">
          <p className="text-[26px] leading-none font-semibold tracking-[-0.04em] text-foreground tabular-nums">{value}</p>

          <div className="mt-2 flex min-w-0 items-center gap-2">
            {tone !== 'default' ? <span className={`size-1.5 shrink-0 rounded-full ${dotStyles[tone]}`} /> : null}

            <p className="truncate text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">{label}</p>
          </div>
        </div>
      </div>

      <div aria-hidden="true" className={`absolute bottom-0 left-5 h-[2px] w-8 rounded-full transition-all duration-300 group-hover:w-12 ${railStyles[tone]}`} />
    </div>
  )
}