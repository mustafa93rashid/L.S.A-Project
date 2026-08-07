import type { Role } from '@/constants/roles'

export interface User {
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
  /** A raw user id, or null for seeded/system-created accounts — verified
   * live against `GET /users`: `user.controller.js`'s `getAllUsers` never
   * calls `.populate('createdBy')`, unlike most other resources' audit
   * fields (see `AuditUser` in `types/api.ts`), so this is genuinely just
   * an id, never a `{fullName, email}` object. Don't "fix" this type to
   * `AuditUser` without re-verifying the backend actually populates it. */
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export interface UserFilters {
  search?: string
  role?: Role
  department?: string
  isActive?: boolean
  page: number
  limit: number
}

/**
 * The backend's getAllUsers response genuinely uses a different shape
 * than every other paginated endpoint (`results`/`currentPage`/
 * `totalUsers`, not `count`/`page`/`total`) — confirmed directly against
 * Backend/src/controllers/user.controller.js. Kept as its own type
 * rather than forcing it into the shared Paginated<T>.
 */
export interface UsersPaginated {
  success: boolean
  results: number
  pagination: {
    currentPage: number
    limit: number
    totalUsers: number
    totalPages: number
  }
  data: User[]
}

export interface InviteUserPayload {
  fullName: string
  email: string
  role: Role
}
