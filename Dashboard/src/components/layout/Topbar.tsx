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
 * The Welcome Banner — the Topbar's signature visual identity now that
 * the route title is gone: a dynamic greeting, a quiet secondary message,
 * and a subtle date/time caption. Its background/border/shadow now live
 * on the Topbar's own `<header>` (following manual refinement — a single
 * merged surface rather than a separately-styled nested panel); this
 * component owns the content and the one decorative accent left inside
 * it, a soft blurred glow kept behind the text via `-z-10`.
 */
function WelcomeBanner() {
  const user = useSessionStore((state) => state.user)
  const now = useCurrentTime()
  const firstName = user?.fullName?.split(' ')[0]

  return (
    <div className=" relative flex min-w-0 flex-1 items-center gap-3 self-stretch overflow-hidden   px-4  sm:gap-4 sm:px-5 lg:px-6">
      {/* Decorative only — a single soft blurred glow, never a literal
          shape, kept behind all content via -z-10. Visible at every
          Topbar width; sized down on narrower screens so it stays
          proportional and never crowds the greeting text. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-8 -right-6 -z-10 size-32 rounded-full  blur-2xl sm:-top-10 sm:-right-8 sm:size-40 sm:blur-3xl lg:-top-12 lg:-right-10 lg:size-48"
      />

      <span
        aria-hidden="true"
        className="hidden h-9 w-px shrink-0 self-center bg-gradient-to-b from-transparent via-primary/25 to-transparent sm:block"
      />

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
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
 * The authenticated shell's floating chrome — and, following manual
 * refinement, the Welcome Banner's surface as well: one premium panel
 * (fully rounded, `bg-welcome-banner`, `border-banner-border`,
 * `shadow-float`, margin on every side so it detaches from the page)
 * rather than a separate nested banner layer.
 *
 * A three-column CSS Grid (`minmax(0,1fr) auto minmax(0,1fr)`) — not
 * flex — is what keeps CommandPalette genuinely centered on the Topbar's
 * full width: both side tracks are forced to the same width regardless
 * of how much the greeting or the notification/avatar cluster actually
 * use, so the center track (and CommandPalette inside it) never drifts
 * off-center the way it would sitting in ordinary flex remaining-space.
 *
 * No route title lives here — each page's own PageHeader/Breadcrumbs
 * already carries that; duplicating it was the old design's mistake. No
 * profile/logout controls live in the Sidebar either; the sole account
 * entry point is the avatar in the right-hand cluster, beside
 * NotificationBell (see ProfileMenu.tsx) — right side stays down to
 * exactly those two controls, nothing else.
 */
export function Topbar({ onOpenMobileNav }: TopbarProps) {
  return (
    <header className="relative z-10 m-2 grid h-24 shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-3 rounded-2xl border border-banner-border bg-welcome-banner p-2 shadow-float sm:m-3 sm:gap-4 sm:p-2.5 lg:m-4 lg:gap-5 lg:p-3">
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

      <div className="hidden items-center justify-center md:flex">
        <CommandPalette />
      </div>

      <div className="flex items-center justify-self-end gap-3 pr-1 sm:gap-4 sm:pr-1.5">
        <NotificationBell />
        <ProfileMenu />
      </div>
    </header>
  )
}
