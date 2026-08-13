import { NavLink } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useSessionStore } from '@/stores/session.store'
import { useUiStore } from '@/stores/ui.store'
import { hasModuleAccess, MODULES } from '@/constants/permissions'
import { NAV_ITEMS, type NavItem } from '@/constants/navigation'
import { useEquipmentRequestStatisticsQuery } from '@/features/equipment-requests/queries'
import { useJobRequestStatisticsQuery } from '@/features/job-requests/queries'
import { useContactMessageStatisticsQuery } from '@/features/contact-messages/queries'
import { cn } from '@/lib/utils'

interface SidebarProps {
  mobileOpen: boolean
  onMobileOpenChange: (open: boolean) => void
}

interface NavSection {
  group: string | null
  items: NavItem[]
}

/** Real package version, not a hand-typed duplicate — see package.json. */
const DASHBOARD_VERSION = 'v1.0.0'

function groupNavItems(items: NavItem[]): NavSection[] {
  const sections: NavSection[] = []

  for (const item of items) {
    const key = item.group ?? null
    const existing = sections.find((section) => section.group === key)
    if (existing) {
      existing.items.push(item)
    } else {
      sections.push({ group: key, items: [item] })
    }
  }

  return sections
}

/**
 * A single nav row. The active state is deliberately built from three
 * *non-brightness* signals — a left rail, a raised inset surface, and a
 * heavier label weight — rather than one bright fill, per the design
 * direction: attention through shape/depth/contrast, not brightness.
 */
function NavRow({
  item,
  collapsed,
  count,
  onNavigate,
}: {
  item: NavItem
  collapsed: boolean
  count?: number
  onNavigate?: () => void
}) {
  const row = (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      onClick={onNavigate}
      aria-label={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          'group relative flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13px] outline-none transition-[background-color,box-shadow,color] duration-150 ease-out',
          'focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar',
          collapsed && 'justify-center px-0',
          isActive
            ? 'bg-white/[0.055] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_1px_2px_rgba(0,0,0,0.22)]'
            : 'font-medium text-sidebar-foreground/60 hover:bg-white/[0.035] hover:text-sidebar-foreground/90',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive ? (
            <span
              aria-hidden="true"
              className="absolute top-1.5 bottom-1.5 left-0 w-[3px] rounded-full bg-gradient-to-b from-sidebar-primary to-sidebar-primary/45"
            />
          ) : null}
          <span
            className={cn(
              'flex size-7 shrink-0 items-center justify-center rounded-md border transition-colors duration-150 ease-out',
              isActive
                ? 'border-transparent bg-sidebar-primary text-white shadow-[0_1px_3px_rgba(0,0,0,0.35)]'
                : 'border-white/[0.07] bg-white/[0.03] text-sidebar-foreground/45 group-hover:border-white/[0.12] group-hover:bg-white/[0.07] group-hover:text-sidebar-foreground/85',
            )}
          >
            <item.icon className="size-[15px]" strokeWidth={1.75} />
          </span>
          {!collapsed ? (
            <>
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {typeof count === 'number' && count > 0 ? (
                <span
                  className={cn(
                    'ml-auto inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full px-1.5 font-mono text-[10px] font-semibold tabular-nums',
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-white/10 text-sidebar-foreground/55',
                  )}
                >
                  {count > 99 ? '99+' : count}
                </span>
              ) : null}
            </>
          ) : null}
        </>
      )}
    </NavLink>
  )

  if (!collapsed) return row

  return (
    <Tooltip>
      <TooltipTrigger asChild>{row}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={14}>
        {item.label}
        {typeof count === 'number' && count > 0 ? ` · ${count} new` : ''}
      </TooltipContent>
    </Tooltip>
  )
}

