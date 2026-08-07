import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'

export interface QuickAction {
  key: string
  label: string
  icon: LucideIcon
  href: string
}

interface QuickActionsProps {
  actions: QuickAction[]
}

/** Permission-gated shortcuts into the Create pages/modules an admin
 * reaches for most often — the Overview shouldn't be a dead end that
 * sends every action back through the sidebar. `actions` is pre-filtered
 * by the caller via the same `hasModuleAccess` every route guard uses. */
export function QuickActions({ actions }: QuickActionsProps) {
  if (actions.length === 0) return null

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-foreground">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.key}
              to={action.href}
              className="group flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-4 transition-all hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                <Icon className="size-4" aria-hidden="true" />
              </div>
              <span className="text-sm font-medium text-foreground">{action.label}</span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
