import type { StatusTone } from '@/components/data-display/StatusBadge'
import type { EquipmentRequestStatus } from '@/features/equipment-requests/types'

/** Feature-local status -> tone mapping, per instruction not to move this
 * into the shared layer — StatusBadge itself stays resource-agnostic. */
export function equipmentRequestStatusTone(status: EquipmentRequestStatus): StatusTone {
  switch (status) {
    case 'new':
      return 'info'
    case 'contacted':
    case 'quoted':
      return 'warning'
    case 'approved':
    case 'completed':
      return 'success'
    case 'rejected':
      return 'danger'
  }
}

export function equipmentRequestStatusLabel(status: EquipmentRequestStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}
