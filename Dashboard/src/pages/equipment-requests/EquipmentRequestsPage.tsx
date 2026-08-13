import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  FileCheck2,
  Filter,
  Inbox,
  MessageCircleMore,
  Search,
  Trash2,
  UserRound,
  Wrench,
  X,
} from 'lucide-react'

import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/data-table/DataTable'
import { Pagination } from '@/components/data-table/Pagination'
import { StatCard } from '@/components/data-display/StatCard'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { ConfirmDialog } from '@/components/overlays/ConfirmDialog'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useSessionStore } from '@/stores/session.store'
import { ROLES } from '@/constants/roles'
import { ApiError } from '@/types/api'

import {
  useDeleteEquipmentRequestMutation,
  useEquipmentRequestsQuery,
  useEquipmentRequestStatisticsQuery,
} from '@/features/equipment-requests/queries'
import {
  equipmentRequestStatusLabel,
  equipmentRequestStatusTone,
} from '@/features/equipment-requests/utils'
import {
  EQUIPMENT_REQUEST_STATUSES,
  type EquipmentRequest,
  type EquipmentRequestStatus,
} from '@/features/equipment-requests/types'
import { EquipmentRequestDrawer } from '@/features/equipment-requests/components/EquipmentRequestDrawer'
import { SectionHeader } from '@/components/layout/SectionHeader'

const ALL_STATUSES = 'all'
const DEFAULT_LIMIT = 20

