import type { ReactNode } from 'react'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center justify-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-sidebar text-sm font-semibold text-sidebar-foreground">
            L
          </span>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            LSA Dashboard
          </span>
        </div>
        {children}
      </div>
    </div>
  )
}
