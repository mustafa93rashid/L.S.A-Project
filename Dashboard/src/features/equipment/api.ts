import { apiClient } from '@/lib/api-client'
import type { ApiEnvelope, CountedList } from '@/types/api'
import type { Equipment, EquipmentListFilters } from '@/features/equipment/types'

export async function getEquipmentList(
  filters: EquipmentListFilters,
): Promise<Equipment[]> {
  const response = await apiClient.get<CountedList<Equipment>>('/equipments', {
    params: {
      category: filters.category || undefined,
      isActive: filters.isActive,
      search: filters.search || undefined,
    },
  })
  return response.data.data
}

export async function createEquipment(formData: FormData): Promise<Equipment> {
  const response = await apiClient.post<ApiEnvelope<Equipment>>('/equipments', formData)
  if (!response.data.data)
    throw new Error('Create response did not include equipment data.')
  return response.data.data
}

export async function updateEquipment(
  id: string,
  formData: FormData,
): Promise<Equipment> {
  const response = await apiClient.patch<ApiEnvelope<Equipment>>(
    `/equipments/${id}`,
    formData,
  )
  if (!response.data.data)
    throw new Error('Update response did not include equipment data.')
  return response.data.data
}

export async function deleteEquipment(id: string): Promise<string> {
  const response = await apiClient.delete<ApiEnvelope<Equipment>>(`/equipments/${id}`)
  return response.data.message ?? 'Equipment deleted successfully'
}
