import { apiClient } from '@/lib/api-client'
import type { ApiEnvelope, CountedList } from '@/types/api'
import type {
  EquipmentCategory,
  EquipmentCategoryPayload,
} from '@/features/equipment-categories/types'

export async function getEquipmentCategories(): Promise<EquipmentCategory[]> {
  const response = await apiClient.get<CountedList<EquipmentCategory>>(
    '/equipments/categories',
  )
  return response.data.data
}

export interface EquipmentCategoryOption {
  _id: string
  name: string
  slug: string
}

/** Active categories only — used by Equipment's category picker, since
 * the backend rejects creating/updating equipment against an inactive
 * category. Distinct from getEquipmentCategories(), which the Categories
 * management page uses and includes inactive ones. */
export async function getEquipmentCategoryOptions(): Promise<EquipmentCategoryOption[]> {
  const response = await apiClient.get<CountedList<EquipmentCategoryOption>>(
    '/equipments/categories/options',
  )
  return response.data.data
}

export async function createEquipmentCategory(
  payload: EquipmentCategoryPayload,
): Promise<EquipmentCategory> {
  const response = await apiClient.post<ApiEnvelope<EquipmentCategory>>(
    '/equipments/categories',
    payload,
  )
  if (!response.data.data)
    throw new Error('Create response did not include category data.')
  return response.data.data
}

export async function updateEquipmentCategory(
  id: string,
  payload: Partial<EquipmentCategoryPayload>,
): Promise<EquipmentCategory> {
  const response = await apiClient.patch<ApiEnvelope<EquipmentCategory>>(
    `/equipments/categories/${id}`,
    payload,
  )
  if (!response.data.data)
    throw new Error('Update response did not include category data.')
  return response.data.data
}

export async function deleteEquipmentCategory(id: string): Promise<void> {
  await apiClient.delete(`/equipments/categories/${id}`)
}
