import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/features/journeys/api'

export const journeyKeys = {
  all: ['journeys'] as const,
  list: () => [...journeyKeys.all, 'list'] as const,
}

export function useJourneysQuery() {
  return useQuery({
    queryKey: journeyKeys.list(),
    queryFn: api.getJourneys,
  })
}

export function useCreateJourneyMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) => api.createJourney(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: journeyKeys.all })
    },
  })
}

export function useUpdateJourneyMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      api.updateJourney(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: journeyKeys.all })
    },
  })
}

export function useDeleteJourneyMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteJourney(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: journeyKeys.all })
    },
  })
}
