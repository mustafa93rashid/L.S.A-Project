import { apiClient } from '@/lib/api-client'
import type { ApiEnvelope } from '@/types/api'
import type { Equipment, EquipmentListFilters, EquipmentListResponse } from '@/features/equipment/types'

export async function getEquipmentList(filters: EquipmentListFilters): Promise<EquipmentListResponse> {
  const response = await apiClient.get<EquipmentListResponse>('/equipments', {
    params: {
      category: filters.category || undefined,
      isActive: filters.isActive,
      search: filters.search || undefined,
      page: filters.page,
      limit: filters.limit,
    },
  })

  return response.data
}

export async function getEquipmentById(id: string): Promise<Equipment> {
  const response = await apiClient.get<ApiEnvelope<Equipment>>(`/equipments/${id}`)

  if (!response.data.data) throw new Error('Response did not include equipment data.')

  return response.data.data
}

export async function createEquipment(formData: FormData): Promise<Equipment> {
  const response = await apiClient.post<ApiEnvelope<Equipment>>('/equipments', formData)

  if (!response.data.data) throw new Error('Create response did not include equipment data.')

  return response.data.data
}

export async function updateEquipment(id: string, formData: FormData): Promise<Equipment> {
  const response = await apiClient.patch<ApiEnvelope<Equipment>>(`/equipments/${id}`, formData)

  if (!response.data.data) throw new Error('Update response did not include equipment data.')

  return response.data.data
}

export async function deleteEquipment(id: string): Promise<string> {
  const response = await apiClient.delete<ApiEnvelope<Equipment>>(`/equipments/${id}`)

  return response.data.message ?? 'Equipment deleted successfully'
}