import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/features/services/api'

export const serviceKeys = {
  all: ['services'] as const,
  list: () => [...serviceKeys.all, 'list'] as const,
}

export function useServicesQuery(enabled = true) {
  return useQuery({
    queryKey: serviceKeys.list(),
    queryFn: api.getServices,
    enabled,
  })
}

export function useCreateServiceMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) => api.createService(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.all })
    },
  })
}

export function useUpdateServiceMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      api.updateService(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.all })
    },
  })
}

export function useDeleteServiceMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.all })
    },
  })
}
