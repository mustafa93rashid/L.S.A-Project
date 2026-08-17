import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {CircleDot, FileCheck2, FileText, Filter, Search, UserCheck, UserRoundCheck, UserX, X } from 'lucide-react'

import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Pagination } from '@/components/data-table/Pagination'
import { StatCard } from '@/components/data-display/StatCard'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'

import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useJobsQuery } from '@/features/jobs/queries'
import { useJobRequestsQuery, useJobRequestStatisticsQuery } from '@/features/job-requests/queries'
import { JOB_REQUEST_STATUSES, type JobRequestStatus } from '@/features/job-requests/types'
import { jobRequestStatusLabel } from '@/features/job-requests/utils'
import { ApplicantRow } from '@/features/job-requests/components/ApplicantRow'
import { SectionHeader } from '@/components/layout/SectionHeader'

const ALL = 'all'
const DEFAULT_LIMIT = 20

export default function JobRequestsPage() {
  const [searchParams, setSearchParams] = useSearchParams()

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
        next.delete('job')
        next.set('page', '1')
        return next
      },
      { replace: true },
    )
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
  const { data: jobsPage } = useJobsQuery({ page: 1, limit: 100 })

  const applications = data?.data ?? []

  const hasActiveFilters = Boolean(search) || status !== ALL || job !== ALL
  const selectedJob = jobsPage?.data.find((item) => item._id === job) ?? null

  return (
    <PageContainer className="max-w-6xl">
      <div className="space-y-7">
        <PageHeader title="Job Applications" description="Review and manage applications submitted through the public careers page." />

        {statistics ? (
          <section className="space-y-5">

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <StatCard index="01" label="Total Applications" value={statistics.total} icon={FileText} />
              <StatCard index="02" label="New" value={statistics.new} icon={CircleDot} tone="info" />
              <StatCard index="03" label="Reviewed" value={statistics.reviewed} icon={FileCheck2} tone="warning" />
              <StatCard index="04" label="Shortlisted" value={statistics.shortlisted} icon={UserCheck} tone="warning" />
              <StatCard index="05" label="Accepted" value={statistics.accepted} icon={UserRoundCheck} tone="success" />
              <StatCard index="06" label="Rejected" value={statistics.rejected} icon={UserX} tone="danger" />
            </div>
          </section>
        ) : null}

        <section>
          <div className="flex items-end justify-between gap-4">

          <SectionHeader
            eyebrow="Recruitment Management"
            title="Applicant Pipeline"
            description="Search, filter and review incoming job applications."
          />
          </div>

          <div className="rounded-[22px] border border-border/70 bg-card p-4 shadow-[0_1px_3px_rgba(0,0,0,0.025)] sm:p-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground/45" strokeWidth={1.8} aria-hidden="true" />

                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, email, or phone…" className="h-11 w-full rounded-xl border-border/70 bg-background pl-11 pr-11 text-[13px] shadow-none" />

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

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:flex xl:shrink-0">
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger aria-label="Filter by status" className="h-11 w-full rounded-xl border-border/70 bg-background px-3.5 shadow-none sm:min-w-[190px] xl:w-[200px]">
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
                  <SelectTrigger aria-label="Filter by job" className="h-11 w-full rounded-xl border-border/70 bg-background px-3.5 shadow-none sm:min-w-[220px] xl:w-[250px]">
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
              </div>
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
                    <span className="text-muted-foreground">{jobRequestStatusLabel(status as JobRequestStatus)}</span>
                  </span>
                ) : null}

                {selectedJob ? (
                  <span className="inline-flex max-w-[280px] items-center gap-1.5 rounded-lg border border-border/70 bg-muted/25 px-2.5 py-1.5 text-[11px]">
                    <span className="font-medium text-foreground">Job</span>
                    <span className="truncate text-muted-foreground">{selectedJob.title}</span>
                  </span>
                ) : null}

                <Button type="button" variant="ghost" size="xs" onClick={clearFilters} className="ml-auto text-muted-foreground">
                  <X className="size-3" />
                  Clear all
                </Button>
              </div>
            ) : null}
          </div>

          <div className="mt-5">
            {isLoading ? (
              <div className="overflow-hidden rounded-[20px] border border-border/70 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.025)]">
                <div className="flex flex-col divide-y divide-border/60">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-4 px-5 py-4">
                      <Skeleton className="size-10 rounded-xl" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-56" />
                      </div>
                      <Skeleton className="hidden h-7 w-24 rounded-lg sm:block" />
                    </div>
                  ))}
                </div>
              </div>
            ) : isError ? (
              <div className="rounded-[20px] border border-border/70 bg-card px-6 py-10">
                <ErrorState description="Applications could not be loaded." onRetry={() => refetch()} />
              </div>
            ) : applications.length === 0 ? (
              <div className="rounded-[20px] border border-border/70 bg-card px-6 py-10">
                <EmptyState icon={FileText} title="No job applications found" description="Try adjusting your filters — new applications will appear here as they arrive." />
              </div>
            ) : (
              <ul className="flex flex-col divide-y divide-border/60 overflow-hidden rounded-[20px] border border-border/70 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.025)]">
                {applications.map((request) => (
                  <li key={request._id} className="transition-colors hover:bg-muted/20">
                    <ApplicantRow request={request} />
                  </li>
                ))}
              </ul>
            )}
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
      </div>
    </PageContainer>
  )
}