import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import { Archive, CalendarDays, CheckCircle2, Filter, Mail, MailOpen, Search, Trash2, UserRound, X } from 'lucide-react'

import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable } from '@/components/data-table/DataTable'
import { Pagination } from '@/components/data-table/Pagination'
import { StatCard } from '@/components/data-display/StatCard'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { ConfirmDialog } from '@/components/overlays/ConfirmDialog'

import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useSessionStore } from '@/stores/session.store'
import { ROLES } from '@/constants/roles'
import { ApiError } from '@/types/api'

import { useContactMessagesQuery, useContactMessageStatisticsQuery, useDeleteContactMessageMutation } from '@/features/contact-messages/queries'
import { contactMessageStatusLabel, contactMessageStatusTone } from '@/features/contact-messages/utils'
import { CONTACT_MESSAGE_SERVICES, CONTACT_MESSAGE_STATUSES, type ContactMessage, type ContactMessageService, type ContactMessageStatus } from '@/features/contact-messages/types'
import { ContactMessageDrawer } from '@/features/contact-messages/components/ContactMessageDrawer'
import { SectionHeader } from '@/components/layout/SectionHeader'

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

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)
  const [deletingMessage, setDeletingMessage] = useState<ContactMessage | null>(null)

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

  const messages = data?.data ?? []
  const hasActiveFilters = Boolean(search) || status !== ALL || service !== ALL

  const clearFilters = () => {
    setSearch('')
    setStatus(ALL)
    setService(ALL)
    setPage(1)
  }

  const columns = useMemo<ColumnDef<ContactMessage, unknown>[]>(() => {
    const base: ColumnDef<ContactMessage, unknown>[] = [
      {
        accessorKey: 'fullName',
        header: 'Sender',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/35 text-muted-foreground">
              <UserRound className="size-4" strokeWidth={1.8} aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight text-foreground">{row.original.fullName}</p>
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">Contact inquiry</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Mail className="size-3.5 shrink-0 text-muted-foreground/45" strokeWidth={1.8} aria-hidden="true" />
            <span className="max-w-[220px] truncate text-sm text-foreground">{row.original.email}</span>
          </div>
        ),
      },
      {
        accessorKey: 'service',
        header: 'Service',
        cell: ({ row }) => <span className="inline-flex max-w-[200px] truncate rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">{row.original.service}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge label={contactMessageStatusLabel(row.original.status)} tone={contactMessageStatusTone(row.original.status)} />,
      },
      {
        accessorKey: 'createdAt',
        header: 'Submitted',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <CalendarDays className="size-3.5 shrink-0 text-muted-foreground/45" strokeWidth={1.8} aria-hidden="true" />
            <span className="text-[12px] font-medium text-muted-foreground tabular-nums">{format(new Date(row.original.createdAt), 'MMM d, yyyy')}</span>
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
              aria-label={`Delete message from ${row.original.fullName}`}
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              onClick={(event) => {
                event.stopPropagation()
                setDeletingMessage(row.original)
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
    if (!deletingMessage) return

    const isLastRowOnPage = data?.data.length === 1 && page > 1

    deleteMutation.mutate(deletingMessage._id, {
      onSuccess: () => {
        toast.success('Contact message deleted successfully')
        setDeletingMessage(null)

        if (isLastRowOnPage) setPage((current) => current - 1)
      },
      onError: (error) => {
        toast.error(error instanceof ApiError ? error.message : 'Failed to delete message')
      },
    })
  }

  return (
    <PageContainer className="max-w-6xl">
      <div className="space-y-7">
        <PageHeader title="Contact Messages" description="Review and manage inquiries submitted through the public contact form." />

        {statistics ? (

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard index="01" label="Total Messages" value={statistics.total} icon={Mail} />
              <StatCard index="02" label="New Messages" value={statistics.new} icon={MailOpen} tone="info" />
              <StatCard index="03" label="Replied" value={statistics.replied} icon={CheckCircle2} tone="success" />
              <StatCard index="04" label="Archived" value={statistics.archived} icon={Archive} />
            </div>
        ) : null}

<section className="space-y-5">
  <SectionHeader
    eyebrow="Message Management"
    title="Contact Inbox"
    description="Search, filter and review incoming customer inquiries."
    icon={Mail}
    statLabel="Messages"
  />

  <div className="rounded-[22px] border border-border/70 bg-card p-4 shadow-[0_1px_3px_rgba(0,0,0,0.025)] sm:p-5">
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
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
          placeholder="Search by name, email, phone, or message…"
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

      <div className="hidden shrink-0 items-center gap-2 px-1 text-[10px] font-semibold tracking-[0.1em] text-muted-foreground/55 uppercase xl:flex">
        <Filter
          className="size-3.5"
          strokeWidth={1.8}
          aria-hidden="true"
        />
        Filters
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:flex xl:shrink-0">
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value)
            setPage(1)
          }}
        >
          <SelectTrigger
            aria-label="Filter by status"
            className="h-11 w-full rounded-xl border-border/70 bg-background px-3.5 shadow-none sm:min-w-[180px] xl:w-[190px]"
          >
            <SelectValue placeholder="Status" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value={ALL}>
              All statuses
            </SelectItem>

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
          <SelectTrigger
            aria-label="Filter by service"
            className="h-11 w-full rounded-xl border-border/70 bg-background px-3.5 shadow-none sm:min-w-[210px] xl:w-[230px]"
          >
            <SelectValue placeholder="Service" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value={ALL}>
              All services
            </SelectItem>

            {CONTACT_MESSAGE_SERVICES.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>

    {hasActiveFilters ? (
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3.5">
        <span className="mr-1 text-[9px] font-semibold tracking-[0.1em] text-muted-foreground/50 uppercase">
          Active filters
        </span>

        {search ? (
          <span className="inline-flex max-w-[260px] items-center gap-1.5 rounded-lg border border-border/70 bg-muted/25 px-2.5 py-1.5 text-[11px]">
            <span className="font-medium text-foreground">
              Search
            </span>

            <span className="truncate text-muted-foreground">
              {search}
            </span>
          </span>
        ) : null}

        {status !== ALL ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-muted/25 px-2.5 py-1.5 text-[11px]">
            <span className="font-medium text-foreground">
              Status
            </span>

            <span className="text-muted-foreground">
              {contactMessageStatusLabel(
                status as ContactMessageStatus,
              )}
            </span>
          </span>
        ) : null}

        {service !== ALL ? (
          <span className="inline-flex max-w-[260px] items-center gap-1.5 rounded-lg border border-border/70 bg-muted/25 px-2.5 py-1.5 text-[11px]">
            <span className="font-medium text-foreground">
              Service
            </span>

            <span className="truncate text-muted-foreground">
              {service}
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
      data={messages}
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

        <ContactMessageDrawer open={drawerOpen} onOpenChange={setDrawerOpen} message={selectedMessage} />

        <ConfirmDialog
          open={Boolean(deletingMessage)}
          onOpenChange={(open) => {
            if (!open) setDeletingMessage(null)
          }}
          title="Delete contact message"
          description={`Are you sure you want to delete the message from "${deletingMessage?.fullName}"? This cannot be undone.`}
          variant="destructive"
          confirmLabel="Delete"
          onConfirm={handleDelete}
          isLoading={deleteMutation.isPending}
        />
      </div>
    </PageContainer>
  )
}
