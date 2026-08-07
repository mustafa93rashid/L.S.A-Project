import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/features/job-requests/api'
import type { JobRequestFilters, JobRequestStatus } from '@/features/job-requests/types'

export const jobRequestKeys = {
  all: ['jobRequests'] as const,
  list: (filters: JobRequestFilters) => [...jobRequestKeys.all, 'list', filters] as const,
  detail: (id: string) => [...jobRequestKeys.all, 'detail', id] as const,
  statistics: () => [...jobRequestKeys.all, 'statistics'] as const,
}

export function useJobRequestsQuery(filters: JobRequestFilters, enabled = true) {
  return useQuery({
    queryKey: jobRequestKeys.list(filters),
    queryFn: () => api.getJobRequests(filters),
    enabled,
  })
}

/** Details page only — see api.ts's getJobRequestById for why this can't
 * reuse the paginated list query. */
export function useJobRequestQuery(id: string | undefined) {
  return useQuery({
    queryKey: jobRequestKeys.detail(id ?? ''),
    queryFn: () => api.getJobRequestById(id as string),
    enabled: Boolean(id),
  })
}

export function useJobRequestStatisticsQuery(enabled = true) {
  return useQuery({
    queryKey: jobRequestKeys.statistics(),
    queryFn: api.getJobRequestStatistics,
    enabled,
  })
}

export function useUpdateJobRequestStatusMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: JobRequestStatus }) =>
      api.updateJobRequestStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobRequestKeys.all })
    },
  })
}

export function useDeleteJobRequestMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteJobRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: jobRequestKeys.all })
    },
  })
}
