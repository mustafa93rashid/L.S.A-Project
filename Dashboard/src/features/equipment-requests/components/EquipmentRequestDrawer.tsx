import { toast } from 'sonner'
import { format } from 'date-fns'
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Mail,
  MapPin,
  Phone,
  UserRound,
  Wrench,
} from 'lucide-react'

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
import { Separator } from '@/components/ui/separator'

import { cn } from '@/lib/utils'
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

// ==================== Types ====================

interface EquipmentRequestDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: EquipmentRequest | null
}

interface DetailItemProps {
  icon: React.ElementType
  label: string
  value: React.ReactNode
  className?: string
}

interface TimelineItemProps {
  icon: React.ElementType
  label: string
  value: string
  isLast?: boolean
}

// ==================== Detail Item ====================

function DetailItem({
  icon: Icon,
  label,
  value,
  className,
}: DetailItemProps) {
  return (
    <div
      className={cn(
        'flex min-w-0 items-start gap-3 p-4',
        className,
      )}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          {label}
        </p>

        <div className="mt-1.5 break-words text-sm font-medium leading-5 text-foreground">
          {value || '—'}
        </div>
      </div>
    </div>
  )
}

// ==================== Section ====================

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          {title}
        </h3>

        {description ? (
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>

      {children}
    </section>
  )
}

// ==================== Timeline Item ====================

function TimelineItem({
  icon: Icon,
  label,
  value,
  isLast = false,
}: TimelineItemProps) {
  return (
    <div className="relative flex gap-3">
      {!isLast ? (
        <span
          className="absolute top-9 left-[17px] h-[calc(100%-12px)] w-px bg-border"
          aria-hidden="true"
        />
      ) : null}

      <div className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-xs">
        <Icon className="size-4" />
      </div>

      <div className="min-w-0 flex-1 pb-5">
        <p className="text-xs font-medium text-muted-foreground">
          {label}
        </p>

        <p className="mt-1 text-sm font-medium text-foreground">
          {value}
        </p>
      </div>
    </div>
  )
}

// ==================== Drawer ====================

