import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/features/equipment/api'
import { getEquipmentCategoryOptions } from '@/features/equipment-categories/api'
import type { EquipmentListFilters } from '@/features/equipment/types'

export const equipmentKeys = {
  all: ['equipment'] as const,
  list: (filters: EquipmentListFilters) => [...equipmentKeys.all, 'list', filters] as const,
  detail: (id: string) => [...equipmentKeys.all, 'detail', id] as const,
}

export const equipmentCategoryOptionKeys = ['equipmentCategories', 'options'] as const

export function useEquipmentListQuery(filters: EquipmentListFilters, enabled = true) {
  return useQuery({
    queryKey: equipmentKeys.list(filters),
    queryFn: () => api.getEquipmentList(filters),
    enabled,
  })
}

export function useEquipmentQuery(id: string | undefined) {
  return useQuery({
    queryKey: equipmentKeys.detail(id ?? ''),
    queryFn: () => api.getEquipmentById(id as string),
    enabled: Boolean(id),
  })
}

/** Active-only categories for the form's picker. */
export function useEquipmentCategoryOptionsQuery() {
  return useQuery({
    queryKey: equipmentCategoryOptionKeys,
    queryFn: getEquipmentCategoryOptions,
  })
}

export function useCreateEquipmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (formData: FormData) => api.createEquipment(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.all })
    },
  })
}

export function useUpdateEquipmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) => api.updateEquipment(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.all })
    },
  })
}

export function useDeleteEquipmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.deleteEquipment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.all })
    },
  })
}