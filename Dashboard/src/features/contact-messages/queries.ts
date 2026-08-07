import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/features/contact-messages/api'
import type {
  ContactMessageFilters,
  ContactMessageStatus,
} from '@/features/contact-messages/types'

export const contactMessageKeys = {
  all: ['contactMessages'] as const,
  list: (filters: ContactMessageFilters) =>
    [...contactMessageKeys.all, 'list', filters] as const,
  statistics: () => [...contactMessageKeys.all, 'statistics'] as const,
}

export function useContactMessagesQuery(filters: ContactMessageFilters, enabled = true) {
  return useQuery({
    queryKey: contactMessageKeys.list(filters),
    queryFn: () => api.getContactMessages(filters),
    enabled,
  })
}

export function useContactMessageStatisticsQuery(enabled = true) {
  return useQuery({
    queryKey: contactMessageKeys.statistics(),
    queryFn: api.getContactMessageStatistics,
    enabled,
  })
}

export function useUpdateContactMessageStatusMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ContactMessageStatus }) =>
      api.updateContactMessageStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactMessageKeys.all })
    },
  })
}

export function useDeleteContactMessageMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteContactMessage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactMessageKeys.all })
    },
  })
}
