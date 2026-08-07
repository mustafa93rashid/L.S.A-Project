import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/features/equipment-requests/api'
import type {
  EquipmentRequestFilters,
  EquipmentRequestStatus,
} from '@/features/equipment-requests/types'

export const equipmentRequestKeys = {
  all: ['equipmentRequests'] as const,
  list: (filters: EquipmentRequestFilters) =>
    [...equipmentRequestKeys.all, 'list', filters] as const,
  statistics: () => [...equipmentRequestKeys.all, 'statistics'] as const,
}

export function useEquipmentRequestsQuery(
  filters: EquipmentRequestFilters,
  enabled = true,
) {
  return useQuery({
    queryKey: equipmentRequestKeys.list(filters),
    queryFn: () => api.getEquipmentRequests(filters),
    enabled,
  })
}

export function useEquipmentRequestStatisticsQuery(enabled = true) {
  return useQuery({
    queryKey: equipmentRequestKeys.statistics(),
    queryFn: api.getEquipmentRequestStatistics,
    enabled,
  })
}

export function useUpdateEquipmentRequestStatusMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: EquipmentRequestStatus }) =>
      api.updateEquipmentRequestStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentRequestKeys.all })
    },
  })
}

export function useDeleteEquipmentRequestMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteEquipmentRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentRequestKeys.all })
    },
  })
}
