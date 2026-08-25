import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import * as api from '@/features/users/api'

import type { Role } from '@/constants/roles'

import type {
  InviteUserPayload,
  User,
  UserFilters,
} from '@/features/users/types'

// ==================== Query Keys ====================

export const userKeys = {
  all: ['users'] as const,

  lists: () =>
    [...userKeys.all, 'list'] as const,

  list: (filters: UserFilters) =>
    [...userKeys.lists(), filters] as const,
}

// ==================== Cache Shape ====================

type UserListCache = {
  data: User[]
  [key: string]: unknown
}

// ==================== Query ====================

export function useUsersQuery(
  filters: UserFilters,
  enabled = true,
) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => api.getUsers(filters),
    enabled,
  })
}

// ==================== Invite User ====================

export function useInviteUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: InviteUserPayload) =>
      api.inviteUser(payload),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: userKeys.lists(),
      })
    },
  })
}

// ==================== Update Status ====================

export function useUpdateUserStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      isActive,
    }: {
      id: string
      isActive: boolean
    }) =>
      api.updateUserStatus(id, isActive),

    onSuccess: async (
      _,
      { id, isActive },
    ) => {
      queryClient.setQueriesData<UserListCache>(
        {
          queryKey: userKeys.lists(),
        },
        (current) => {
          if (!current?.data) {
            return current
          }

          return {
            ...current,

            data: current.data.map((user) =>
              user._id === id
                ? {
                    ...user,
                    isActive,
                  }
                : user,
            ),
          }
        },
      )

      await queryClient.invalidateQueries({
        queryKey: userKeys.lists(),
      })
    },
  })
}

// ==================== Update Role ====================

export function useUpdateUserRoleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      role,
    }: {
      id: string
      role: Role
    }) =>
      api.updateUserRole(id, role),

    onSuccess: async (
      _,
      { id, role },
    ) => {
      queryClient.setQueriesData<UserListCache>(
        {
          queryKey: userKeys.lists(),
        },
        (current) => {
          if (!current?.data) {
            return current
          }

          return {
            ...current,

            data: current.data.map((user) =>
              user._id === id
                ? {
                    ...user,
                    role,
                  }
                : user,
            ),
          }
        },
      )

      await queryClient.invalidateQueries({
        queryKey: userKeys.lists(),
      })
    },
  })
}

// ==================== Delete User ====================

export function useDeleteUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      api.deleteUser(id),

    onSuccess: async (_, deletedId) => {
      queryClient.setQueriesData<UserListCache>(
        {
          queryKey: userKeys.lists(),
        },
        (current) => {
          if (!current?.data) {
            return current
          }

          return {
            ...current,

            data: current.data.filter(
              (user) =>
                user._id !== deletedId,
            ),
          }
        },
      )

      await queryClient.invalidateQueries({
        queryKey: userKeys.lists(),
      })
    },
  })
}