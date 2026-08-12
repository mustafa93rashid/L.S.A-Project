import type { Role } from '@/constants/roles'

export interface UserCreator {
  _id: string
  fullName: string
  email: string
  role: Role
}

export interface User {
  _id: string
  fullName: string
  email: string
  phone: string | null
  role: Role
  department: string | null
  avatar: {
    url: string | null
    publicId: string | null
  }
  isAccountActivated: boolean
  isActive: boolean
  lastLoginAt: string | null
  createdBy: UserCreator | null
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