export function EquipmentRequestDrawer({
  open,
  onOpenChange,
  request,
}: EquipmentRequestDrawerProps) {
  const statusMutation =
    useUpdateEquipmentRequestStatusMutation()

  const handleStatusChange = (
    status: EquipmentRequestStatus,
  ) => {
    if (!request) return

    statusMutation.mutate(
      {
        id: request._id,
        status,
      },
      {
        onSuccess: () => {
          toast.success(
            'Equipment request status updated successfully',
          )
        },

        onError: (error) => {
          toast.error(
            error instanceof ApiError
              ? error.message
              : 'Failed to update status',
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
        request
          ? `Equipment request • ${request.equipment?.title ?? 'Unknown equipment'}`
          : undefined
      }
    >
      {request ? (
        <div className="flex flex-col gap-7 py-5">
          {/* ==================== Request Overview ==================== */}

          <section className="overflow-hidden rounded-2xl border border-border/70 bg-card">
            <div className="flex items-center gap-4 p-5">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Wrench className="size-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                  Requested equipment
                </p>

                <h2 className="mt-1 text-base font-semibold tracking-tight text-foreground">
                  {request.equipment?.title ?? 'Unknown equipment'}
                </h2>

                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="size-3.5" />

                  {format(
                    new Date(request.createdAt),
                    'PPP p',
                  )}
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-3 divide-x divide-border">
              <div className="px-4 py-3.5">
                <p className="text-[10px] font-medium text-muted-foreground">
                  Duration
                </p>

                <p className="mt-1 text-sm font-semibold text-foreground">
                  {request.estimatedRequiredDays}{' '}
                  {request.estimatedRequiredDays === 1
                    ? 'day'
                    : 'days'}
                </p>
              </div>

              <div className="px-4 py-3.5">
                <p className="text-[10px] font-medium text-muted-foreground">
                  Location
                </p>

                <p className="mt-1 truncate text-sm font-semibold text-foreground">
                  {request.workLocation || '—'}
                </p>
              </div>

              <div className="px-4 py-3.5">
                <p className="text-[10px] font-medium text-muted-foreground">
                  Company
                </p>

                <p className="mt-1 truncate text-sm font-semibold text-foreground">
                  {request.company || '—'}
                </p>
              </div>
            </div>
          </section>

          {/* ==================== Status ==================== */}

          <Section
            title="Request status"
            description="Manage the request through its operational workflow."
          >
            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
              <div className="flex items-end gap-4">
                <div className="min-w-0 flex-1 space-y-2">
                  <Label
                    htmlFor="equipment-request-status"
                    className="text-xs"
                  >
                    Status
                  </Label>

                  <Select
                    value={request.status}
                    onValueChange={(value) =>
                      handleStatusChange(
                        value as EquipmentRequestStatus,
                      )
                    }
                    disabled={statusMutation.isPending}
                  >
                    <SelectTrigger
                      id="equipment-request-status"
                      className="h-11 rounded-xl bg-background"
                    >
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      {EQUIPMENT_REQUEST_STATUSES.map(
                        (status) => (
                          <SelectItem
                            key={status}
                            value={status}
                          >
                            {equipmentRequestStatusLabel(
                              status,
                            )}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="pb-2">
                  <StatusBadge
                    label={equipmentRequestStatusLabel(
                      request.status,
                    )}
                    tone={equipmentRequestStatusTone(
                      request.status,
                    )}
                  />
                </div>
              </div>
            </div>
          </Section>

          {/* ==================== Contact ==================== */}

          <Section
            title="Contact information"
            description="Primary contact details for the requester."
          >
            <div className="grid overflow-hidden rounded-2xl border border-border/70 bg-card sm:grid-cols-2">
              <DetailItem
                icon={Mail}
                label="Email address"
                value={
                  <a
                    href={`mailto:${request.email}`}
                    className="transition-colors hover:text-primary"
                  >
                    {request.email}
                  </a>
                }
                className="border-b border-border sm:border-r"
              />

              <DetailItem
                icon={Phone}
                label="Phone number"
                value={
                  <a
                    href={`tel:${request.phone}`}
                    className="transition-colors hover:text-primary"
                  >
                    {request.phone}
                  </a>
                }
                className="border-b border-border"
              />

              <DetailItem
                icon={Building2}
                label="Company"
                value={request.company}
                className="sm:border-r"
              />

              <DetailItem
                icon={MapPin}
                label="Work location"
                value={request.workLocation}
              />
            </div>
          </Section>

          {/* ==================== Work Description ==================== */}

          <Section
            title="Work description"
            description="Scope and requirements submitted with the request."
          >
            <div className="rounded-2xl border border-border/70 bg-card p-5">
              <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
                {request.workDescription || '—'}
              </p>
            </div>
          </Section>

          {/* ==================== Activity ==================== */}

          <Section
            title="Activity"
            description="Request lifecycle and administrative updates."
          >
            <div className="rounded-2xl border border-border/70 bg-card p-5">
              <TimelineItem
                icon={CalendarDays}
                label="Request submitted"
                value={format(
                  new Date(request.createdAt),
                  'PPP p',
                )}
                isLast={
                  !request.contactedAt &&
                  !request.completedAt &&
                  !request.updatedBy
                }
              />

              {request.contactedAt ? (
                <TimelineItem
                  icon={Phone}
                  label="Requester contacted"
                  value={format(
                    new Date(request.contactedAt),
                    'PPP p',
                  )}
                  isLast={
                    !request.completedAt &&
                    !request.updatedBy
                  }
                />
              ) : null}

              {request.completedAt ? (
                <TimelineItem
                  icon={CheckCircle2}
                  label="Request completed"
                  value={format(
                    new Date(request.completedAt),
                    'PPP p',
                  )}
                  isLast={!request.updatedBy}
                />
              ) : null}

              {request.updatedBy ? (
                <TimelineItem
                  icon={UserRound}
                  label="Last updated by"
                  value={request.updatedBy.fullName}
                  isLast
                />
              ) : null}
            </div>
          </Section>
        </div>
      ) : null}
    </Drawer>
  )
}