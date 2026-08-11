import { apiClient } from '@/lib/api-client'
import type { ApiEnvelope, Paginated } from '@/types/api'
import type { Job, JobFilters, JobPayload, JobStatistics } from '@/features/jobs/types'

export async function getJobs(filters: JobFilters): Promise<Paginated<Job>> {
  const response = await apiClient.get<Paginated<Job>>('/jobs', {
    params: {
      status: filters.status || undefined,
      department: filters.department || undefined,
      employmentType: filters.employmentType || undefined,
      search: filters.search || undefined,
      page: filters.page,
      limit: filters.limit,
    },
  })

  return response.data
}

export async function getJobStatistics(): Promise<JobStatistics> {
  const response = await apiClient.get<ApiEnvelope<JobStatistics>>('/jobs/statistics')

  if (!response.data.data) throw new Error('Statistics response did not include data.')

  return response.data.data
}

/** Used only by the Edit page — the list query is paginated, so the
 * record being edited may not be on whatever page/filters the list
 * happens to be showing. Hits the same `GET /jobs/:id` the backend
 * already exposes.
 */
export async function getJobById(id: string): Promise<Job> {
  const response = await apiClient.get<ApiEnvelope<Job>>(`/jobs/${id}`)

  if (!response.data.data) throw new Error('Response did not include job data.')

  return response.data.data
}

export async function createJob(payload: JobPayload): Promise<Job> {
  const response = await apiClient.post<ApiEnvelope<Job>>('/jobs', payload)

  if (!response.data.data) throw new Error('Create response did not include job data.')

  return response.data.data
}

export async function updateJob(id: string, payload: Partial<JobPayload>): Promise<Job> {
  const response = await apiClient.put<ApiEnvelope<Job>>(`/jobs/${id}`, payload)

  if (!response.data.data) throw new Error('Update response did not include job data.')

  return response.data.data
}

export async function deleteJob(id: string): Promise<void> {
  await apiClient.delete(`/jobs/${id}`)
}