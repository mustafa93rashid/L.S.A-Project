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
import { useUpdateContactMessageStatusMutation } from '@/features/contact-messages/queries'
import {
  contactMessageStatusLabel,
  contactMessageStatusTone,
} from '@/features/contact-messages/utils'
import {
  CONTACT_MESSAGE_STATUSES,
  type ContactMessage,
  type ContactMessageStatus,
} from '@/features/contact-messages/types'

interface ContactMessageDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  message: ContactMessage | null
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border py-2 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  )
}

export function ContactMessageDrawer({
  open,
  onOpenChange,
  message,
}: ContactMessageDrawerProps) {
  const statusMutation = useUpdateContactMessageStatusMutation()

  const handleStatusChange = (status: ContactMessageStatus) => {
    if (!message) return
    statusMutation.mutate(
      { id: message._id, status },
      {
        onSuccess: () => toast.success('Contact message status updated successfully'),
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
      title={message?.fullName ?? ''}
      description={message?.service}
    >
      {message ? (
        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="status">Status</Label>
            <Select
              value={message.status}
              onValueChange={(value) => handleStatusChange(value as ContactMessageStatus)}
              disabled={statusMutation.isPending}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTACT_MESSAGE_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {contactMessageStatusLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <StatusBadge
              label={contactMessageStatusLabel(message.status)}
              tone={contactMessageStatusTone(message.status)}
            />
          </div>

          <DetailRow label="Email" value={message.email} />
          <DetailRow label="Phone" value={message.phone} />
          <DetailRow label="Service" value={message.service} />
          <DetailRow label="Message" value={message.projectDescription} />
          <DetailRow
            label="Submitted"
            value={format(new Date(message.createdAt), 'PPP p')}
          />
          {message.repliedAt ? (
            <DetailRow
              label="Replied"
              value={format(new Date(message.repliedAt), 'PPP p')}
            />
          ) : null}
          {message.updatedBy ? (
            <DetailRow label="Last updated by" value={message.updatedBy.fullName} />
          ) : null}
        </div>
      ) : null}
    </Drawer>
  )
}
