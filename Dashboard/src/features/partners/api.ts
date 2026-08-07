import { apiClient } from '@/lib/api-client'
import type { ApiEnvelope, CountedList } from '@/types/api'
import type { Partner } from '@/features/partners/types'

export async function getPartners(): Promise<Partner[]> {
  const response = await apiClient.get<CountedList<Partner>>('/partners')
  return response.data.data
}

export async function createPartner(formData: FormData): Promise<Partner> {
  const response = await apiClient.post<ApiEnvelope<Partner>>('/partners', formData)
  if (!response.data.data)
    throw new Error('Create response did not include partner data.')
  return response.data.data
}

export async function updatePartner(id: string, formData: FormData): Promise<Partner> {
  const response = await apiClient.patch<ApiEnvelope<Partner>>(
    `/partners/${id}`,
    formData,
  )
  if (!response.data.data)
    throw new Error('Update response did not include partner data.')
  return response.data.data
}

export async function deletePartner(id: string): Promise<void> {
  await apiClient.delete(`/partners/${id}`)
}
