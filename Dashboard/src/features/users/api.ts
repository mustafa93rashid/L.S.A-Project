import { apiClient } from '@/lib/api-client'
import type { ApiEnvelope } from '@/types/api'
import type { Role } from '@/constants/roles'
import type {
  InviteUserPayload,
  User,
  UserFilters,
  UsersPaginated,
} from '@/features/users/types'

export async function getUsers(filters: UserFilters): Promise<UsersPaginated> {
  const response = await apiClient.get<UsersPaginated>('/users', {
    params: {
      search: filters.search || undefined,
      role: filters.role || undefined,
      department: filters.department || undefined,
      isActive: filters.isActive,
      page: filters.page,
      limit: filters.limit,
    },
  })
  return response.data
}

export async function inviteUser(payload: InviteUserPayload): Promise<User> {
  const response = await apiClient.post<ApiEnvelope<User>>('/users', payload)
  if (!response.data.data) throw new Error('Invite response did not include user data.')
  return response.data.data
}

export async function updateUserStatus(id: string, isActive: boolean): Promise<void> {
  await apiClient.patch(`/users/${id}/status`, { isActive })
}

export async function updateUserRole(id: string, role: Role): Promise<void> {
  await apiClient.patch(`/users/${id}/role`, { role })
}

export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`/users/${id}`)
}
