import { Badge } from '@/components/ui/badge'
import { ROLE_LABELS, type Role } from '@/constants/roles'

interface RoleBadgeProps {
  role: Role
}

/** Roles are a core/shared concept (constants/roles.ts), not a feature
 * module — unlike StatusBadge, this component is allowed to know the
 * role -> label mapping directly. */
export function RoleBadge({ role }: RoleBadgeProps) {
  return <Badge variant="outline">{ROLE_LABELS[role]}</Badge>
}
