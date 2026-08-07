import { Menu } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { NotificationBell } from '@/components/layout/NotificationBell'
import { ProfileMenu } from '@/components/layout/ProfileMenu'
import { useSessionStore } from '@/stores/session.store'
import { CommandPalette } from '@/features/command-palette/CommandPalette'
import { useCurrentTime } from '@/hooks/useCurrentTime'

interface TopbarProps {
  onOpenMobileNav: () => void
}

function getGreeting(date: Date): string {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

/**
 * The greeting content living inside the Topbar's "Structured Control
 * Bar" shell (see Topbar.tsx below): a small "WORKSPACE" eyebrow, the
 * dynamic greeting with the first name in the interactive blue, a quiet
 * secondary message, and a subtle date/time caption. No background,
 * border, or shadow of its own — those live on the Topbar's own
 * <header> now, not on a per-zone surface.
 */
function WelcomeBanner() {
  const user = useSessionStore((state) => state.user)
  const now = useCurrentTime()
  const firstName = user?.fullName?.split(' ')[0]

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4 lg:gap-6">
      <span
        aria-hidden="true"
        className="hidden h-9 w-px shrink-0 self-center bg-border sm:block"
      />

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <span className="text-[10px] font-semibold tracking-wide text-sidebar uppercase">
          Workspace
        </span>

        <p className="truncate text-[21px] leading-tight font-semibold tracking-tight sm:text-2xl">
          <span className="text-foreground">{getGreeting(now)}</span>
          {firstName ? (
            <span className="font-bold text-primary">{`, ${firstName}`}</span>
          ) : null}
        </p>

        <p className="hidden truncate text-[13px] text-muted-foreground sm:block sm:text-sm">
          Welcome back
          <span className="hidden lg:inline">
            {' '}
            — here&rsquo;s your workspace for today.
          </span>
        </p>

        <time
          dateTime={format(now, "yyyy-MM-dd'T'HH:mm")}
          className="hidden items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground/70 uppercase tabular-nums md:flex"
        >
          {format(now, 'EEE, MMM d')}
          <span className="text-muted-foreground/35" aria-hidden="true">
            •
          </span>
          {format(now, 'h:mm a')}
        </time>
      </div>
    </div>
  )
}

/**
 * The authenticated shell's floating chrome, redesigned as a
 * "Structured Control Bar" (see
 * docs/superpowers/specs/2026-08-08-topbar-redesign-design.md): a
 * full-width navy->blue accent rule across the very top (the app's own
 * two-tone brand identity, `--sidebar` -> `--primary`, expressed as a
 * rule rather than a soft gradient wash) sitting on a flat `bg-card`
 * surface, with solid `border-border` dividers marking greeting / search
 * / notification+avatar as visibly distinct zones. Structure and rules
 * carry the "engineering precision" identity here, not blur or texture.
 *
 * A three-column CSS Grid (`minmax(0,1fr) auto minmax(0,1fr)`) — not
 * flex — is what keeps CommandPalette genuinely centered on the Topbar's
 * full width: both side tracks are forced to the same width regardless
 * of how much the greeting or the notification/avatar cluster actually
 * use, so the center track (and CommandPalette inside it) never drifts
 * off-center the way it would sitting in ordinary flex remaining-space.
 * The zone dividers are plain conditional borders on the center/right
 * grid items (`self-stretch` so the border spans the bar's full height),
 * not separate grid columns — simpler, and immune to the "empty column
 * still eats a gap" class of bugs. The two dividers get there
 * differently, though, and that's deliberate: the center wrapper is
 * `hidden` until `md:flex`, so its display toggle already keeps the
 * divider off-screen below `md:` — its `border-l` class can stay
 * unconditional. The right wrapper (Notification/Avatar) is *always*
 * rendered, so its border has to gate itself: `sm:border-l` paired with
 * matching `sm:pl-*`, so no bare border-less gap shows below `sm:`. Do
 * not "simplify" one to match the other — an unconditional `border-l`
 * on the right wrapper would show a divider with nothing to its left
 * below `sm:`.
 *
 * No route title lives here — each page's own PageHeader/Breadcrumbs
 * already carries that. No profile/logout controls live in the Sidebar
 * either; the sole account entry point is the avatar in the right-hand
 * cluster, beside NotificationBell (see ProfileMenu.tsx) — right side
 * stays down to exactly those two controls, nothing else.
 */
export function Topbar({ onOpenMobileNav }: TopbarProps) {
  return (
    <header className="relative z-10 m-2 flex h-24 shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-float sm:m-3 lg:m-4">
      <div
        className="h-1 shrink-0 bg-gradient-to-r from-sidebar to-primary"
        aria-hidden="true"
      />

      <div className="grid flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 p-2 sm:gap-4 sm:p-2.5 lg:gap-5 lg:p-3">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4 lg:gap-5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0 transition-transform duration-200 ease-out active:scale-95 lg:hidden"
            onClick={onOpenMobileNav}
            aria-label="Open navigation"
          >
            <Menu className="size-4" />
          </Button>

          <WelcomeBanner />
        </div>

        <div className="hidden items-center justify-center self-stretch border-l border-border sm:pl-4 lg:pl-5 md:flex">
          <CommandPalette />
        </div>

        <div className="flex items-center justify-self-end gap-3 self-stretch pr-1 sm:gap-4 sm:border-l sm:border-border sm:pl-3 sm:pr-1.5 lg:pl-4">
          <NotificationBell />
          <ProfileMenu />
        </div>
      </div>
    </header>
  )
}
