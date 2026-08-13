import { ListTree } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SectionNavItem {
  id: string
  label: string
}

interface SectionNavProps {
  items: SectionNavItem[]
  title?: string
  className?: string
}

export function SectionNav({
  items,
  title = 'Sections',
  className,
}: SectionNavProps) {
  const handleNavigate = (id: string) => {
    const section = document.getElementById(id)

    if (!section) return

    section.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  return (
    <nav
      aria-label={title}
      className={cn(
        'overflow-hidden rounded-[20px] border border-border/70 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.025)]',
        className,
      )}
    >
      <div className="border-b border-border/60 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/30 text-muted-foreground">
            <ListTree className="size-4" strokeWidth={1.8} />
          </div>

          <div className="min-w-0">
            <p className="text-[9px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              Navigation
            </p>

            <h3 className="mt-0.5 truncate text-[12px] font-semibold tracking-[-0.01em] text-foreground">
              {title}
            </h3>
          </div>
        </div>
      </div>

      <div className="p-2">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleNavigate(item.id)}
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-150 hover:bg-muted/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20"
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background text-[9px] font-semibold text-muted-foreground tabular-nums transition-colors group-hover:border-foreground/10 group-hover:text-foreground">
              {String(index + 1).padStart(2, '0')}
            </span>

            <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-muted-foreground transition-colors group-hover:text-foreground">
              {item.label}
            </span>

            <span
              aria-hidden="true"
              className="size-1 shrink-0 rounded-full bg-border transition-all duration-150 group-hover:bg-foreground/50"
            />
          </button>
        ))}
      </div>

      <div className="border-t border-border/50 bg-muted/[0.08] px-4 py-3">
        <p className="text-[9px] leading-4 text-muted-foreground/60">
          Select a section to navigate through the form.
        </p>
      </div>
    </nav>
  )
}