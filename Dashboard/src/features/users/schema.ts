import { z } from 'zod'
import { ROLES } from '@/constants/roles'

/** Mirrors Backend/src/validation/user.validate.js's `allowedRoles` — all
 * 5 roles are assignable when inviting a new user. */
export const INVITABLE_ROLES = [
  ROLES.SUPERADMIN,
  ROLES.MANAGER,
  ROLES.EQUIPMENT_MANAGER,
  ROLES.HR_MANAGER,
  ROLES.CONTENT_MANAGER,
] as const

/**
 * Mirrors the backend's `updateUserRole` controller's allow-list
 * (Backend/src/controllers/user.controller.js). Previously narrower than
 * `allowedRoles` above — the controller had its own stale, separate
 * 4-role array that excluded "manager", even though the model enum, the
 * shared validation `allowedRoles`, and the invite flow all already
 * supported it. Fixed backend-side (with explicit approval) to include
 * "manager", so this now matches `allowedRoles` exactly — kept as its
 * own constant since it mirrors a distinct backend list, not because the
 * two are expected to diverge again.
 */
export const ROLE_CHANGE_ROLES = [
  ROLES.SUPERADMIN,
  ROLES.MANAGER,
  ROLES.EQUIPMENT_MANAGER,
  ROLES.HR_MANAGER,
  ROLES.CONTENT_MANAGER,
] as const

export const inviteUserSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, 'Full name must be at least 3 characters.')
    .max(100, 'Full name must be at most 100 characters.'),
  email: z.string().trim().email('Enter a valid email address.'),
  role: z.enum(INVITABLE_ROLES, { message: 'Select a role.' }),
})

export type InviteUserInput = z.infer<typeof inviteUserSchema>
