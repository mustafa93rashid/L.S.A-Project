import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import * as api from '@/features/journeys/api'
import type { Journey } from '@/features/journeys/types'

// ==================== Query Keys ====================

export const journeyKeys = {
  all: ['journeys'] as const,

  lists: () =>
    [...journeyKeys.all, 'list'] as const,

  list: () =>
    [...journeyKeys.lists()] as const,
}

// ==================== Queries ====================

export function useJourneysQuery() {
  return useQuery({
    queryKey: journeyKeys.list(),
    queryFn: api.getJourneys,
  })
}

// ==================== Create ====================

export function useCreateJourneyMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (formData: FormData) =>
      api.createJourney(formData),

    onSuccess: async (createdJourney) => {
      // Add immediately to cache
      queryClient.setQueryData<Journey[]>(
        journeyKeys.list(),
        (current = []) => [
          ...current,
          createdJourney,
        ],
      )

      // Synchronize with backend
      await queryClient.invalidateQueries({
        queryKey: journeyKeys.all,
      })
    },
  })
}

// ==================== Update ====================

export function useUpdateJourneyMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      formData,
    }: {
      id: string
      formData: FormData
    }) =>
      api.updateJourney(id, formData),

    onSuccess: async (updatedJourney) => {
      // Replace immediately in cache
      queryClient.setQueryData<Journey[]>(
        journeyKeys.list(),
        (current = []) =>
          current.map((journey) =>
            journey._id === updatedJourney._id
              ? updatedJourney
              : journey,
          ),
      )

      // Synchronize with backend
      await queryClient.invalidateQueries({
        queryKey: journeyKeys.all,
      })
    },
  })
}

// ==================== Delete ====================

export function useDeleteJourneyMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      api.deleteJourney(id),

    onSuccess: async (_, deletedId) => {
      // Remove immediately from cache
      queryClient.setQueryData<Journey[]>(
        journeyKeys.list(),
        (current = []) =>
          current.filter(
            (journey) =>
              journey._id !== deletedId,
          ),
      )

      // Synchronize with backend
      await queryClient.invalidateQueries({
        queryKey: journeyKeys.all,
      })
    },
  })
}