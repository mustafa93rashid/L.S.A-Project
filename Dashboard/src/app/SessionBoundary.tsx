import { useEffect, type ReactNode } from 'react'
import { useCurrentUserQuery } from '@/features/auth/queries'
import { useSessionStore } from '@/stores/session.store'

function FullPageLoader() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  )
}

/**
 * Runs GET /auth/me exactly once at app start to hydrate the session store
 * before any route renders — this is what lets RequireAuth/RequireGuest
 * assume `status` is already settled (never 'idle') by the time they run,
 * and what makes "stay logged in across a page reload" work at all, since
 * the access token lives only in an httpOnly cookie the store can't read
 * directly.
 */
export function SessionBoundary({ children }: { children: ReactNode }) {
  const sessionStatus = useSessionStore((state) => state.status)
  const setUser = useSessionStore((state) => state.setUser)
  const clearSession = useSessionStore((state) => state.clearSession)

  const query = useCurrentUserQuery(sessionStatus === 'idle')

  useEffect(() => {
    if (query.status === 'success') {
      setUser(query.data)
    } else if (query.status === 'error') {
      clearSession()
    }
  }, [query.status, query.data, setUser, clearSession])

  const isBootstrapping = sessionStatus === 'idle' && query.status === 'pending'

  if (isBootstrapping) {
    return <FullPageLoader />
  }

  return <>{children}</>
}
