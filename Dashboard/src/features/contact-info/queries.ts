import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import * as api from '@/features/contact-info/api'

import type {
  ContactInfo,
  ContactInfoPayload,
} from '@/features/contact-info/types'

// ==================== Query Keys ====================

export const contactInfoKeys = {
  all: ['contactInfo'] as const,
}

// ==================== Query ====================

export function useContactInfoQuery() {
  return useQuery({
    queryKey: contactInfoKeys.all,
    queryFn: api.getContactInfo,
  })
}

// ==================== Save ====================

export function useSaveContactInfoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ContactInfoPayload) =>
      api.saveContactInfo(payload),

    onSuccess: async (savedContactInfo) => {
      // Update cache immediately
      queryClient.setQueryData<ContactInfo | null>(
        contactInfoKeys.all,
        savedContactInfo,
      )

      // Synchronize with backend
      await queryClient.invalidateQueries({
        queryKey: contactInfoKeys.all,
      })
    },
  })
}