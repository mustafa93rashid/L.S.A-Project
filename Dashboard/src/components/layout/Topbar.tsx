import { Menu } from 'lucide-react'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { NotificationBell } from '@/components/layout/NotificationBell'
import { ProfileMenu } from '@/components/layout/ProfileMenu'
import { CommandPalette } from '@/features/command-palette/CommandPalette'

import { useSessionStore } from '@/stores/session.store'
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

function WelcomeBanner() {
  const user = useSessionStore((state) => state.user)
  const now = useCurrentTime()
  const firstName = user?.fullName?.trim().split(/\s+/)[0]

  return (
    <div className="relative z-20 flex min-w-0 flex-1 items-center">
      <div className="min-w-0">
        <div className="mb-1.5 flex items-center gap-2">
          <span className="h-px w-6 bg-gradient-to-r from-white/70 to-transparent" />

          <span className="text-[10px] font-semibold tracking-[0.22em] text-white/55 uppercase">
            Executive Workspace
          </span>

          <span className="size-1 rounded-full bg-cyan-300/80 shadow-[0_0_12px_rgba(103,232,249,0.9)]" />
        </div>

        <h1 className="truncate text-lg leading-tight font-semibold tracking-[-0.03em] text-white sm:text-xl lg:text-[24px]">
          {getGreeting(now)}

          {firstName ? (
            <>
              <span className="text-white/45">, </span>
              <span className="font-bold text-white">{firstName}</span>
            </>
          ) : null}
        </h1>

        <div className="mt-1.5 hidden items-center gap-2.5 text-xs text-white/45 lg:flex">
          <span>Control center ready</span>

          <span className="h-3 w-px bg-white/15" />

          <time
            dateTime={format(now, "yyyy-MM-dd'T'HH:mm")}
            className="font-medium text-white/65 tabular-nums"
          >
            {format(now, 'EEE, MMM d · h:mm a')}
          </time>
        </div>
      </div>
    </div>
  )
}

function LuxuryBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Deep layered gradient */}
      <div className="absolute inset-0 bg-[linear-gradient(115deg,#03101f_0%,#08213c_38%,#0b3d63_68%,#0c6594_100%)]" />

      {/* Top light sweep */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.055] to-transparent" />

      {/* Left soft light */}
      <div className="absolute -left-24 -top-40 size-[460px] rounded-full bg-blue-400/[0.10] blur-[110px]" />

      {/* Center cyan glow */}
      <div className="absolute left-[46%] top-[-220px] size-[500px] rounded-full bg-cyan-300/[0.08] blur-[120px]" />

      {/* Right blue glow */}
      <div className="absolute -right-28 -top-44 size-[520px] rounded-full bg-sky-400/[0.13] blur-[120px]" />

      {/* Giant cut rings */}
      <div className="absolute -right-24 -top-48 size-[430px] rounded-full border border-white/[0.08]" />

      <div className="absolute -right-6 -top-28 size-[285px] rounded-full border border-white/[0.07]" />

      <div className="absolute right-16 -top-12 size-[170px] rounded-full border border-white/[0.06]" />

      {/* Technical grid */}
      <div
        className="
          absolute inset-0 opacity-[0.035]
          [background-image:linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.6)_1px,transparent_1px)]
          [background-size:42px_42px]
        "
      />

      {/* Micro diagonal lines */}
      <div className="absolute left-[36%] top-[-90px] h-[250px] w-px rotate-[32deg] bg-gradient-to-b from-transparent via-white/[0.14] to-transparent" />

      <div className="absolute left-[40%] top-[-80px] h-[250px] w-px rotate-[32deg] bg-gradient-to-b from-transparent via-white/[0.07] to-transparent" />

      {/* Blueprint geometry */}
      <svg
        viewBox="0 0 700 150"
        preserveAspectRatio="none"
        className="absolute right-[8%] top-0 hidden h-full w-[560px] opacity-[0.13] xl:block"
      >
        <path
          d="M40 -20 L160 72 L90 170"
          fill="none"
          stroke="white"
          strokeWidth="0.8"
        />

        <path
          d="M160 72 L290 -16"
          fill="none"
          stroke="white"
          strokeWidth="0.6"
        />

        <path
          d="M290 -16 L390 70 L320 170"
          fill="none"
          stroke="white"
          strokeWidth="0.7"
        />

        <path
          d="M390 70 L520 -12"
          fill="none"
          stroke="white"
          strokeWidth="0.5"
        />

        <circle cx="160" cy="72" r="4" fill="white" />
        <circle cx="390" cy="70" r="3" fill="white" />
        <circle cx="520" cy="-12" r="3" fill="white" />
      </svg>

      {/* Bottom light rail */}
      <div className="absolute inset-x-20 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-200/30 to-transparent" />

      {/* Glass sheen */}
      <div className="absolute left-[20%] top-0 h-full w-[22%] skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/[0.025] to-transparent" />
    </div>
  )
}

export function Topbar({ onOpenMobileNav }: TopbarProps) {
  return (
    <header className="sticky top-0 z-40 px-2 pt-2 sm:px-3 lg:px-4">
      <div
        className="
          relative
          overflow-hidden
          rounded-[22px]
          border border-white/[0.10]
          shadow-[0_18px_55px_rgba(2,16,31,0.28)]
        "
      >
        <LuxuryBackground />

        {/* Fine luminous border */}
        <div className="pointer-events-none absolute inset-0 z-10 rounded-[22px] ring-1 ring-inset ring-white/[0.05]" />

        <div
          className="
            relative
            z-20
            grid
            min-h-[86px]
            grid-cols-[minmax(0,1fr)_auto]
            items-stretch
            px-3
            sm:px-4
            md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]
            lg:min-h-[92px]
            lg:px-5
          "
        >
          {/* Left Zone */}
          <div className="flex min-w-0 items-center gap-3 py-3 pr-4 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenMobileNav}
              aria-label="Open navigation menu"
              className="
                size-10
                shrink-0
                rounded-xl
                border border-white/[0.10]
                bg-white/[0.06]
                text-white/75
                shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]
                backdrop-blur-xl
                transition-all
                hover:border-white/20
                hover:bg-white/[0.12]
                hover:text-white
                md:hidden
              "
            >
              <Menu className="size-[18px]" />
            </Button>

            <WelcomeBanner />
          </div>

          {/* Center Zone */}
          <div
            className="
              hidden
              items-center
              justify-center
              self-stretch
              border-x
              border-white/[0.09]
              px-6
              md:flex
              lg:px-9
            "
          >
            <div
              className="
                relative
                w-[290px]
                rounded-2xl
                border
                border-white/[0.10]
                bg-white/[0.055]
                p-1
                shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]
                backdrop-blur-xl
                lg:w-[350px]
                xl:w-[410px]
              "
            >
              <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

              <CommandPalette />
            </div>
          </div>

          {/* Right Zone */}
          <div
            className="
              flex
              items-center
              justify-self-end
              self-stretch
              pl-3
              md:w-full
              md:justify-end
              lg:pl-5
            "
          >
            <div
              className="
                flex
                items-center
                gap-2
                rounded-2xl
                border
                border-white/[0.10]
                bg-white/[0.055]
                p-1.5
                shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]
                backdrop-blur-xl
                sm:gap-2.5
              "
            >
              <NotificationBell />

              <div
                aria-hidden="true"
                className="hidden h-7 w-px bg-white/[0.10] sm:block"
              />

              <ProfileMenu />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
