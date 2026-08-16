import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { GlobalQuickActions } from '@/components/layout/GlobalQuickActions'

/**
 * The authenticated app shell. Mounted once by a layout route wrapped in
 * RequireAuth (see router.tsx) — every dashboard page nests under this via
 * <Outlet />, so auth guarding happens exactly once here rather than being
 * repeated per page. Topbar renders CommandPalette itself (it's anchored
 * to the Topbar's own search field), so there's nothing else to mount here
 * for it.
 */
export function DashboardLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="flex h-svh bg-background">
      <Sidebar mobileOpen={mobileNavOpen} onMobileOpenChange={setMobileNavOpen} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>
            <GlobalQuickActions />

    </div>
  )
}
