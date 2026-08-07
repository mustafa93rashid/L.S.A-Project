import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useSessionStore } from '@/stores/session.store'

interface RequireAuthProps {
  children: ReactNode
}

/**
 * By the time this renders, SessionBoundary has already resolved the
 * session bootstrap, so `status` is guaranteed to be either 'authenticated'
 * or 'unauthenticated' — no loading state to handle here.
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const status = useSessionStore((state) => state.status)
  const location = useLocation()

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <>{children}</>
}
