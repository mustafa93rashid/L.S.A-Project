import { apiClient } from '@/lib/api-client'
import type { ApiEnvelope, Paginated } from '@/types/api'
import type {
  JobRequest,
  JobRequestFilters,
  JobRequestStatistics,
  JobRequestStatus,
} from '@/features/job-requests/types'

export async function getJobRequests(
  filters: JobRequestFilters,
): Promise<Paginated<JobRequest>> {
  const response = await apiClient.get<Paginated<JobRequest>>('/job-requests', {
    params: {
      status: filters.status || undefined,
      job: filters.job || undefined,
      search: filters.search || undefined,
      page: filters.page,
      limit: filters.limit,
    },
  })
  return response.data
}

/** Details page only — the list query is paginated/filtered, so the
 * record being viewed may not be on whatever page the list happens to be
 * showing. Hits the backend's existing `GET /job-requests/:id`. */
export async function getJobRequestById(id: string): Promise<JobRequest> {
  const response = await apiClient.get<ApiEnvelope<JobRequest>>(`/job-requests/${id}`)
  if (!response.data.data) throw new Error('Response did not include job request data.')
  return response.data.data
}

export async function getJobRequestStatistics(): Promise<JobRequestStatistics> {
  const response = await apiClient.get<ApiEnvelope<JobRequestStatistics>>(
    '/job-requests/statistics',
  )
  if (!response.data.data) throw new Error('Statistics response did not include data.')
  return response.data.data
}

export async function updateJobRequestStatus(
  id: string,
  status: JobRequestStatus,
): Promise<JobRequest> {
  const response = await apiClient.patch<ApiEnvelope<JobRequest>>(
    `/job-requests/${id}/status`,
    { status },
  )
  if (!response.data.data) throw new Error('Status update response did not include data.')
  return response.data.data
}

export async function deleteJobRequest(id: string): Promise<void> {
  await apiClient.delete(`/job-requests/${id}`)
}
