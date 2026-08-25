import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import * as api from '@/features/job-requests/api'

import type {
  JobRequest,
  JobRequestFilters,
  JobRequestStatus,
} from '@/features/job-requests/types'

// ==================== Query Keys ====================

export const jobRequestKeys = {
  all: ['jobRequests'] as const,

  lists: () =>
    [...jobRequestKeys.all, 'list'] as const,

  list: (filters: JobRequestFilters) =>
    [...jobRequestKeys.lists(), filters] as const,

  details: () =>
    [...jobRequestKeys.all, 'detail'] as const,

  detail: (id: string) =>
    [...jobRequestKeys.details(), id] as const,

  statistics: () =>
    [...jobRequestKeys.all, 'statistics'] as const,
}

// ==================== Cache Shape ====================

type JobRequestListCache = {
  data: JobRequest[]
  [key: string]: unknown
}

// ==================== List ====================

export function useJobRequestsQuery(
  filters: JobRequestFilters,
  enabled = true,
) {
  return useQuery({
    queryKey: jobRequestKeys.list(filters),

    queryFn: () =>
      api.getJobRequests(filters),

    enabled,
  })
}

// ==================== Detail ====================

export function useJobRequestQuery(
  id: string | undefined,
) {
  return useQuery({
    queryKey:
      jobRequestKeys.detail(id ?? ''),

    queryFn: () =>
      api.getJobRequestById(id as string),

    enabled: Boolean(id),
  })
}

// ==================== Statistics ====================

export function useJobRequestStatisticsQuery(
  enabled = true,
) {
  return useQuery({
    queryKey:
      jobRequestKeys.statistics(),

    queryFn:
      api.getJobRequestStatistics,

    enabled,
  })
}

// ==================== Update Status ====================

export function useUpdateJobRequestStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string
      status: JobRequestStatus
    }) =>
      api.updateJobRequestStatus(
        id,
        status,
      ),

    onSuccess: async (updatedRequest) => {
      // ====================
      // Update detail cache immediately
      // ====================

      queryClient.setQueryData<JobRequest>(
        jobRequestKeys.detail(
          updatedRequest._id,
        ),
        updatedRequest,
      )

      // ====================
      // Update every cached list
      // ====================

      queryClient.setQueriesData<JobRequestListCache>(
        {
          queryKey:
            jobRequestKeys.lists(),
        },
        (current) => {
          if (!current?.data) {
            return current
          }

          const exists =
            current.data.some(
              (request) =>
                request._id ===
                updatedRequest._id,
            )

          if (!exists) {
            return current
          }

          return {
            ...current,

            data: current.data.map(
              (request) =>
                request._id ===
                updatedRequest._id
                  ? updatedRequest
                  : request,
            ),
          }
        },
      )

      // ====================
      // Final synchronization
      // ====================

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey:
            jobRequestKeys.lists(),
        }),

        queryClient.invalidateQueries({
          queryKey:
            jobRequestKeys.statistics(),
        }),
      ])
    },
  })
}

// ==================== Delete ====================

export function useDeleteJobRequestMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      api.deleteJobRequest(id),

    onSuccess: async (_, deletedId) => {
      // ====================
      // Remove detail cache
      // ====================

      queryClient.removeQueries({
        queryKey:
          jobRequestKeys.detail(
            deletedId,
          ),
      })

      // ====================
      // Remove from every cached list
      // ====================

      queryClient.setQueriesData<JobRequestListCache>(
        {
          queryKey:
            jobRequestKeys.lists(),
        },
        (current) => {
          if (!current?.data) {
            return current
          }

          const exists =
            current.data.some(
              (request) =>
                request._id ===
                deletedId,
            )

          if (!exists) {
            return current
          }

          return {
            ...current,

            data: current.data.filter(
              (request) =>
                request._id !==
                deletedId,
            ),
          }
        },
      )

      // ====================
      // Final synchronization
      // ====================

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey:
            jobRequestKeys.lists(),
        }),

        queryClient.invalidateQueries({
          queryKey:
            jobRequestKeys.statistics(),
        }),
      ])
    },
  })
}