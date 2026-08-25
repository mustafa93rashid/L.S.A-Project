import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import * as api from '@/features/partners/api'
import type { Partner } from '@/features/partners/types'

// ==================== Query Keys ====================

export const partnerKeys = {
  all: ['partners'] as const,

  lists: () =>
    [...partnerKeys.all, 'list'] as const,

  list: () =>
    [...partnerKeys.lists()] as const,
}

// ==================== Helpers ====================

function sortPartners(partners: Partner[]) {
  return [...partners].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  )
}

// ==================== Queries ====================

export function usePartnersQuery() {
  return useQuery({
    queryKey: partnerKeys.list(),
    queryFn: api.getPartners,
  })
}

// ==================== Create ====================

export function useCreatePartnerMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (formData: FormData) =>
      api.createPartner(formData),

    onSuccess: async (createdPartner) => {
      // Update cache immediately
      queryClient.setQueryData<Partner[]>(
        partnerKeys.list(),
        (current = []) =>
          sortPartners([
            ...current,
            createdPartner,
          ]),
      )

      // Synchronize again with backend
      await queryClient.invalidateQueries({
        queryKey: partnerKeys.all,
      })
    },
  })
}

// ==================== Update ====================

export function useUpdatePartnerMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      formData,
    }: {
      id: string
      formData: FormData
    }) =>
      api.updatePartner(id, formData),

    onSuccess: async (updatedPartner) => {
      // Update partner immediately in cache
      queryClient.setQueryData<Partner[]>(
        partnerKeys.list(),
        (current = []) =>
          sortPartners(
            current.map((partner) =>
              partner._id === updatedPartner._id
                ? updatedPartner
                : partner,
            ),
          ),
      )

      // Synchronize again with backend
      await queryClient.invalidateQueries({
        queryKey: partnerKeys.all,
      })
    },
  })
}

// ==================== Delete ====================

export function useDeletePartnerMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      api.deletePartner(id),

    onSuccess: async (_, deletedId) => {
      // Remove immediately from cache
      queryClient.setQueryData<Partner[]>(
        partnerKeys.list(),
        (current = []) =>
          current.filter(
            (partner) =>
              partner._id !== deletedId,
          ),
      )

      // Synchronize again with backend
      await queryClient.invalidateQueries({
        queryKey: partnerKeys.all,
      })
    },
  })
}