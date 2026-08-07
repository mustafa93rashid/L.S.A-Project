import { apiClient } from '@/lib/api-client'
import type { ApiEnvelope, CountedList } from '@/types/api'
import type { Service } from '@/features/services/types'

export async function getServices(): Promise<Service[]> {
  const response = await apiClient.get<CountedList<Service>>('/services')
  return response.data.data
}

export async function createService(formData: FormData): Promise<Service> {
  const response = await apiClient.post<ApiEnvelope<Service>>('/services', formData)
  if (!response.data.data)
    throw new Error('Create response did not include service data.')
  return response.data.data
}

export async function updateService(id: string, formData: FormData): Promise<Service> {
  const response = await apiClient.patch<ApiEnvelope<Service>>(
    `/services/${id}`,
    formData,
  )
  if (!response.data.data)
    throw new Error('Update response did not include service data.')
  return response.data.data
}

export async function deleteService(id: string): Promise<void> {
  await apiClient.delete(`/services/${id}`)
}
