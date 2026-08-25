import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import * as api from '@/features/contact-messages/api'

import type {
  ContactMessage,
  ContactMessageFilters,
  ContactMessageStatus,
} from '@/features/contact-messages/types'

// ==================== Query Keys ====================

export const contactMessageKeys = {
  all: ['contactMessages'] as const,

  lists: () =>
    [...contactMessageKeys.all, 'list'] as const,

  list: (filters: ContactMessageFilters) =>
    [...contactMessageKeys.lists(), filters] as const,

  statistics: () =>
    [...contactMessageKeys.all, 'statistics'] as const,
}

// ==================== Cache Shape ====================

type ContactMessageListCache = {
  data: ContactMessage[]
  [key: string]: unknown
}

// ==================== List ====================

export function useContactMessagesQuery(
  filters: ContactMessageFilters,
  enabled = true,
) {
  return useQuery({
    queryKey: contactMessageKeys.list(filters),
    queryFn: () => api.getContactMessages(filters),
    enabled,
  })
}

// ==================== Statistics ====================

export function useContactMessageStatisticsQuery(
  enabled = true,
) {
  return useQuery({
    queryKey: contactMessageKeys.statistics(),
    queryFn: api.getContactMessageStatistics,
    enabled,
  })
}

// ==================== Update Status ====================

export function useUpdateContactMessageStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string
      status: ContactMessageStatus
    }) =>
      api.updateContactMessageStatus(
        id,
        status,
      ),

    onSuccess: async (updatedMessage) => {
      // Update message immediately in every cached list
      queryClient.setQueriesData<ContactMessageListCache>(
        {
          queryKey: contactMessageKeys.lists(),
        },
        (current) => {
          if (!current?.data) {
            return current
          }

          const exists = current.data.some(
            (message) =>
              message._id === updatedMessage._id,
          )

          if (!exists) {
            return current
          }

          return {
            ...current,

            data: current.data.map(
              (message) =>
                message._id === updatedMessage._id
                  ? updatedMessage
                  : message,
            ),
          }
        },
      )

      // Final synchronization
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: contactMessageKeys.lists(),
        }),

        queryClient.invalidateQueries({
          queryKey: contactMessageKeys.statistics(),
        }),
      ])
    },
  })
}

// ==================== Delete ====================

export function useDeleteContactMessageMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      api.deleteContactMessage(id),

    onSuccess: async (_, deletedId) => {
      // Remove immediately from every cached list
      queryClient.setQueriesData<ContactMessageListCache>(
        {
          queryKey: contactMessageKeys.lists(),
        },
        (current) => {
          if (!current?.data) {
            return current
          }

          const exists = current.data.some(
            (message) =>
              message._id === deletedId,
          )

          if (!exists) {
            return current
          }

          return {
            ...current,

            data: current.data.filter(
              (message) =>
                message._id !== deletedId,
            ),
          }
        },
      )

      // Final synchronization
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: contactMessageKeys.lists(),
        }),

        queryClient.invalidateQueries({
          queryKey: contactMessageKeys.statistics(),
        }),
      ])
    },
  })
}