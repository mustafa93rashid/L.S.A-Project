import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/features/jobs/api'
import type { JobFilters, JobPayload } from '@/features/jobs/types'

export const jobKeys = {
  all: ['jobs'] as const,
  lists: () => [...jobKeys.all, 'list'] as const,
  list: (filters: JobFilters) => [...jobKeys.lists(), filters] as const,
  details: () => [...jobKeys.all, 'detail'] as const,
  detail: (id: string) => [...jobKeys.details(), id] as const,
  statistics: () => [...jobKeys.all, 'statistics'] as const,
}

export function useJobsQuery(filters: JobFilters, enabled = true) {
  return useQuery({
    queryKey: jobKeys.list(filters),
    queryFn: () => api.getJobs(filters),
    enabled,
  })
}

export function useJobQuery(id: string | undefined) {
  return useQuery({
    queryKey: jobKeys.detail(id ?? ''),
    queryFn: () => api.getJobById(id as string),
    enabled: Boolean(id),
  })
}

export function useJobStatisticsQuery() {
  return useQuery({
    queryKey: jobKeys.statistics(),
    queryFn: api.getJobStatistics,
  })
}

export function useCreateJobMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: JobPayload) => api.createJob(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.all })
    },
  })
}

export function useUpdateJobMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<JobPayload> }) => api.updateJob(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.all })
    },
  })
}

export function useDeleteJobMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.deleteJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobKeys.all })
    },
  })
}