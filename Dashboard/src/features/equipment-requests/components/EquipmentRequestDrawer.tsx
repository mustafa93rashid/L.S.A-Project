import { toast } from 'sonner'
import { format } from 'date-fns'
import { Drawer } from '@/components/overlays/Drawer'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ApiError } from '@/types/api'
import { useUpdateEquipmentRequestStatusMutation } from '@/features/equipment-requests/queries'
import {
  equipmentRequestStatusLabel,
  equipmentRequestStatusTone,
} from '@/features/equipment-requests/utils'
import {
  EQUIPMENT_REQUEST_STATUSES,
  type EquipmentRequest,
  type EquipmentRequestStatus,
} from '@/features/equipment-requests/types'

interface EquipmentRequestDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** May still hold the last-selected request while the drawer animates
   * closed — the parent doesn't clear this on close, only `open`. */
  request: EquipmentRequest | null
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border py-2 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  )
}

export function EquipmentRequestDrawer({
  open,
  onOpenChange,
  request,
}: EquipmentRequestDrawerProps) {
  const statusMutation = useUpdateEquipmentRequestStatusMutation()

  const handleStatusChange = (status: EquipmentRequestStatus) => {
    if (!request) return
    statusMutation.mutate(
      { id: request._id, status },
      {
        onSuccess: () => toast.success('Equipment request status updated successfully'),
        onError: (error) => {
          toast.error(
            error instanceof ApiError ? error.message : 'Failed to update status',
          )
        },
      },
    )
  }

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={request?.fullName ?? ''}
      description={
        request ? `Requested ${request.equipment?.title ?? 'equipment'}` : undefined
      }
    >
      {request ? (
        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="status">Status</Label>
            <Select
              value={request.status}
              onValueChange={(value) =>
                handleStatusChange(value as EquipmentRequestStatus)
              }
              disabled={statusMutation.isPending}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EQUIPMENT_REQUEST_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {equipmentRequestStatusLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <StatusBadge
              label={equipmentRequestStatusLabel(request.status)}
              tone={equipmentRequestStatusTone(request.status)}
            />
          </div>

          <DetailRow label="Equipment" value={request.equipment?.title ?? '—'} />
          <DetailRow label="Email" value={request.email} />
          <DetailRow label="Phone" value={request.phone} />
          <DetailRow label="Company" value={request.company} />
          <DetailRow label="Work location" value={request.workLocation} />
          <DetailRow
            label="Estimated required days"
            value={String(request.estimatedRequiredDays)}
          />
          <DetailRow label="Work description" value={request.workDescription} />
          <DetailRow
            label="Submitted"
            value={format(new Date(request.createdAt), 'PPP p')}
          />
          {request.contactedAt ? (
            <DetailRow
              label="Contacted"
              value={format(new Date(request.contactedAt), 'PPP p')}
            />
          ) : null}
          {request.completedAt ? (
            <DetailRow
              label="Completed"
              value={format(new Date(request.completedAt), 'PPP p')}
            />
          ) : null}
          {request.updatedBy ? (
            <DetailRow label="Last updated by" value={request.updatedBy.fullName} />
          ) : null}
        </div>
      ) : null}
    </Drawer>
  )
}
