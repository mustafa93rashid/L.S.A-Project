import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { format } from 'date-fns'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import { Briefcase, Building2, CalendarDays, CheckCircle2, CircleOff, Clock3, Filter, Pencil, Plus, Search, Trash2, X } from 'lucide-react'

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

import { useDeleteJobMutation, useJobsQuery, useJobStatisticsQuery } from '@/features/jobs/queries'
import { jobStatusLabel, jobStatusTone } from '@/features/jobs/utils'
import { JOB_STATUSES, type Job, type JobStatus } from '@/features/jobs/types'

const ALL = 'all'
const DEFAULT_LIMIT = 10

export default function JobsPage() {
  const role = useSessionStore((state) => state.user?.role)
  const canDelete = role === ROLES.SUPERADMIN

  const [searchParams, setSearchParams] = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const debouncedSearch = useDebouncedValue(search)

  const status = searchParams.get('status') ?? ALL
  const page = Number(searchParams.get('page')) || 1
  const limit = Number(searchParams.get('limit')) || DEFAULT_LIMIT

  const [deletingJob, setDeletingJob] = useState<Job | null>(null)

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

  const clearSearch = () => {
    setSearch('')

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('q')
        next.set('page', '1')
        return next
      },
      { replace: true },
    )
  }

  const clearFilters = () => {
    setSearch('')

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('q')
        next.delete('status')
        next.set('page', '1')
        return next
      },
      { replace: true },
    )
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
  const { data: statistics } = useJobStatisticsQuery()
  const deleteMutation = useDeleteJobMutation()

  const jobs = data?.data ?? []
  const hasActiveFilters = Boolean(search) || status !== ALL

  const columns = useMemo<ColumnDef<Job, unknown>[]>(() => {
    const base: ColumnDef<Job, unknown>[] = [
      {
        accessorKey: 'title',
        header: 'Job',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/35 text-muted-foreground">
              <Briefcase className="size-4" strokeWidth={1.8} aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight text-foreground">{row.original.title}</p>
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">Job posting</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'department',
        header: 'Department',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Building2 className="size-3.5 shrink-0 text-muted-foreground/45" strokeWidth={1.8} aria-hidden="true" />
            <span className="max-w-[180px] truncate text-sm text-foreground">{row.original.department || '—'}</span>
          </div>
        ),
      },
      {
        accessorKey: 'employmentType',
        header: 'Type',
        cell: ({ row }) => <span className="inline-flex rounded-lg border border-border/60 bg-muted/25 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">{row.original.employmentType || '—'}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge label={jobStatusLabel(row.original.status)} tone={jobStatusTone(row.original.status)} />,
      },
      {
        id: 'deadline',
        header: 'Deadline',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <CalendarDays className="size-3.5 shrink-0 text-muted-foreground/45" strokeWidth={1.8} aria-hidden="true" />
            <span className="text-[12px] font-medium text-muted-foreground tabular-nums">{row.original.deadline ? format(new Date(row.original.deadline), 'MMM d, yyyy') : '—'}</span>
          </div>
        ),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        meta: { hideOnMobile: true },
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button type="button" variant="ghost" size="icon-sm" aria-label={`Edit ${row.original.title}`} className="text-muted-foreground hover:bg-muted hover:text-foreground" asChild>
              <Link to={`/jobs/${row.original._id}/edit`}>
                <Pencil className="size-4" strokeWidth={1.8} />
              </Link>
            </Button>

            {canDelete ? (
              <Button type="button" variant="ghost" size="icon-sm" aria-label={`Delete ${row.original.title}`} className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeletingJob(row.original)}>
                <Trash2 className="size-4" strokeWidth={1.8} />
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
    <PageContainer className="max-w-6xl">
      <div className="space-y-7">
        <PageHeader
          title="Job Postings"
          description="Manage careers and job opportunities displayed on the public website."
          action={
            <Button type="button" asChild size="lg">
              <Link to="/jobs/new">
                <Plus className="size-4" strokeWidth={1.8} />
                Add job posting
              </Link>
            </Button>
          }
        />

        {statistics ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard index="01" label="Total Jobs" value={statistics.total} icon={Briefcase} />
              <StatCard index="02" label="Published" value={statistics.published} icon={CheckCircle2} tone="success" />
              <StatCard index="03" label="Draft" value={statistics.draft} icon={Clock3} tone="warning" />
              <StatCard index="04" label="Closed" value={statistics.closed} icon={CircleOff} />
            </div>
        ) : null}

        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <span className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">Careers Management</span>
              <h2 className="mt-1.5 text-[15px] font-semibold tracking-[-0.015em] text-foreground">Job Catalog</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Search, filter and manage public career opportunities.</p>
            </div>

            {data ? (
              <span className="hidden text-[11px] font-medium text-muted-foreground/60 tabular-nums sm:block">
                {data.pagination.total} {data.pagination.total === 1 ? 'posting' : 'postings'}
              </span>
            ) : null}
          </div>

          <div className="rounded-[22px] border border-border/70 bg-card p-4 shadow-[0_1px_3px_rgba(0,0,0,0.025)] sm:p-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground/45" strokeWidth={1.8} aria-hidden="true" />

                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by title, description, or location…" className="h-11 w-full rounded-xl border-border/70 bg-background pl-11 pr-11 text-[13px] shadow-none" />

                {search ? (
                  <button type="button" aria-label="Clear search" onClick={clearSearch} className="absolute right-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground/45 transition-colors hover:bg-muted hover:text-foreground">
                    <X className="size-3.5" />
                  </button>
                ) : null}
              </div>

              <div className="hidden shrink-0 items-center gap-2 px-1 text-[10px] font-semibold tracking-[0.1em] text-muted-foreground/55 uppercase xl:flex">
                <Filter className="size-3.5" strokeWidth={1.8} aria-hidden="true" />
                Filters
              </div>

              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger aria-label="Filter by status" className="h-11 w-full rounded-xl border-border/70 bg-background px-3.5 shadow-none sm:min-w-[190px] xl:w-[210px]">
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
            </div>

            {hasActiveFilters ? (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3.5">
                <span className="mr-1 text-[9px] font-semibold tracking-[0.1em] text-muted-foreground/50 uppercase">Active filters</span>

                {search ? (
                  <span className="inline-flex max-w-[260px] items-center gap-1.5 rounded-lg border border-border/70 bg-muted/25 px-2.5 py-1.5 text-[11px]">
                    <span className="font-medium text-foreground">Search</span>
                    <span className="truncate text-muted-foreground">{search}</span>
                  </span>
                ) : null}

                {status !== ALL ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-muted/25 px-2.5 py-1.5 text-[11px]">
                    <span className="font-medium text-foreground">Status</span>
                    <span className="text-muted-foreground">{jobStatusLabel(status as JobStatus)}</span>
                  </span>
                ) : null}

                <Button type="button" variant="ghost" size="xs" onClick={clearFilters} className="ml-auto text-muted-foreground">
                  <X className="size-3" />
                  Clear all
                </Button>
              </div>
            ) : null}
          </div>

          <div className="mt-5 overflow-hidden rounded-[22px] border border-border/70 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.025)]">
            <DataTable
              columns={columns}
              data={jobs}
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
          </div>

          {data ? (
            <div className="mt-4">
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
            </div>
          ) : null}
        </section>

        <ConfirmDialog
          open={Boolean(deletingJob)}
          onOpenChange={(open) => {
            if (!open) setDeletingJob(null)
          }}
          title="Delete job posting"
          description={`Are you sure you want to delete "${deletingJob?.title}"? This does not delete existing applications.`}
          variant="destructive"
          confirmLabel="Delete"
          onConfirm={handleDelete}
          isLoading={deleteMutation.isPending}
        />
      </div>
    </PageContainer>
  )
}