import { apiClient } from '@/lib/api-client'
import type { ApiEnvelope, Paginated } from '@/types/api'
import type {
  EquipmentRequest,
  EquipmentRequestFilters,
  EquipmentRequestStatistics,
  EquipmentRequestStatus,
} from '@/features/equipment-requests/types'

export async function getEquipmentRequests(
  filters: EquipmentRequestFilters,
): Promise<Paginated<EquipmentRequest>> {
  const response = await apiClient.get<Paginated<EquipmentRequest>>(
    '/equipments-request',
    {
      params: {
        status: filters.status || undefined,
        search: filters.search || undefined,
        page: filters.page,
        limit: filters.limit,
      },
    },
  )
  return response.data
}

export async function getEquipmentRequestStatistics(): Promise<EquipmentRequestStatistics> {
  const response = await apiClient.get<ApiEnvelope<EquipmentRequestStatistics>>(
    '/equipments-request/statistics',
  )
  if (!response.data.data) throw new Error('Statistics response did not include data.')
  return response.data.data
}

export async function updateEquipmentRequestStatus(
  id: string,
  status: EquipmentRequestStatus,
): Promise<EquipmentRequest> {
  const response = await apiClient.patch<ApiEnvelope<EquipmentRequest>>(
    `/equipments-request/${id}/status`,
    { status },
  )
  if (!response.data.data) throw new Error('Status update response did not include data.')
  return response.data.data
}

export async function deleteEquipmentRequest(id: string): Promise<void> {
  await apiClient.delete(`/equipments-request/${id}`)
}
