import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import * as api from '@/features/equipment-categories/api'

import type {
  EquipmentCategory,
  EquipmentCategoryPayload,
} from '@/features/equipment-categories/types'

// ==================== Query Keys ====================

export const equipmentCategoryKeys = {
  all: ['equipmentCategories'] as const,

  lists: () =>
    [...equipmentCategoryKeys.all, 'list'] as const,

  list: () =>
    [...equipmentCategoryKeys.lists()] as const,
}

// ==================== Helpers ====================

function sortEquipmentCategories(
  categories: EquipmentCategory[],
) {
  return [...categories].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  )
}

// ==================== Query ====================

export function useEquipmentCategoriesQuery() {
  return useQuery({
    queryKey: equipmentCategoryKeys.list(),
    queryFn: api.getEquipmentCategories,
  })
}

// ==================== Create ====================

export function useCreateEquipmentCategoryMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (
      payload: EquipmentCategoryPayload,
    ) =>
      api.createEquipmentCategory(payload),

    onSuccess: async (createdCategory) => {
      queryClient.setQueryData<EquipmentCategory[]>(
        equipmentCategoryKeys.list(),
        (current = []) =>
          sortEquipmentCategories([
            ...current,
            createdCategory,
          ]),
      )

      await queryClient.invalidateQueries({
        queryKey: equipmentCategoryKeys.all,
      })
    },
  })
}

// ==================== Update ====================

export function useUpdateEquipmentCategoryMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: Partial<EquipmentCategoryPayload>
    }) =>
      api.updateEquipmentCategory(
        id,
        payload,
      ),

    onSuccess: async (updatedCategory) => {
      queryClient.setQueryData<EquipmentCategory[]>(
        equipmentCategoryKeys.list(),
        (current = []) =>
          sortEquipmentCategories(
            current.map((category) =>
              category._id === updatedCategory._id
                ? updatedCategory
                : category,
            ),
          ),
      )

      await queryClient.invalidateQueries({
        queryKey: equipmentCategoryKeys.all,
      })
    },
  })
}

// ==================== Delete ====================

export function useDeleteEquipmentCategoryMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      api.deleteEquipmentCategory(id),

    onSuccess: async (_, deletedId) => {
      queryClient.setQueryData<EquipmentCategory[]>(
        equipmentCategoryKeys.list(),
        (current = []) =>
          current.filter(
            (category) =>
              category._id !== deletedId,
          ),
      )

      await queryClient.invalidateQueries({
        queryKey: equipmentCategoryKeys.all,
      })
    },
  })
}