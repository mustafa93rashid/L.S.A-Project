/**
 * Mirrors the `role` enum on the backend's User model
 * (Backend/src/models/user.model.js) — single source of truth for role
 * literals across the dashboard.
 */
export const ROLES = {
  SUPERADMIN: 'superadmin',
  MANAGER: 'manager',
  EQUIPMENT_MANAGER: 'equipmentManager',
  HR_MANAGER: 'hrManager',
  CONTENT_MANAGER: 'contentManager',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const ROLE_LABELS: Record<Role, string> = {
  [ROLES.SUPERADMIN]: 'Super Admin',
  [ROLES.MANAGER]: 'Manager',
  [ROLES.EQUIPMENT_MANAGER]: 'Equipment Manager',
  [ROLES.HR_MANAGER]: 'HR Manager',
  [ROLES.CONTENT_MANAGER]: 'Content Manager',
}
