import { apiClient } from '@/lib/api-client'
import type { ApiEnvelope, CountedList } from '@/types/api'
import type { Journey } from '@/features/journeys/types'

export async function getJourneys(): Promise<Journey[]> {
  const response = await apiClient.get<CountedList<Journey>>('/journeys')
  return response.data.data
}

export async function createJourney(formData: FormData): Promise<Journey> {
  const response = await apiClient.post<ApiEnvelope<Journey>>('/journeys', formData)
  if (!response.data.data)
    throw new Error('Create response did not include journey data.')
  return response.data.data
}

export async function updateJourney(id: string, formData: FormData): Promise<Journey> {
  const response = await apiClient.patch<ApiEnvelope<Journey>>(
    `/journeys/${id}`,
    formData,
  )
  if (!response.data.data)
    throw new Error('Update response did not include journey data.')
  return response.data.data
}

export async function deleteJourney(id: string): Promise<void> {
  await apiClient.delete(`/journeys/${id}`)
}
