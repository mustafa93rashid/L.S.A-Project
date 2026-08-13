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

  // Deliberately keyed only on `sessionStatus`, not `query.status`: the
  // query flips to 'success'/'error' one render before the effect above
  // has a chance to call setUser/clearSession, so gating on query.status
  // let RequireAuth see a transient `status: 'idle'` and bounce to
  // /login (which then bounces an already-authenticated user back to
  // '/') on every hard refresh of a guarded route.
  const isBootstrapping = sessionStatus === 'idle'

  if (isBootstrapping) {
    return <FullPageLoader />
  }

  return <>{children}</>
}
