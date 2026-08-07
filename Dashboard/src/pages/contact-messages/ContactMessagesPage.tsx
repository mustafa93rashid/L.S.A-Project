import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import { Mail, Trash2 } from 'lucide-react'
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
  useContactMessagesQuery,
  useContactMessageStatisticsQuery,
  useDeleteContactMessageMutation,
} from '@/features/contact-messages/queries'
import {
  contactMessageStatusLabel,
  contactMessageStatusTone,
} from '@/features/contact-messages/utils'
import {
  CONTACT_MESSAGE_SERVICES,
  CONTACT_MESSAGE_STATUSES,
  type ContactMessage,
  type ContactMessageService,
  type ContactMessageStatus,
} from '@/features/contact-messages/types'
import { ContactMessageDrawer } from '@/features/contact-messages/components/ContactMessageDrawer'

const ALL = 'all'
const DEFAULT_LIMIT = 20

export default function ContactMessagesPage() {
  const role = useSessionStore((state) => state.user?.role)
  const canDelete = role === ROLES.SUPERADMIN

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [status, setStatus] = useState<string>(ALL)
  const [service, setService] = useState<string>(ALL)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_LIMIT)

  const filters = useMemo(
    () => ({
      status: status === ALL ? undefined : (status as ContactMessageStatus),
      service: service === ALL ? undefined : (service as ContactMessageService),
      search: debouncedSearch || undefined,
      page,
      limit,
    }),
    [status, service, debouncedSearch, page, limit],
  )

  const { data, isLoading, isError, refetch } = useContactMessagesQuery(filters)
  const { data: statistics } = useContactMessageStatisticsQuery()
  const deleteMutation = useDeleteContactMessageMutation()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)
  const [deletingMessage, setDeletingMessage] = useState<ContactMessage | null>(null)

  const columns = useMemo<ColumnDef<ContactMessage, unknown>[]>(() => {
    const base: ColumnDef<ContactMessage, unknown>[] = [
      { accessorKey: 'fullName', header: 'Name' },
      { accessorKey: 'email', header: 'Email' },
      { accessorKey: 'service', header: 'Service' },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <StatusBadge
            label={contactMessageStatusLabel(row.original.status)}
            tone={contactMessageStatusTone(row.original.status)}
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
            aria-label={`Delete message from ${row.original.fullName}`}
            onClick={(event) => {
              event.stopPropagation()
              setDeletingMessage(row.original)
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
    if (!deletingMessage) return
    const isLastRowOnPage = data?.data.length === 1 && page > 1
    deleteMutation.mutate(deletingMessage._id, {
      onSuccess: () => {
        toast.success('Contact message deleted successfully')
        setDeletingMessage(null)
        if (isLastRowOnPage) setPage((current) => current - 1)
      },
      onError: (error) => {
        toast.error(
          error instanceof ApiError ? error.message : 'Failed to delete message',
        )
      },
    })
  }

  return (
    <PageContainer>
      <PageHeader
        title="Contact Messages"
        description="Inquiries submitted through the public contact form."
      />

      {statistics ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total" value={statistics.total} />
          <StatCard label="New" value={statistics.new} tone="info" />
          <StatCard label="Replied" value={statistics.replied} tone="success" />
          <StatCard label="Archived" value={statistics.archived} />
        </div>
      ) : null}

      <TableToolbar
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value)
          setPage(1)
        }}
        searchPlaceholder="Search by name, email, phone, or message…"
        filters={
          <>
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
                <SelectItem value={ALL}>All statuses</SelectItem>
                {CONTACT_MESSAGE_STATUSES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {contactMessageStatusLabel(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={service}
              onValueChange={(value) => {
                setService(value)
                setPage(1)
              }}
            >
              <SelectTrigger size="sm" aria-label="Filter by service">
                <SelectValue placeholder="Service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All services</SelectItem>
                {CONTACT_MESSAGE_SERVICES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
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
          setSelectedMessage(row)
          setDrawerOpen(true)
        }}
        emptyState={{
          icon: Mail,
          title: 'No contact messages found',
          description:
            'Try adjusting your filters — new inquiries will appear here as they arrive.',
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

      <ContactMessageDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        message={selectedMessage}
      />

      <ConfirmDialog
        open={Boolean(deletingMessage)}
        onOpenChange={(open) => !open && setDeletingMessage(null)}
        title="Delete contact message"
        description={`Are you sure you want to delete the message from "${deletingMessage?.fullName}"? This cannot be undone.`}
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  )
}
