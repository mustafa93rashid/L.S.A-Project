import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useSessionStore } from '@/stores/session.store'
import type { Role } from '@/constants/roles'

interface RequireRoleProps {
  roles: Role[]
  children: ReactNode
}

/**
 * Role-based guard, mirroring the backend's `role([...allowedRoles])`
 * middleware directly. Expected to be nested inside `RequireAuth` (so
 * `user` is non-null in practice). Every restricted dashboard route reads
 * its allowed roles from `MODULE_ROLES` (constants/permissions.ts) — the
 * same map the sidebar filters against — so route protection and sidebar
 * visibility can never disagree.
 */
export function RequireRole({ roles, children }: RequireRoleProps) {
  const user = useSessionStore((state) => state.user)

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
