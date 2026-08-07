import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { TableToolbar } from '@/components/data-table/TableToolbar'
import { Pagination } from '@/components/data-table/Pagination'
import { StatCard } from '@/components/data-display/StatCard'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useJobsQuery } from '@/features/jobs/queries'
import {
  useJobRequestsQuery,
  useJobRequestStatisticsQuery,
} from '@/features/job-requests/queries'
import {
  JOB_REQUEST_STATUSES,
  type JobRequestStatus,
} from '@/features/job-requests/types'
import { jobRequestStatusLabel } from '@/features/job-requests/utils'
import { ApplicantRow } from '@/features/job-requests/components/ApplicantRow'

const ALL = 'all'
const DEFAULT_LIMIT = 20

export default function JobRequestsPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Filters + pagination live in the URL so navigating to an applicant's
  // details page and back preserves exactly what was being viewed.
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const debouncedSearch = useDebouncedValue(search)
  const status = searchParams.get('status') ?? ALL
  const job = searchParams.get('job') ?? ALL
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

  const setJob = (value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value === ALL) next.delete('job')
      else next.set('job', value)
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
      status: status === ALL ? undefined : (status as JobRequestStatus),
      job: job === ALL ? undefined : job,
      search: debouncedSearch || undefined,
      page,
      limit,
    }),
    [status, job, debouncedSearch, page, limit],
  )

  const { data, isLoading, isError, refetch } = useJobRequestsQuery(filters)
  const { data: statistics } = useJobRequestStatisticsQuery()
  // First 100 jobs is plenty for a filter dropdown — reuses the existing
  // Jobs list query rather than inventing a lightweight options endpoint.
  const { data: jobsPage } = useJobsQuery({ page: 1, limit: 100 })

  return (
    <PageContainer>
      <PageHeader
        title="Job Applications"
        description="Applications submitted through the public careers page."
      />

      {statistics ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Total" value={statistics.total} />
          <StatCard label="New" value={statistics.new} tone="info" />
          <StatCard label="Reviewed" value={statistics.reviewed} tone="warning" />
          <StatCard label="Shortlisted" value={statistics.shortlisted} tone="warning" />
          <StatCard label="Accepted" value={statistics.accepted} tone="success" />
          <StatCard label="Rejected" value={statistics.rejected} tone="danger" />
        </div>
      ) : null}

      <TableToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, email, or phone…"
        filters={
          <>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger size="sm" aria-label="Filter by status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All statuses</SelectItem>
                {JOB_REQUEST_STATUSES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {jobRequestStatusLabel(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={job} onValueChange={setJob}>
              <SelectTrigger size="sm" aria-label="Filter by job">
                <SelectValue placeholder="Job" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All jobs</SelectItem>
                {(jobsPage?.data ?? []).map((jobOption) => (
                  <SelectItem key={jobOption._id} value={jobOption._id}>
                    {jobOption.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
      />

      {isLoading ? (
        <div className="flex flex-col divide-y divide-border rounded-xl border border-border">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 px-5 py-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="ml-auto h-4 w-24" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          description="Applications could not be loaded."
          onRetry={() => refetch()}
        />
      ) : (data?.data.length ?? 0) === 0 ? (
        <EmptyState
          icon={FileText}
          title="No job applications found"
          description="Try adjusting your filters — new applications will appear here as they arrive."
        />
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
          {data?.data.map((request) => (
            <li key={request._id}>
              <ApplicantRow request={request} />
            </li>
          ))}
        </ul>
      )}

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
    </PageContainer>
  )
}
