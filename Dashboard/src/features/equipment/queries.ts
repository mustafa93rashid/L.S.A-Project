import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import * as api from '@/features/equipment/api'

import {
  getEquipmentCategoryOptions,
} from '@/features/equipment-categories/api'

import type {
  Equipment,
  EquipmentListFilters,
  EquipmentListResponse,
} from '@/features/equipment/types'

// ==================== Query Keys ====================

export const equipmentKeys = {
  all: ['equipment'] as const,

  lists: () =>
    [...equipmentKeys.all, 'list'] as const,

  list: (filters: EquipmentListFilters) =>
    [...equipmentKeys.lists(), filters] as const,

  details: () =>
    [...equipmentKeys.all, 'detail'] as const,

  detail: (id: string) =>
    [...equipmentKeys.details(), id] as const,

  statistics: () =>
    [...equipmentKeys.all, 'statistics'] as const,
}

export const equipmentCategoryOptionKeys = [
  'equipmentCategories',
  'options',
] as const

// ==================== Helpers ====================

function sortEquipment(
  equipment: Equipment[],
) {
  return [...equipment].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  )
}

// ==================== List ====================

export function useEquipmentListQuery(
  filters: EquipmentListFilters,
  enabled = true,
) {
  return useQuery({
    queryKey: equipmentKeys.list(filters),

    queryFn: () =>
      api.getEquipmentList(filters),

    enabled,
  })
}

// ==================== Detail ====================

export function useEquipmentQuery(
  id: string | undefined,
) {
  return useQuery({
    queryKey: equipmentKeys.detail(id ?? ''),

    queryFn: () =>
      api.getEquipmentById(id as string),

    enabled: Boolean(id),
  })
}

// ==================== Category Options ====================

export function useEquipmentCategoryOptionsQuery() {
  return useQuery({
    queryKey: equipmentCategoryOptionKeys,
    queryFn: getEquipmentCategoryOptions,
  })
}

// ==================== Create ====================

export function useCreateEquipmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (formData: FormData) =>
      api.createEquipment(formData),

    onSuccess: async (createdEquipment) => {
      // Cache detail immediately
      queryClient.setQueryData<Equipment>(
        equipmentKeys.detail(
          createdEquipment._id,
        ),
        createdEquipment,
      )

      /*
       * We deliberately don't insert the new item manually
       * into paginated lists.
       *
       * Which page it belongs to depends on:
       * - filters
       * - search
       * - category
       * - isActive
       * - displayOrder
       * - pagination
       *
       * Refetching active lists is safer.
       */
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: equipmentKeys.lists(),
        }),

        queryClient.invalidateQueries({
          queryKey: equipmentKeys.statistics(),
        }),
      ])
    },
  })
}

// ==================== Update ====================

export function useUpdateEquipmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      formData,
    }: {
      id: string
      formData: FormData
    }) =>
      api.updateEquipment(
        id,
        formData,
      ),

    onSuccess: async (updatedEquipment) => {
      // Update detail immediately
      queryClient.setQueryData<Equipment>(
        equipmentKeys.detail(
          updatedEquipment._id,
        ),
        updatedEquipment,
      )

      // Update every cached equipment list immediately
      queryClient.setQueriesData<EquipmentListResponse>(
        {
          queryKey: equipmentKeys.lists(),
        },
        (current) => {
          if (!current) {
            return current
          }

          const exists = current.data.some(
            (equipment) =>
              equipment._id ===
              updatedEquipment._id,
          )

          if (!exists) {
            return current
          }

          return {
            ...current,

            data: sortEquipment(
              current.data.map((equipment) =>
                equipment._id ===
                updatedEquipment._id
                  ? updatedEquipment
                  : equipment,
              ),
            ),
          }
        },
      )

      // Final synchronization
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: equipmentKeys.lists(),
        }),

        queryClient.invalidateQueries({
          queryKey: equipmentKeys.statistics(),
        }),
      ])
    },
  })
}

// ==================== Delete ====================

export function useDeleteEquipmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      api.deleteEquipment(id),

    onSuccess: async (_, deletedId) => {
      // Remove detail cache
      queryClient.removeQueries({
        queryKey:
          equipmentKeys.detail(deletedId),
      })

      // Remove immediately from every cached list
      queryClient.setQueriesData<EquipmentListResponse>(
        {
          queryKey: equipmentKeys.lists(),
        },
        (current) => {
          if (!current) {
            return current
          }

          const exists = current.data.some(
            (equipment) =>
              equipment._id === deletedId,
          )

          if (!exists) {
            return current
          }

          return {
            ...current,

            count: Math.max(
              0,
              current.count - 1,
            ),

            data: current.data.filter(
              (equipment) =>
                equipment._id !== deletedId,
            ),

            pagination: {
              ...current.pagination,

              total: Math.max(
                0,
                current.pagination.total - 1,
              ),
            },
          }
        },
      )

      // Final synchronization
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: equipmentKeys.lists(),
        }),

        queryClient.invalidateQueries({
          queryKey: equipmentKeys.statistics(),
        }),
      ])
    },
  })
}

// ==================== Statistics ====================

export function useEquipmentStatisticsQuery(
  enabled = true,
) {
  return useQuery({
    queryKey:
      equipmentKeys.statistics(),

    queryFn:
      api.getEquipmentStatistics,

    enabled,
  })
}