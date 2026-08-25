import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import * as api from '@/features/jobs/api'

import type {
  Job,
  JobFilters,
  JobPayload,
} from '@/features/jobs/types'

// ==================== Query Keys ====================

export const jobKeys = {
  all: ['jobs'] as const,

  lists: () =>
    [...jobKeys.all, 'list'] as const,

  list: (filters: JobFilters) =>
    [...jobKeys.lists(), filters] as const,

  details: () =>
    [...jobKeys.all, 'detail'] as const,

  detail: (id: string) =>
    [...jobKeys.details(), id] as const,

  statistics: () =>
    [...jobKeys.all, 'statistics'] as const,
}

// ==================== Cache Shape ====================

type JobListCache = {
  data: Job[]
  [key: string]: unknown
}

// ==================== List ====================

export function useJobsQuery(
  filters: JobFilters,
  enabled = true,
) {
  return useQuery({
    queryKey: jobKeys.list(filters),
    queryFn: () => api.getJobs(filters),
    enabled,
  })
}

// ==================== Detail ====================

export function useJobQuery(
  id: string | undefined,
) {
  return useQuery({
    queryKey: jobKeys.detail(id ?? ''),
    queryFn: () => api.getJobById(id as string),
    enabled: Boolean(id),
  })
}

// ==================== Statistics ====================

export function useJobStatisticsQuery() {
  return useQuery({
    queryKey: jobKeys.statistics(),
    queryFn: api.getJobStatistics,
  })
}

// ==================== Create ====================

export function useCreateJobMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: JobPayload) =>
      api.createJob(payload),

    onSuccess: async (createdJob) => {
      // Store detail immediately
      queryClient.setQueryData<Job>(
        jobKeys.detail(createdJob._id),
        createdJob,
      )

      /*
       * Don't manually insert into paginated lists.
       * The new job may or may not match:
       * - status
       * - department
       * - employmentType
       * - search
       * - current page
       */
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: jobKeys.lists(),
        }),

        queryClient.invalidateQueries({
          queryKey: jobKeys.statistics(),
        }),
      ])
    },
  })
}

// ==================== Update ====================

export function useUpdateJobMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: Partial<JobPayload>
    }) =>
      api.updateJob(id, payload),

    onSuccess: async (updatedJob) => {
      // Update detail immediately
      queryClient.setQueryData<Job>(
        jobKeys.detail(updatedJob._id),
        updatedJob,
      )

      // Update every cached list containing this job
      queryClient.setQueriesData<JobListCache>(
        {
          queryKey: jobKeys.lists(),
        },
        (current) => {
          if (!current?.data) {
            return current
          }

          const exists = current.data.some(
            (job) =>
              job._id === updatedJob._id,
          )

          if (!exists) {
            return current
          }

          return {
            ...current,

            data: current.data.map(
              (job) =>
                job._id === updatedJob._id
                  ? updatedJob
                  : job,
            ),
          }
        },
      )

      // Final synchronization
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: jobKeys.lists(),
        }),

        queryClient.invalidateQueries({
          queryKey: jobKeys.statistics(),
        }),
      ])
    },
  })
}

// ==================== Delete ====================

export function useDeleteJobMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      api.deleteJob(id),

    onSuccess: async (_, deletedId) => {
      // Remove detail cache
      queryClient.removeQueries({
        queryKey: jobKeys.detail(deletedId),
      })

      // Remove immediately from all cached lists
      queryClient.setQueriesData<JobListCache>(
        {
          queryKey: jobKeys.lists(),
        },
        (current) => {
          if (!current?.data) {
            return current
          }

          const exists = current.data.some(
            (job) =>
              job._id === deletedId,
          )

          if (!exists) {
            return current
          }

          return {
            ...current,

            data: current.data.filter(
              (job) =>
                job._id !== deletedId,
            ),
          }
        },
      )

      // Final synchronization
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: jobKeys.lists(),
        }),

        queryClient.invalidateQueries({
          queryKey: jobKeys.statistics(),
        }),
      ])
    },
  })
}