function SidebarBrand({ collapsed }: { collapsed: boolean }) {

  return (
    <div
      className={cn(
        'flex h-14 shrink-0 items-center gap-2.5 border-b border-sidebar-border/70 px-3.5',
        collapsed && 'justify-center px-0',
      )}
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-[13px] font-bold text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_1px_2px_rgba(0,0,0,0.35)]">
        L
      </div>
      {!collapsed ? (
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate text-[13px] font-semibold tracking-tight text-white">
            LSA Dashboard
          </span>
          <div className="flex items-center gap-1.5">

            <span className="text-[9.5px] font-medium text-sidebar-foreground/30 tabular-nums">
              {DASHBOARD_VERSION}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function NavList({
  collapsed,
  badgeCountByPath,
  onNavigate,
}: {
  collapsed: boolean
  badgeCountByPath: Record<string, number | undefined>
  onNavigate?: () => void
}) {
  const role = useSessionStore((state) => state.user?.role)
  const items = NAV_ITEMS.filter(
    (item) => !item.module || hasModuleAccess(role, item.module),
  )
  const sections = groupNavItems(items)

  return (
    <nav
      aria-label="Primary"
      className="flex flex-1 flex-col gap-5 overflow-y-auto px-2.5 py-3"
    >
      {sections.map((section) => (
        <div key={section.group ?? 'ungrouped'} className="flex flex-col gap-0.5">
          {section.group && !collapsed ? (
            <div className="mb-1 flex items-center gap-2 px-2.5">
              <span className="text-[10.5px] font-semibold tracking-[0.08em] text-sidebar-foreground/35 uppercase">
                {section.group}
              </span>
              <span className="h-px flex-1 bg-white/[0.06]" aria-hidden="true" />
            </div>
          ) : null}
          {section.items.map((item) => (
            <NavRow
              key={item.path}
              item={item}
              collapsed={collapsed}
              count={badgeCountByPath[item.path]}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}
    </nav>
  )
}

/**
 * Built from scratch as a "premium engineering platform" surface: a
 * layered navy panel (subtle top-to-bottom depth, not flat), an active
 * item signaled by shape/depth/contrast (rail + inset surface + weight),
 * "engineered" icon chips rather than bare Lucide icons, and a floating
 * edge handle instead of a header button for collapse. Badge counts on
 * the Requests items are real per-module "new" counts from the same
 * statistics endpoints Dashboard Overview uses — never fabricated, hidden
 * entirely when zero or not yet loaded.
 *
 * Navigation-focused only — no profile/account block lives here. The
 * account entry point (avatar + Profile/Logout menu) moved to the Topbar;
 * see ProfileMenu.tsx.
 */
export function Sidebar({ mobileOpen, onMobileOpenChange }: SidebarProps) {
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed)
  const toggleSidebar = useUiStore((state) => state.toggleSidebar)
  const role = useSessionStore((state) => state.user?.role)

  const canViewEquipmentRequests = hasModuleAccess(role, MODULES.EQUIPMENT_REQUESTS)
  const canViewJobRequests = hasModuleAccess(role, MODULES.JOB_REQUESTS)
  const canViewContactMessages = hasModuleAccess(role, MODULES.CONTACT_MESSAGES)

  const { data: equipmentRequestStats } = useEquipmentRequestStatisticsQuery(
    canViewEquipmentRequests,
  )
  const { data: jobRequestStats } = useJobRequestStatisticsQuery(canViewJobRequests)
  const { data: contactMessageStats } =
    useContactMessageStatisticsQuery(canViewContactMessages)

  const badgeCountByPath: Record<string, number | undefined> = {
    '/equipment-requests': equipmentRequestStats?.new,
    '/job-requests': jobRequestStats?.new,
    '/contact-messages': contactMessageStats?.new,
  }

  return (
    <>
      {/*
       * Desktop-only wrapper around <aside>, deliberately NOT
       * overflow-hidden. <aside> itself must keep overflow-hidden (it
       * masks nav labels/text as the width transitions between the
       * collapsed and expanded rail), but that same overflow-hidden was
       * clipping the collapse handle below, whose whole design is to
       * straddle the sidebar's right edge. Moving the handle out to this
       * wrapper — rather than deleting overflow-hidden — fixes the
       * clipping without touching the width-transition masking it exists
       * for. The wrapper mirrors <aside>'s own width class (not a
       * hardcoded pixel value) so the handle tracks whichever width is
       * currently active, collapsed or expanded.
       */}
      <div
        className={cn(
          'relative hidden shrink-0 transition-[width] duration-150 ease-out lg:block',
          sidebarCollapsed ? 'w-16' : 'w-64',
        )}
      >
        <aside
          className={cn(
            'flex h-full w-full flex-col overflow-hidden border-r border-sidebar-border text-sidebar-foreground',
            'bg-[linear-gradient(180deg,var(--sidebar)_0%,var(--sidebar-surface-end)_100%)]',
            'shadow-[inset_0_1px_0_rgba(255,255,255,0.04),4px_0_24px_-8px_rgba(15,27,66,0.35)]',
          )}
        >
          <SidebarBrand collapsed={sidebarCollapsed} />
          <NavList collapsed={sidebarCollapsed} badgeCountByPath={badgeCountByPath} />
        </aside>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              // z-20: Topbar's own <header> is `position: relative z-10`
              // and sits just past this same boundary, so the handle needs
              // to clear that to stay on top where the two visually meet.
              className="absolute top-14 -right-4 z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-card transition-[color,box-shadow,transform] duration-150 ease-out hover:scale-105 hover:text-foreground hover:shadow-md active:scale-95 focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="size-4" />
              ) : (
                <ChevronLeft className="size-4" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          </TooltipContent>
        </Tooltip>
      </div>

      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent
          side="left"
          className="w-72 border-none bg-sidebar p-0 text-sidebar-foreground"
          closeButtonClassName="text-sidebar-foreground/65 hover:bg-white/10 hover:text-white"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>LSA Dashboard navigation</SheetTitle>
          </SheetHeader>
          <div className="flex h-full flex-col">
            <SidebarBrand collapsed={false} />
            <NavList
              collapsed={false}
              badgeCountByPath={badgeCountByPath}
              onNavigate={() => onMobileOpenChange(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
