import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import * as api from '@/features/services/api'
import type { Service } from '@/features/services/types'

// ==================== Query Keys ====================

export const serviceKeys = {
  all: ['services'] as const,

  lists: () =>
    [...serviceKeys.all, 'list'] as const,

  list: () =>
    [...serviceKeys.lists()] as const,
}

// ==================== Helpers ====================

function sortServices(services: Service[]) {
  return [...services].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  )
}

// ==================== Query ====================

export function useServicesQuery(enabled = true) {
  return useQuery({
    queryKey: serviceKeys.list(),
    queryFn: api.getServices,
    enabled,
  })
}

// ==================== Create ====================

export function useCreateServiceMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (formData: FormData) =>
      api.createService(formData),

    onSuccess: async (createdService) => {
      queryClient.setQueryData<Service[]>(
        serviceKeys.list(),
        (current = []) =>
          sortServices([
            ...current,
            createdService,
          ]),
      )

      await queryClient.invalidateQueries({
        queryKey: serviceKeys.all,
      })
    },
  })
}

// ==================== Update ====================

export function useUpdateServiceMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      formData,
    }: {
      id: string
      formData: FormData
    }) =>
      api.updateService(id, formData),

    onSuccess: async (updatedService) => {
      queryClient.setQueryData<Service[]>(
        serviceKeys.list(),
        (current = []) =>
          sortServices(
            current.map((service) =>
              service._id === updatedService._id
                ? updatedService
                : service,
            ),
          ),
      )

      await queryClient.invalidateQueries({
        queryKey: serviceKeys.all,
      })
    },
  })
}

// ==================== Delete ====================

export function useDeleteServiceMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      api.deleteService(id),

    onSuccess: async (_, deletedId) => {
      queryClient.setQueryData<Service[]>(
        serviceKeys.list(),
        (current = []) =>
          current.filter(
            (service) =>
              service._id !== deletedId,
          ),
      )

      await queryClient.invalidateQueries({
        queryKey: serviceKeys.all,
      })
    },
  })
}