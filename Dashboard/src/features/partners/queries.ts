import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/features/partners/api'

export const partnerKeys = {
  all: ['partners'] as const,
  list: () => [...partnerKeys.all, 'list'] as const,
}

export function usePartnersQuery() {
  return useQuery({
    queryKey: partnerKeys.list(),
    queryFn: api.getPartners,
  })
}

export function useCreatePartnerMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) => api.createPartner(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerKeys.all })
    },
  })
}

export function useUpdatePartnerMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      api.updatePartner(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerKeys.all })
    },
  })
}

export function useDeletePartnerMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deletePartner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: partnerKeys.all })
    },
  })
}
