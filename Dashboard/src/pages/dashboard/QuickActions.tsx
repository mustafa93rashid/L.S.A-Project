import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight } from 'lucide-react'

export interface QuickAction {
  key: string
  label: string
  icon: LucideIcon
  href: string
}

interface QuickActionsProps {
  actions: QuickAction[]
}

export function QuickActions({ actions }: QuickActionsProps) {
  if (actions.length === 0) return null

  return (
    <section>
      {/* =====================================================
          Header
      ===================================================== */}

      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Shortcuts
          </span>

          <h3 className="mt-1.5 text-[15px] font-semibold tracking-[-0.015em] text-foreground">
            Quick Actions
          </h3>

          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Jump directly to frequently used workspace actions.
          </p>
        </div>

        <span className="hidden shrink-0 text-[11px] font-medium text-muted-foreground/60 tabular-nums sm:block">
          {actions.length} available
        </span>
      </div>

      {/* =====================================================
          Compact Action Grid
      ===================================================== */}

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        {actions.map((action, index) => {
          const Icon = action.icon

          return (
            <Link
              key={action.key}
              to={action.href}
              className="
                group
                relative
                isolate
                flex
                min-h-[88px]
                items-center
                gap-3.5
                overflow-hidden
                rounded-2xl
                border
                border-border/70
                bg-card
                px-4
                py-3.5
                transition-all
                duration-200
                hover:-translate-y-px
                hover:border-foreground/15
                hover:shadow-[0_6px_20px_rgba(0,0,0,0.045)]
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-ring/20
              "
            >
              {/* Background number */}
              <span
                aria-hidden="true"
                className="
                  pointer-events-none
                  absolute
                  -bottom-3
                  right-2
                  -z-10
                  select-none
                  text-[58px]
                  leading-none
                  font-bold
                  tracking-[-0.08em]
                  text-foreground/[0.025]
                  transition-all
                  duration-300
                  group-hover:-translate-x-1
                  group-hover:text-foreground/[0.04]
                "
              >
                {String(index + 1).padStart(2, '0')}
              </span>

              {/* Icon */}
              <div
                className="
                  flex
                  size-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-border/80
                  bg-muted/35
                  text-muted-foreground
                  transition-all
                  duration-200
                  group-hover:border-foreground/10
                  group-hover:bg-foreground
                  group-hover:text-background
                "
              >
                <Icon
                  className="size-[17px]"
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold tracking-tight text-foreground">
                  {action.label}
                </p>

                <div className="mt-1.5 flex items-center gap-2">
                  <span
                    className="
                      h-px
                      w-3
                      bg-border
                      transition-all
                      duration-200
                      group-hover:w-5
                      group-hover:bg-foreground/30
                    "
                  />

                  <span className="text-[9px] font-semibold tracking-[0.1em] text-muted-foreground/55 uppercase">
                    Open
                  </span>
                </div>
              </div>

              {/* Arrow */}
              <div
                className="
                  flex
                  size-7
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  text-muted-foreground/40
                  transition-all
                  duration-200
                  group-hover:bg-muted/60
                  group-hover:text-foreground
                "
              >
                <ArrowUpRight
                  className="
                    size-3.5
                    transition-transform
                    duration-200
                    group-hover:-translate-y-0.5
                    group-hover:translate-x-0.5
                  "
                  aria-hidden="true"
                />
              </div>

              {/* Bottom interaction rail */}
              <span
                aria-hidden="true"
                className="
                  absolute
                  bottom-0
                  left-4
                  h-[2px]
                  w-0
                  rounded-full
                  bg-foreground/60
                  transition-all
                  duration-300
                  group-hover:w-8
                "
              />
            </Link>
          )
        })}
      </div>
    </section>
  )
}
