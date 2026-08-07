import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/features/jobs/api'
import type { JobFilters, JobPayload } from '@/features/jobs/types'

export const jobKeys = {
  all: ['jobs'] as const,
  list: (filters: JobFilters) => [...jobKeys.all, 'list', filters] as const,
  detail: (id: string) => [...jobKeys.all, 'detail', id] as const,
}

export function useJobsQuery(filters: JobFilters, enabled = true) {
  return useQuery({
    queryKey: jobKeys.list(filters),
    queryFn: () => api.getJobs(filters),
    enabled,
  })
}

/** Edit page only — see api.ts's getJobById for why this can't reuse the
 * paginated list query. */
export function useJobQuery(id: string | undefined) {
  return useQuery({
    queryKey: jobKeys.detail(id ?? ''),
    queryFn: () => api.getJobById(id as string),
    enabled: Boolean(id),
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
    mutationFn: ({ id, payload }: { id: string; payload: Partial<JobPayload> }) =>
      api.updateJob(id, payload),
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