export default function EquipmentRequestsPage() {
  const role = useSessionStore((state) => state.user?.role)
  const canDelete = role === ROLES.SUPERADMIN

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [status, setStatus] = useState<string>(ALL_STATUSES)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_LIMIT)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<EquipmentRequest | null>(null)
  const [deletingRequest, setDeletingRequest] = useState<EquipmentRequest | null>(null)

  const filters = useMemo(
    () => ({
      status: status === ALL_STATUSES ? undefined : (status as EquipmentRequestStatus),
      search: debouncedSearch || undefined,
      page,
      limit,
    }),
    [status, debouncedSearch, page, limit],
  )

  const { data, isLoading, isError, refetch } = useEquipmentRequestsQuery(filters)
  const { data: statistics } = useEquipmentRequestStatisticsQuery()
  const deleteMutation = useDeleteEquipmentRequestMutation()

  const requests = data?.data ?? []
  const hasActiveFilters = Boolean(search) || status !== ALL_STATUSES

  const clearFilters = () => {
    setSearch('')
    setStatus(ALL_STATUSES)
    setPage(1)
  }

  const columns = useMemo<ColumnDef<EquipmentRequest, unknown>[]>(() => {
    const base: ColumnDef<EquipmentRequest, unknown>[] = [
      {
        accessorKey: 'fullName',
        header: 'Requester',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/35 text-muted-foreground">
              <UserRound className="size-4" strokeWidth={1.8} aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight text-foreground">
                {row.original.fullName}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                Equipment request
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'company',
        header: 'Company',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Building2
              className="size-3.5 shrink-0 text-muted-foreground/45"
              strokeWidth={1.8}
              aria-hidden="true"
            />
            <span className="max-w-[180px] truncate text-sm text-foreground">
              {row.original.company || '—'}
            </span>
          </div>
        ),
      },
      {
        id: 'equipment',
        header: 'Equipment',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Wrench
              className="size-3.5 shrink-0 text-muted-foreground/45"
              strokeWidth={1.8}
              aria-hidden="true"
            />
            <span className="max-w-[200px] truncate text-sm font-medium text-foreground">
              {row.original.equipment?.title ?? '—'}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <StatusBadge
            label={equipmentRequestStatusLabel(row.original.status)}
            tone={equipmentRequestStatusTone(row.original.status)}
          />
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Submitted',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <CalendarDays
              className="size-3.5 shrink-0 text-muted-foreground/45"
              strokeWidth={1.8}
              aria-hidden="true"
            />
            <span className="text-[12px] font-medium text-muted-foreground tabular-nums">
              {format(new Date(row.original.createdAt), 'MMM d, yyyy')}
            </span>
          </div>
        ),
      },
    ]

    if (canDelete) {
      base.push({
        id: 'actions',
        header: '',
        enableSorting: false,
        meta: { hideOnMobile: true },
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Delete request from ${row.original.fullName}`}
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              onClick={(event) => {
                event.stopPropagation()
                setDeletingRequest(row.original)
              }}
            >
              <Trash2 className="size-4" strokeWidth={1.8} />
            </Button>
          </div>
        ),
      })
    }

    return base
  }, [canDelete])

  const handleDelete = () => {
    if (!deletingRequest) return

    const isLastRowOnPage = data?.data.length === 1 && page > 1

    deleteMutation.mutate(deletingRequest._id, {
      onSuccess: () => {
        toast.success('Equipment request deleted successfully')
        setDeletingRequest(null)
        if (isLastRowOnPage) setPage((current) => current - 1)
      },
      onError: (error) => {
        toast.error(
          error instanceof ApiError ? error.message : 'Failed to delete request',
        )
      },
    })
  }

  return (
    <PageContainer className="max-w-6xl">
      <div className="space-y-7">
        <PageHeader
          title="Equipment Requests"
          description="Review and manage equipment leads submitted through the public request form."
        />

        {statistics ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard
              index="01"
              label="Total Requests"
              value={statistics.total}
              icon={Inbox}
            />
            <StatCard
              index="02"
              label="New"
              value={statistics.new}
              icon={CircleDot}
              tone="info"
            />
            <StatCard
              index="03"
              label="Contacted"
              value={statistics.contacted}
              icon={MessageCircleMore}
              tone="warning"
            />
            <StatCard
              index="04"
              label="Quoted"
              value={statistics.quoted}
              icon={FileCheck2}
              tone="warning"
            />
            <StatCard
              index="05"
              label="Approved"
              value={statistics.approved}
              icon={CheckCircle2}
              tone="success"
            />
            <StatCard
              index="06"
              label="Completed"
              value={statistics.completed}
              icon={CheckCircle2}
              tone="success"
            />
          </div>
        ) : null}

        <section className="space-y-5">
          <SectionHeader
            eyebrow="Request Management"
            title="Equipment Requests"
            description="Search, filter and review incoming customer equipment requests."
            icon={Inbox}
            statLabel="Requests"
          />

          <div className="rounded-[22px] border border-border/70 bg-card p-4 shadow-[0_1px_3px_rgba(0,0,0,0.025)] sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative min-w-0 flex-1">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground/45"
                  strokeWidth={1.8}
                  aria-hidden="true"
                />

                <Input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value)
                    setPage(1)
                  }}
                  placeholder="Search by name, email, phone, or company…"
                  className="h-11 w-full rounded-xl border-border/70 bg-background pl-11 pr-11 text-[13px] shadow-none"
                />

                {search ? (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                      setSearch('')
                      setPage(1)
                    }}
                    className="absolute right-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground/45 transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                ) : null}
              </div>

              <div className="hidden shrink-0 items-center gap-2 px-1 text-[10px] font-semibold tracking-[0.1em] text-muted-foreground/55 uppercase lg:flex">
                <Filter className="size-3.5" strokeWidth={1.8} aria-hidden="true" />
                Filters
              </div>

              <Select
                value={status}
                onValueChange={(value) => {
                  setStatus(value)
                  setPage(1)
                }}
              >
                <SelectTrigger
                  aria-label="Filter by status"
                  className="h-11 w-full rounded-xl border-border/70 bg-background px-3.5 shadow-none sm:min-w-[190px] lg:w-[210px]"
                >
                  <SelectValue placeholder="Status" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>

                  {EQUIPMENT_REQUEST_STATUSES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {equipmentRequestStatusLabel(value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters ? (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3.5">
                <span className="mr-1 text-[9px] font-semibold tracking-[0.1em] text-muted-foreground/50 uppercase">
                  Active filters
                </span>

                {search ? (
                  <span className="inline-flex max-w-[260px] items-center gap-1.5 rounded-lg border border-border/70 bg-muted/25 px-2.5 py-1.5 text-[11px]">
                    <span className="font-medium text-foreground">Search</span>

                    <span className="truncate text-muted-foreground">{search}</span>
                  </span>
                ) : null}

                {status !== ALL_STATUSES ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-muted/25 px-2.5 py-1.5 text-[11px]">
                    <span className="font-medium text-foreground">Status</span>

                    <span className="text-muted-foreground">
                      {equipmentRequestStatusLabel(status as EquipmentRequestStatus)}
                    </span>
                  </span>
                ) : null}

                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={clearFilters}
                  className="ml-auto text-muted-foreground"
                >
                  <X className="size-3" />
                  Clear all
                </Button>
              </div>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-[22px] border border-border/70 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.025)]">
            <DataTable
              columns={columns}
              data={requests}
              getRowId={(row) => row._id}
              isLoading={isLoading}
              isError={isError}
              onRetry={() => refetch()}
              onRowClick={(row) => {
                setSelectedRequest(row)
                setDrawerOpen(true)
              }}
              emptyState={{
                icon: Inbox,
                title: 'No equipment requests found',
                description:
                  'Try adjusting your filters — new requests will appear here as they arrive.',
              }}
            />
          </div>

          {data ? (
            <div>
              <Pagination
                page={data.pagination.page}
                totalPages={data.pagination.totalPages}
                hasNextPage={data.pagination.hasNextPage}
                hasPreviousPage={data.pagination.hasPreviousPage}
                onPageChange={setPage}
                limit={limit}
                limitOptions={[10, 20, 50, 100]}
                onLimitChange={(value) => {
                  setLimit(value)
                  setPage(1)
                }}
              />
            </div>
          ) : null}
        </section>

        <EquipmentRequestDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          request={selectedRequest}
        />

        <ConfirmDialog
          open={Boolean(deletingRequest)}
          onOpenChange={(open) => {
            if (!open) setDeletingRequest(null)
          }}
          title="Delete equipment request"
          description={`Are you sure you want to delete the request from "${deletingRequest?.fullName}"? This cannot be undone.`}
          variant="destructive"
          confirmLabel="Delete"
          onConfirm={handleDelete}
          isLoading={deleteMutation.isPending}
        />
      </div>
    </PageContainer>
  )
}
