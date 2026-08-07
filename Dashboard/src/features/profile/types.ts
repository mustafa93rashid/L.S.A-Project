import type { AuditUser } from '@/types/api'
import type { Role } from '@/constants/roles'

export interface ProfileUser {
  _id: string
  fullName: string
  email: string
  phone: string | null
  role: Role
  department: string | null
  avatar: { url: string | null; publicId: string | null }
  isAccountActivated: boolean
  isActive: boolean
  lastLoginAt: string | null
  /** Populated by `userController.getProfile` (`.populate('createdBy', 'fullName email role')`)
   * — unlike `GET /users`, which returns this as a raw, unpopulated id. */
  createdBy?: AuditUser | null
  createdAt: string
  updatedAt: string
}

export interface RequestEmailChangePayload {
  newEmail: string
}

export interface VerifyEmailChangePayload {
  verificationCode: string
}
