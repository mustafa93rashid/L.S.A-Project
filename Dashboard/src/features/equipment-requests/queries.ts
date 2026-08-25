import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import * as api from '@/features/equipment-requests/api'

import type {
  EquipmentRequest,
  EquipmentRequestFilters,
  EquipmentRequestStatus,
} from '@/features/equipment-requests/types'

// ==================== Query Keys ====================

export const equipmentRequestKeys = {
  all: ['equipmentRequests'] as const,

  lists: () =>
    [...equipmentRequestKeys.all, 'list'] as const,

  list: (filters: EquipmentRequestFilters) =>
    [...equipmentRequestKeys.lists(), filters] as const,

  statistics: () =>
    [...equipmentRequestKeys.all, 'statistics'] as const,
}

// ==================== Queries ====================

export function useEquipmentRequestsQuery(
  filters: EquipmentRequestFilters,
  enabled = true,
) {
  return useQuery({
    queryKey: equipmentRequestKeys.list(filters),

    queryFn: () =>
      api.getEquipmentRequests(filters),

    enabled,
  })
}

export function useEquipmentRequestStatisticsQuery(
  enabled = true,
) {
  return useQuery({
    queryKey:
      equipmentRequestKeys.statistics(),

    queryFn:
      api.getEquipmentRequestStatistics,

    enabled,
  })
}

// ==================== Update Status ====================

export function useUpdateEquipmentRequestStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string
      status: EquipmentRequestStatus
    }) =>
      api.updateEquipmentRequestStatus(
        id,
        status,
      ),

    onSuccess: async (updatedRequest) => {
      /*
       * Update every cached list that already
       * contains this request.
       */
      queryClient.setQueriesData(
        {
          queryKey:
            equipmentRequestKeys.lists(),
        },
        (current: any) => {
          if (!current?.data) {
            return current
          }

          const exists = current.data.some(
            (request: EquipmentRequest) =>
              request._id === updatedRequest._id,
          )

          if (!exists) {
            return current
          }

          return {
            ...current,

            data: current.data.map(
              (request: EquipmentRequest) =>
                request._id === updatedRequest._id
                  ? updatedRequest
                  : request,
            ),
          }
        },
      )

      /*
       * Important:
       * status changes can move the request
       * from one filtered list to another,
       * so refetch all active lists.
       */
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey:
            equipmentRequestKeys.lists(),
        }),

        queryClient.invalidateQueries({
          queryKey:
            equipmentRequestKeys.statistics(),
        }),
      ])
    },
  })
}

// ==================== Delete ====================

export function useDeleteEquipmentRequestMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      api.deleteEquipmentRequest(id),

    onSuccess: async (_, deletedId) => {
      /*
       * Remove immediately from every
       * cached equipment request list.
       */
      queryClient.setQueriesData(
        {
          queryKey:
            equipmentRequestKeys.lists(),
        },
        (current: any) => {
          if (!current?.data) {
            return current
          }

          const exists = current.data.some(
            (request: EquipmentRequest) =>
              request._id === deletedId,
          )

          if (!exists) {
            return current
          }

          return {
            ...current,

            data: current.data.filter(
              (request: EquipmentRequest) =>
                request._id !== deletedId,
            ),
          }
        },
      )

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey:
            equipmentRequestKeys.lists(),
        }),

        queryClient.invalidateQueries({
          queryKey:
            equipmentRequestKeys.statistics(),
        }),
      ])
    },
  })
}