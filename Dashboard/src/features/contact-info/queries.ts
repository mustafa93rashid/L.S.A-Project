import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/features/contact-info/api'
import type { ContactInfoPayload } from '@/features/contact-info/types'

export const contactInfoKeys = {
  all: ['contactInfo'] as const,
}

export function useContactInfoQuery() {
  return useQuery({
    queryKey: contactInfoKeys.all,
    queryFn: api.getContactInfo,
  })
}

export function useSaveContactInfoMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ContactInfoPayload) => api.saveContactInfo(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactInfoKeys.all })
    },
  })
}
