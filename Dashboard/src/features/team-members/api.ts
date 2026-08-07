import { apiClient } from '@/lib/api-client'
import type { ApiEnvelope, CountedList } from '@/types/api'
import type { TeamMember } from '@/features/team-members/types'

export async function getTeamMembers(): Promise<TeamMember[]> {
  const response = await apiClient.get<CountedList<TeamMember>>('/team-members')
  return response.data.data
}

export async function createTeamMember(formData: FormData): Promise<TeamMember> {
  const response = await apiClient.post<ApiEnvelope<TeamMember>>(
    '/team-members',
    formData,
  )
  if (!response.data.data)
    throw new Error('Create response did not include team member data.')
  return response.data.data
}

export async function updateTeamMember(
  id: string,
  formData: FormData,
): Promise<TeamMember> {
  const response = await apiClient.patch<ApiEnvelope<TeamMember>>(
    `/team-members/${id}`,
    formData,
  )
  if (!response.data.data)
    throw new Error('Update response did not include team member data.')
  return response.data.data
}

export async function deleteTeamMember(id: string): Promise<void> {
  await apiClient.delete(`/team-members/${id}`)
}
