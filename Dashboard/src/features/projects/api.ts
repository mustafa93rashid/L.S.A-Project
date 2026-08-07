import { apiClient } from '@/lib/api-client'
import type { ApiEnvelope, CountedList } from '@/types/api'
import type { Project } from '@/features/projects/types'

export async function getProjects(): Promise<Project[]> {
  const response = await apiClient.get<CountedList<Project>>('/projects')
  return response.data.data
}

export async function createProject(formData: FormData): Promise<Project> {
  const response = await apiClient.post<ApiEnvelope<Project>>('/projects', formData)
  if (!response.data.data)
    throw new Error('Create response did not include project data.')
  return response.data.data
}

export async function updateProject(id: string, formData: FormData): Promise<Project> {
  const response = await apiClient.patch<ApiEnvelope<Project>>(
    `/projects/${id}`,
    formData,
  )
  if (!response.data.data)
    throw new Error('Update response did not include project data.')
  return response.data.data
}

export async function deleteProject(id: string): Promise<void> {
  await apiClient.delete(`/projects/${id}`)
}
