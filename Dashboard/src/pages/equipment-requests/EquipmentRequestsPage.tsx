import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import { Inbox, Trash2 } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/data-table/DataTable'
import { TableToolbar } from '@/components/data-table/TableToolbar'
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

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<EquipmentRequest | null>(null)
  const [deletingRequest, setDeletingRequest] = useState<EquipmentRequest | null>(null)

  const columns = useMemo<ColumnDef<EquipmentRequest, unknown>[]>(() => {
    const base: ColumnDef<EquipmentRequest, unknown>[] = [
      { accessorKey: 'fullName', header: 'Name' },
      { accessorKey: 'company', header: 'Company' },
      {
        id: 'equipment',
        header: 'Equipment',
        cell: ({ row }) => row.original.equipment?.title ?? '—',
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
        cell: ({ row }) => format(new Date(row.original.createdAt), 'PP'),
      },
    ]

    if (canDelete) {
      base.push({
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        meta: { hideOnMobile: true },
        cell: ({ row }) => (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete request from ${row.original.fullName}`}
            onClick={(event) => {
              event.stopPropagation()
              setDeletingRequest(row.original)
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        ),
      })
    }

    return base
  }, [canDelete])

  const handleDelete = () => {
    if (!deletingRequest) return
    // If this is the only row left on a page beyond the first, step back a
    // page rather than leaving the user stranded on a now-empty page.
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
    <PageContainer>
      <PageHeader
        title="Equipment Requests"
        description="Leads submitted through the public equipment request form."
      />

      {statistics ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Total" value={statistics.total} />
          <StatCard label="New" value={statistics.new} tone="info" />
          <StatCard label="Contacted" value={statistics.contacted} tone="warning" />
          <StatCard label="Quoted" value={statistics.quoted} tone="warning" />
          <StatCard label="Approved" value={statistics.approved} tone="success" />
          <StatCard label="Completed" value={statistics.completed} tone="success" />
        </div>
      ) : null}

      <TableToolbar
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value)
          setPage(1)
        }}
        searchPlaceholder="Search by name, email, phone, or company…"
        filters={
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value)
              setPage(1)
            }}
          >
            <SelectTrigger size="sm" aria-label="Filter by status">
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
        }
      />

      <DataTable
        columns={columns}
        data={data?.data ?? []}
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

      {data ? (
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
      ) : null}

      <EquipmentRequestDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        request={selectedRequest}
      />

      <ConfirmDialog
        open={Boolean(deletingRequest)}
        onOpenChange={(open) => !open && setDeletingRequest(null)}
        title="Delete equipment request"
        description={`Are you sure you want to delete the request from "${deletingRequest?.fullName}"? This cannot be undone.`}
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  )
}
