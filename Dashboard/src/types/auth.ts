import type { Role } from '@/constants/roles'

/**
 * Mirrors the whitelisted field projection the backend's `auth` middleware
 * and `GET /auth/me` return (Backend/src/middlewares/auth.js).
 */
export interface AuthUser {
  _id: string
  fullName: string
  email: string
  phone: string | null
  role: Role
  department: string | null
  avatar: {
    url: string | null
    publicId: string | null
  } | null
  isAccountActivated: boolean
  isActive: boolean
}
