import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/features/equipment-categories/api'
import type { EquipmentCategoryPayload } from '@/features/equipment-categories/types'

export const equipmentCategoryKeys = {
  all: ['equipmentCategories'] as const,
  list: () => [...equipmentCategoryKeys.all, 'list'] as const,
}

export function useEquipmentCategoriesQuery() {
  return useQuery({
    queryKey: equipmentCategoryKeys.list(),
    queryFn: api.getEquipmentCategories,
  })
}

export function useCreateEquipmentCategoryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: EquipmentCategoryPayload) =>
      api.createEquipmentCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentCategoryKeys.all })
    },
  })
}

export function useUpdateEquipmentCategoryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: Partial<EquipmentCategoryPayload>
    }) => api.updateEquipmentCategory(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentCategoryKeys.all })
    },
  })
}

export function useDeleteEquipmentCategoryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteEquipmentCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentCategoryKeys.all })
    },
  })
}
