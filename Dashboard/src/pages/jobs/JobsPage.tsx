import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { format } from 'date-fns'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import { Briefcase, Pencil, Plus, Trash2 } from 'lucide-react'
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
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { ConfirmDialog } from '@/components/overlays/ConfirmDialog'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useSessionStore } from '@/stores/session.store'
import { ROLES } from '@/constants/roles'
import { ApiError } from '@/types/api'
import { useDeleteJobMutation, useJobsQuery } from '@/features/jobs/queries'
import { jobStatusLabel, jobStatusTone } from '@/features/jobs/utils'
import { JOB_STATUSES, type Job, type JobStatus } from '@/features/jobs/types'

const ALL = 'all'
const DEFAULT_LIMIT = 10

export default function JobsPage() {
  const role = useSessionStore((state) => state.user?.role)
  const canDelete = role === ROLES.SUPERADMIN

  const [searchParams, setSearchParams] = useSearchParams()

  // Filters + pagination live in the URL so navigating to Create/Edit and
  // back preserves exactly what was being viewed.
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const debouncedSearch = useDebouncedValue(search)
  const status = searchParams.get('status') ?? ALL
  const page = Number(searchParams.get('page')) || 1
  const limit = Number(searchParams.get('limit')) || DEFAULT_LIMIT

  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (debouncedSearch) next.set('q', debouncedSearch)
        else next.delete('q')
        next.set('page', '1')
        return next
      },
      { replace: true },
    )
    // Only the debounced search text should trigger this sync.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const setStatus = (value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value === ALL) next.delete('status')
      else next.set('status', value)
      next.set('page', '1')
      return next
    })
  }

  const setPage = (value: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('page', String(value))
      return next
    })
  }

  const setLimit = (value: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('limit', String(value))
      next.set('page', '1')
      return next
    })
  }

  const filters = useMemo(
    () => ({
      status: status === ALL ? undefined : (status as JobStatus),
      search: debouncedSearch || undefined,
      page,
      limit,
    }),
    [status, debouncedSearch, page, limit],
  )

  const { data, isLoading, isError, refetch } = useJobsQuery(filters)
  const deleteMutation = useDeleteJobMutation()

  const [deletingJob, setDeletingJob] = useState<Job | null>(null)

  const columns = useMemo<ColumnDef<Job, unknown>[]>(() => {
    const base: ColumnDef<Job, unknown>[] = [
      { accessorKey: 'title', header: 'Title' },
      { accessorKey: 'department', header: 'Department' },
      { accessorKey: 'employmentType', header: 'Type' },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <StatusBadge
            label={jobStatusLabel(row.original.status)}
            tone={jobStatusTone(row.original.status)}
          />
        ),
      },
      {
        id: 'deadline',
        header: 'Deadline',
        cell: ({ row }) =>
          row.original.deadline ? format(new Date(row.original.deadline), 'PP') : '—',
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        meta: { hideOnMobile: true },
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Edit ${row.original.title}`}
              asChild
            >
              <Link to={`/jobs/${row.original._id}/edit`}>
                <Pencil className="size-4" />
              </Link>
            </Button>
            {canDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Delete ${row.original.title}`}
                onClick={() => setDeletingJob(row.original)}
              >
                <Trash2 className="size-4" />
              </Button>
            ) : null}
          </div>
        ),
      },
    ]
    return base
  }, [canDelete])

  const handleDelete = () => {
    if (!deletingJob) return
    const isLastRowOnPage = data?.data.length === 1 && page > 1
    deleteMutation.mutate(deletingJob._id, {
      onSuccess: () => {
        toast.success('Job deleted successfully')
        setDeletingJob(null)
        if (isLastRowOnPage) setPage(page - 1)
      },
      onError: (error) => {
        toast.error(error instanceof ApiError ? error.message : 'Failed to delete job')
      },
    })
  }

  return (
    <PageContainer>
      <PageHeader
        title="Job Postings"
        description="Careers listed on the public site."
        action={
          <Button type="button" asChild>
            <Link to="/jobs/new">
              <Plus className="size-4" />
              Add job posting
            </Link>
          </Button>
        }
      />

      <TableToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by title, description, or location…"
        filters={
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger size="sm" aria-label="Filter by status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              {JOB_STATUSES.map((value) => (
                <SelectItem key={value} value={value}>
                  {jobStatusLabel(value)}
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
        emptyState={{
          icon: Briefcase,
          title: 'No job postings found',
          description: 'Try adjusting your filters, or add a new job posting.',
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
          onLimitChange={setLimit}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(deletingJob)}
        onOpenChange={(open) => !open && setDeletingJob(null)}
        title="Delete job posting"
        description={`Are you sure you want to delete "${deletingJob?.title}"? This does not delete existing applications.`}
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  )
}
