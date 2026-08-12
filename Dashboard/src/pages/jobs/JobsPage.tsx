import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleOff,
  Clock3,
  Filter,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'

import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

import { Pagination } from '@/components/data-table/Pagination'
import { StatCard } from '@/components/data-display/StatCard'
import { ConfirmDialog } from '@/components/overlays/ConfirmDialog'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'

import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useSessionStore } from '@/stores/session.store'

import { ROLES } from '@/constants/roles'
import { ApiError } from '@/types/api'

import {
  useDeleteJobMutation,
  useJobsQuery,
  useJobStatisticsQuery,
} from '@/features/jobs/queries'

import {
  jobStatusLabel,
} from '@/features/jobs/utils'

import {
  JOB_STATUSES,
  type Job,
  type JobStatus,
} from '@/features/jobs/types'

const ALL = 'all'
const DEFAULT_LIMIT = 10

function JobCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[18px] border border-border/70 bg-card">
      <Skeleton className="aspect-[16/7] w-full rounded-none" />

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-36" />
          </div>

          <Skeleton className="size-8 rounded-lg" />
        </div>

        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />

        <div className="grid grid-cols-2 gap-3 border-t border-border/60 pt-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  )
}

export default function JobsPage() {
  const role = useSessionStore(
    (state) => state.user?.role,
  )

  const canDelete =
    role === ROLES.SUPERADMIN

  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams()

  const [search, setSearch] =
    useState(
      searchParams.get('q') ?? '',
    )

  const debouncedSearch =
    useDebouncedValue(search)

  const status =
    searchParams.get('status') ??
    ALL

  const page =
    Number(
      searchParams.get('page'),
    ) || 1

  const limit =
    Number(
      searchParams.get('limit'),
    ) || DEFAULT_LIMIT

  const [
    deletingJob,
    setDeletingJob,
  ] =
    useState<Job | null>(null)

  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next =
          new URLSearchParams(prev)

        if (
          debouncedSearch
        ) {
          next.set(
            'q',
            debouncedSearch,
          )
        } else {
          next.delete('q')
        }

        next.set(
          'page',
          '1',
        )

        return next
      },
      {
        replace: true,
      },
    )

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const setStatus = (
    value: string,
  ) => {
    setSearchParams(
      (prev) => {
        const next =
          new URLSearchParams(
            prev,
          )

        if (value === ALL) {
          next.delete(
            'status',
          )
        } else {
          next.set(
            'status',
            value,
          )
        }

        next.set(
          'page',
          '1',
        )

        return next
      },
    )
  }

  const setPage = (
    value: number,
  ) => {
    setSearchParams(
      (prev) => {
        const next =
          new URLSearchParams(
            prev,
          )

        next.set(
          'page',
          String(value),
        )

        return next
      },
    )
  }

  const setLimit = (
    value: number,
  ) => {
    setSearchParams(
      (prev) => {
        const next =
          new URLSearchParams(
            prev,
          )

        next.set(
          'limit',
          String(value),
        )

        next.set(
          'page',
          '1',
        )

        return next
      },
    )
  }

  const clearSearch = () => {
    setSearch('')

    setSearchParams(
      (prev) => {
        const next =
          new URLSearchParams(
            prev,
          )

        next.delete('q')

        next.set(
          'page',
          '1',
        )

        return next
      },
      {
        replace: true,
      },
    )
  }

  const clearFilters = () => {
    setSearch('')

    setSearchParams(
      (prev) => {
        const next =
          new URLSearchParams(
            prev,
          )

        next.delete('q')
        next.delete(
          'status',
        )

        next.set(
          'page',
          '1',
        )

        return next
      },
      {
        replace: true,
      },
    )
  }

  const filters = useMemo(
    () => ({
      status:
        status === ALL
          ? undefined
          : (status as JobStatus),

      search:
        debouncedSearch ||
        undefined,

      page,
      limit,
    }),
    [
      status,
      debouncedSearch,
      page,
      limit,
    ],
  )

  const {
    data,
    isLoading,
    isError,
    refetch,
  } =
    useJobsQuery(filters)

  const {
    data: statistics,
  } =
    useJobStatisticsQuery()

  const deleteMutation =
    useDeleteJobMutation()

  const jobs =
    data?.data ?? []

  const hasActiveFilters =
    Boolean(search) ||
    status !== ALL

  const handleDelete = () => {
    if (!deletingJob) {
      return
    }

    const isLastRowOnPage =
      data?.data.length ===
        1 &&
      page > 1

    deleteMutation.mutate(
      deletingJob._id,
      {
        onSuccess: () => {
          toast.success(
            'Job deleted successfully',
          )

          setDeletingJob(
            null,
          )

          if (
            isLastRowOnPage
          ) {
            setPage(
              page - 1,
            )
          }
        },

        onError: (
          error,
        ) => {
          toast.error(
            error instanceof
              ApiError
              ? error.message
              : 'Failed to delete job',
          )
        },
      },
    )
  }

  return (
    <PageContainer className="max-w-6xl">
      <div className="space-y-7">
        <PageHeader
          title="Job Postings"
          description="Manage careers and job opportunities displayed on the public website."
          action={
            <Button
              type="button"
              asChild
              size="lg"
            >
              <Link to="/jobs/new">
                <Plus
                  className="size-4"
                  strokeWidth={
                    1.8
                  }
                />

                Add job posting
              </Link>
            </Button>
          }
        />

        {statistics ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              index="01"
              label="Total Jobs"
              value={
                statistics.total
              }
              icon={Briefcase}
            />

            <StatCard
              index="02"
              label="Published"
              value={
                statistics.published
              }
              icon={
                CheckCircle2
              }
              tone="success"
            />

            <StatCard
              index="03"
              label="Draft"
              value={
                statistics.draft
              }
              icon={Clock3}
              tone="warning"
            />

            <StatCard
              index="04"
              label="Closed"
              value={
                statistics.closed
              }
              icon={CircleOff}
            />
          </div>
        ) : null}

        <section>
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                Careers Management
              </span>

              <h2 className="mt-1.5 text-[15px] font-semibold tracking-[-0.015em] text-foreground">
                Job Catalog
              </h2>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Search, filter and manage public career opportunities.
              </p>
            </div>

            {data ? (
              <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-card px-3 py-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-muted/40 text-muted-foreground">
                  <Briefcase
                    className="size-3.5"
                    strokeWidth={
                      1.8
                    }
                  />
                </div>

                <div>
                  <p className="text-[9px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                    Postings
                  </p>

                  <p className="mt-0.5 text-sm font-semibold text-foreground tabular-nums">
                    {
                      data
                        .pagination
                        .total
                    }
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mb-5 rounded-[22px] border border-border/70 bg-card p-4 shadow-[0_1px_3px_rgba(0,0,0,0.025)] sm:p-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <div className="relative min-w-0 flex-1">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground/45"
                  strokeWidth={
                    1.8
                  }
                  aria-hidden="true"
                />

                <Input
                  value={
                    search
                  }
                  onChange={(
                    event,
                  ) =>
                    setSearch(
                      event
                        .target
                        .value,
                    )
                  }
                  placeholder="Search by title, description, or location…"
                  className="h-11 w-full rounded-xl border-border/70 bg-background pl-11 pr-11 text-[13px] shadow-none"
                />

                {search ? (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={
                      clearSearch
                    }
                    className="absolute right-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground/45 transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                ) : null}
              </div>

              <div className="hidden shrink-0 items-center gap-2 px-1 text-[10px] font-semibold tracking-[0.1em] text-muted-foreground/55 uppercase xl:flex">
                <Filter
                  className="size-3.5"
                  strokeWidth={
                    1.8
                  }
                />

                Filters
              </div>

              <Select
                value={status}
                onValueChange={
                  setStatus
                }
              >
                <SelectTrigger
                  aria-label="Filter by status"
                  className="h-11 w-full rounded-xl border-border/70 bg-background px-3.5 shadow-none sm:min-w-[190px] xl:w-[210px]"
                >
                  <SelectValue placeholder="Status" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem
                    value={ALL}
                  >
                    All statuses
                  </SelectItem>

                  {JOB_STATUSES.map(
                    (value) => (
                      <SelectItem
                        key={
                          value
                        }
                        value={
                          value
                        }
                      >
                        {
                          jobStatusLabel(
                            value,
                          )
                        }
                      </SelectItem>
                    ),
                  )}
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
                    <span className="font-medium text-foreground">
                      Search
                    </span>

                    <span className="truncate text-muted-foreground">
                      {
                        search
                      }
                    </span>
                  </span>
                ) : null}

                {status !==
                ALL ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-muted/25 px-2.5 py-1.5 text-[11px]">
                    <span className="font-medium text-foreground">
                      Status
                    </span>

                    <span className="text-muted-foreground">
                      {jobStatusLabel(
                        status as JobStatus,
                      )}
                    </span>
                  </span>
                ) : null}

                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={
                    clearFilters
                  }
                  className="ml-auto text-muted-foreground"
                >
                  <X className="size-3" />

                  Clear all
                </Button>
              </div>
            ) : null}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({
                length: 8,
              }).map(
                (
                  _,
                  index,
                ) => (
                  <JobCardSkeleton
                    key={
                      index
                    }
                  />
                ),
              )}
            </div>
          ) : isError ? (
            <div className="rounded-[22px] border border-border/70 bg-card px-6 py-12">
              <ErrorState
                description="Job postings could not be loaded."
                onRetry={() =>
                  refetch()
                }
              />
            </div>
          ) : jobs.length ===
            0 ? (
            <div className="rounded-[22px] border border-border/70 bg-card px-6 py-12">
              <EmptyState
                icon={
                  Briefcase
                }
                title="No job postings found"
                description="Try adjusting your filters, or add a new job posting."
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {jobs.map(
                (job) => (
                  <article
                    key={
                      job._id
                    }
                    className="group relative overflow-hidden rounded-[18px] border border-border/70 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.025)] transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/10 hover:shadow-[0_10px_26px_rgba(0,0,0,0.05)]"
                  >
                    <div className="relative aspect-[16/7] overflow-hidden bg-muted/30">
                      <div className="absolute inset-0 bg-gradient-to-br from-muted/60 via-muted/30 to-card" />

                      <div className="absolute -right-8 -top-8 size-32 rounded-full bg-primary/[0.035] blur-2xl" />

                      <div className="absolute inset-0 flex items-center justify-center">
                        <Briefcase
                          className="size-12 text-muted-foreground/[0.12]"
                          strokeWidth={
                            1.3
                          }
                        />
                      </div>

                      <div className="absolute left-3 top-3">
                        <Badge
                          variant={
                            job.status ===
                            'published'
                              ? 'success'
                              : job.status ===
                                  'draft'
                                ? 'secondary'
                                : 'secondary'
                          }
                          className="shadow-sm"
                        >
                          {
                            jobStatusLabel(
                              job.status,
                            )
                          }
                        </Badge>
                      </div>

                      <div className="absolute right-2.5 top-2.5 flex items-center gap-0.5 rounded-lg border border-border/60 bg-background/70 p-0.5 opacity-0 backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Edit ${job.title}`}
                          className="size-7 text-muted-foreground hover:bg-muted hover:text-foreground"
                          asChild
                        >
                          <Link
                            to={`/jobs/${job._id}/edit`}
                          >
                            <Pencil
                              className="size-3.5"
                              strokeWidth={
                                1.8
                              }
                            />
                          </Link>
                        </Button>

                        {canDelete ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Delete ${job.title}`}
                            className="size-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            onClick={() =>
                              setDeletingJob(
                                job,
                              )
                            }
                          >
                            <Trash2
                              className="size-3.5"
                              strokeWidth={
                                1.8
                              }
                            />
                          </Button>
                        ) : null}
                      </div>

                      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 px-3 pb-2.5">
                        <span className="max-w-[75%] truncate text-[8px] font-semibold tracking-[0.08em] text-muted-foreground/65 uppercase">
                          {
                            job.department
                          }
                        </span>

                        <span className="shrink-0 text-[8px] font-semibold text-muted-foreground/65">
                          {
                            job.employmentType
                          }
                        </span>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Briefcase
                              className="size-3"
                              strokeWidth={
                                1.8
                              }
                            />

                            <span className="text-[9px] font-semibold tracking-[0.06em] uppercase">
                              Job Posting
                            </span>
                          </div>

                          <h3 className="mt-1.5 truncate text-sm font-semibold tracking-[-0.015em] text-foreground">
                            {
                              job.title
                            }
                          </h3>
                        </div>

                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted/30 text-muted-foreground">
                          <Briefcase
                            className="size-3.5"
                            strokeWidth={
                              1.8
                            }
                          />
                        </div>
                      </div>

                      <p className="mt-2 line-clamp-2 min-h-[34px] text-[10px] leading-[17px] text-muted-foreground">
                        {job.shortDescription ||
                          job.description ||
                          'No job description available.'}
                      </p>

                      <div className="mt-3 grid grid-cols-2 divide-x divide-border/60 border-t border-border/60 pt-3">
                        <div className="pr-3">
                          <div className="flex items-center gap-1.5">
                            <MapPin
                              className="size-3 text-muted-foreground/55"
                              strokeWidth={
                                1.8
                              }
                            />

                            <span className="text-[8px] font-semibold tracking-[0.08em] text-muted-foreground/60 uppercase">
                              Location
                            </span>
                          </div>

                          <p className="mt-1 truncate text-[10px] font-semibold text-foreground">
                            {job.location ||
                              '—'}
                          </p>
                        </div>

                        <div className="pl-3">
                          <div className="flex items-center gap-1.5">
                            <CalendarDays
                              className="size-3 text-muted-foreground/55"
                              strokeWidth={
                                1.8
                              }
                            />

                            <span className="text-[8px] font-semibold tracking-[0.08em] text-muted-foreground/60 uppercase">
                              Deadline
                            </span>
                          </div>

                          <p className="mt-1 truncate text-[10px] font-semibold text-foreground">
                            {job.deadline
                              ? format(
                                  new Date(
                                    job.deadline,
                                  ),
                                  'MMM d, yyyy',
                                )
                              : 'No deadline'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <span
                      aria-hidden="true"
                      className={`absolute bottom-0 left-4 h-[2px] w-6 rounded-full transition-all duration-300 group-hover:w-10 ${
                        job.status ===
                        'published'
                          ? 'bg-success/45'
                          : 'bg-foreground/20'
                      }`}
                    />
                  </article>
                ),
              )}
            </div>
          )}

          {data ? (
            <div className="mt-5">
              <Pagination
                page={
                  data
                    .pagination
                    .page
                }
                totalPages={
                  data
                    .pagination
                    .totalPages
                }
                hasNextPage={
                  data
                    .pagination
                    .hasNextPage
                }
                hasPreviousPage={
                  data
                    .pagination
                    .hasPreviousPage
                }
                onPageChange={
                  setPage
                }
                limit={limit}
                limitOptions={[
                  10,
                  20,
                  50,
                  100,
                ]}
                onLimitChange={
                  setLimit
                }
              />
            </div>
          ) : null}
        </section>

        <ConfirmDialog
          open={Boolean(
            deletingJob,
          )}
          onOpenChange={(
            open,
          ) => {
            if (!open) {
              setDeletingJob(
                null,
              )
            }
          }}
          title="Delete job posting"
          description={`Are you sure you want to delete "${deletingJob?.title}"? This does not delete existing applications.`}
          variant="destructive"
          confirmLabel="Delete"
          onConfirm={
            handleDelete
          }
          isLoading={
            deleteMutation.isPending
          }
        />
      </div>
    </PageContainer>
  )
}