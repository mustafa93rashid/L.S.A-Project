import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useSessionStore } from '@/stores/session.store'

interface RequireGuestProps {
  children: ReactNode
}

/** For login/forgot-password/reset-password/activate-account — an already
 * authenticated user shouldn't see these. */
export function RequireGuest({ children }: RequireGuestProps) {
  const status = useSessionStore((state) => state.status)

  if (status === 'authenticated') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
