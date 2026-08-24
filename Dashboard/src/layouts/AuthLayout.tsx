import type { ReactNode } from 'react'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background p-4">

      {/* Background Effects */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        {/* Top Glow */}
        <div className="absolute top-[-180px] left-1/2 h-[350px] w-[600px] -translate-x-1/2 rounded-full bg-primary/[0.08] blur-[100px]" />

        {/* Side Glow */}
        <div className="absolute right-[-150px] bottom-[-150px] size-[350px] rounded-full bg-primary/[0.05] blur-[100px]" />

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <div className="relative z-10 flex w-full max-w-sm flex-col gap-7">

        {/* Brand */}
        <div className="group flex flex-col items-center">

{/* Logo */}
<div className="group relative mb-4 overflow-hidden">
  <div className="relative flex size-[72px] items-center justify-center">
    <img
      src="/Logo.svg"
      alt="LSA Logo"
      className="h-full w-full object-contain drop-shadow-sm"
    />

    <div
      className="
        pointer-events-none
        absolute
        -top-10
        -left-16
        h-32
        w-8
        rotate-[25deg]
        bg-white/30
        blur-md
        transition-all
        duration-1000
        group-hover:left-28
      "
    />
  </div>
</div>

          {/* Title */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2">
              <h1 className="text-[19px] font-semibold tracking-[-0.02em] text-foreground">
                LSA Dashboard
              </h1>

              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-30" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
            </div>

            <div className="mt-1.5 flex items-center gap-2">
              <span className="h-px w-5 bg-border" />

              <span className="text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                Engineering Services
              </span>

              <span className="h-px w-5 bg-border" />
            </div>
          </div>
        </div>

        {/* Auth Content */}
        <div className="relative">
          {/* Subtle card glow */}
          <div className="absolute -inset-3 -z-10 rounded-[28px] bg-primary/[0.025] blur-2xl" />

          {children}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground/60">
          <span className="size-1 rounded-full bg-emerald-500/70" />
          <span>Secure Administration Portal</span>
        </div>
      </div>
    </div>
  )
}