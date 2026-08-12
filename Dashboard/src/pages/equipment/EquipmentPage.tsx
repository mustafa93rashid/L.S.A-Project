import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Boxes,
  CheckCircle2,
  CircleOff,
  Filter,
  ImageIcon,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  ShieldX,
  Trash2,
  Truck,
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

import { StatCard } from '@/components/data-display/StatCard'
import { Pagination } from '@/components/data-table/Pagination'
import {
  CollectionCard,
  CollectionCardSkeleton,
} from '@/components/collection-card'

import { ConfirmDialog } from '@/components/overlays/ConfirmDialog'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { SectionHeader } from '@/components/layout/SectionHeader'

import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { ApiError } from '@/types/api'

import {
  useDeleteEquipmentMutation,
  useEquipmentListQuery,
  useEquipmentStatisticsQuery,
} from '@/features/equipment/queries'

import { useEquipmentCategoriesQuery } from '@/features/equipment-categories/queries'

import type { Equipment } from '@/features/equipment/types'

const ACTIVE_FILTER_ALL = 'all'

const DEFAULT_LIMIT = 20

type EquipmentWithMedia = Equipment & {
  image?: {
    url?: string
  } | null

  images?: Array<{
    url?: string
  }>
}

function getEquipmentImageUrl(
  equipment: Equipment,
): string | null {
  const item = equipment as EquipmentWithMedia

  return (
    item.images?.[0]?.url ??
    item.image?.url ??
    null
  )
}

export default function EquipmentPage() {
  const [searchParams, setSearchParams] =
    useSearchParams()

  const [search, setSearch] = useState(
    searchParams.get('q') ?? '',
  )

  const debouncedSearch =
    useDebouncedValue(search)

  const categoryFilter =
    searchParams.get('category') ??
    ACTIVE_FILTER_ALL

  const activeFilter =
    searchParams.get('active') ??
    ACTIVE_FILTER_ALL

  const [page, setPage] = useState(1)

  const [limit, setLimit] =
    useState(DEFAULT_LIMIT)

  const [
    deletingEquipment,
    setDeletingEquipment,
  ] = useState<Equipment | null>(null)

  // ================================
  // Queries
  // ================================

  const {
    data: categories,
  } = useEquipmentCategoriesQuery()

  const deleteMutation =
    useDeleteEquipmentMutation()

  // ================================
  // Sync Search With URL
  // ================================

  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next =
          new URLSearchParams(prev)

        if (debouncedSearch) {
          next.set(
            'q',
            debouncedSearch,
          )
        } else {
          next.delete('q')
        }

        return next
      },
      {
        replace: true,
      },
    )

    setPage(1)
  }, [
    debouncedSearch,
    setSearchParams,
  ])

  // ================================
  // Category Filter
  // ================================

  const setCategoryFilter = (
    value: string,
  ) => {
    setSearchParams((prev) => {
      const next =
        new URLSearchParams(prev)

      if (
        value === ACTIVE_FILTER_ALL
      ) {
        next.delete('category')
      } else {
        next.set(
          'category',
          value,
        )
      }

      return next
    })

    setPage(1)
  }

  // ================================
  // Active Filter
  // ================================

  const setActiveFilter = (
    value: string,
  ) => {
    setSearchParams((prev) => {
      const next =
        new URLSearchParams(prev)

      if (
        value === ACTIVE_FILTER_ALL
      ) {
        next.delete('active')
      } else {
        next.set(
          'active',
          value,
        )
      }

      return next
    })

    setPage(1)
  }

  // ================================
  // Clear Search
  // ================================

  const clearSearch = () => {
    setSearch('')

    setPage(1)

    setSearchParams(
      (prev) => {
        const next =
          new URLSearchParams(prev)

        next.delete('q')

        return next
      },
      {
        replace: true,
      },
    )
  }

  // ================================
  // Clear Filters
  // ================================

  const clearFilters = () => {
    setSearch('')

    setPage(1)

    setSearchParams(
      (prev) => {
        const next =
          new URLSearchParams(prev)

        next.delete('q')
        next.delete('category')
        next.delete('active')

        return next
      },
      {
        replace: true,
      },
    )
  }

  // ================================
  // Equipment Filters
  // ================================

  const filters = useMemo(
    () => ({
      category:
        categoryFilter ===
        ACTIVE_FILTER_ALL
          ? undefined
          : categoryFilter,

      isActive:
        activeFilter ===
        ACTIVE_FILTER_ALL
          ? undefined
          : activeFilter === 'true',

      search:
        debouncedSearch ||
        undefined,

      page,

      limit,
    }),
    [
      categoryFilter,
      activeFilter,
      debouncedSearch,
      page,
      limit,
    ],
  )

  // ================================
  // Equipment List Query
  // ================================

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useEquipmentListQuery(filters)

  // ================================
  // Equipment Statistics Query
  // ================================

  const {
    data: statisticsData,
    isLoading:
      isStatisticsLoading,
    isError:
      isStatisticsError,
    refetch:
      refetchStatistics,
  } =
    useEquipmentStatisticsQuery()

  // ================================
  // Data
  // ================================

  const equipment =
    data?.data ?? []

  const statistics =
    statisticsData?.data.overview

  // ================================
  // Filter State
  // ================================

  const hasActiveFilters =
    Boolean(search) ||
    categoryFilter !==
      ACTIVE_FILTER_ALL ||
    activeFilter !==
      ACTIVE_FILTER_ALL

  const selectedCategory =
    categories?.find(
      (category) =>
        category._id ===
        categoryFilter,
    ) ?? null

  // ================================
  // Delete Equipment
  // ================================

  const handleDelete = () => {
    if (!deletingEquipment) return

    const isLastItemOnPage =
      equipment.length === 1 &&
      page > 1

    deleteMutation.mutate(
      deletingEquipment._id,
      {
        onSuccess: (message) => {
          toast.success(message)

          setDeletingEquipment(null)

          if (
            isLastItemOnPage
          ) {
            setPage(
              (current) =>
                current - 1,
            )
          }
        },

        onError: (error) => {
          toast.error(
            error instanceof ApiError
              ? error.message
              : 'Failed to delete equipment',
          )
        },
      },
    )
  }

  return (
    <PageContainer className="max-w-6xl">
      <div className="space-y-7">
        {/* ================================
            Page Header
        ================================= */}

        <PageHeader
          title="Equipment"
          description="Manage the rentable equipment catalog displayed on the public website."
          action={
            <Button
              type="button"
              asChild
              size="lg"
            >
              <Link to="/equipment/new">
                <Plus
                  className="size-4"
                  strokeWidth={1.8}
                />

                Add equipment
              </Link>
            </Button>
          }
        />

        {/* ================================
            Statistics
        ================================= */}

        {isStatisticsLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({
              length: 4,
            }).map((_, index) => (
              <div
                key={index}
                className="h-[120px] animate-pulse rounded-[20px] border border-border/70 bg-muted/30"
              />
            ))}
          </div>
        ) : isStatisticsError ? (
          <div className="rounded-[22px] border border-border/70 bg-card px-6 py-8">
            <ErrorState
              description="Equipment statistics could not be loaded."
              onRetry={() =>
                refetchStatistics()
              }
            />
          </div>
        ) : statistics ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              index="01"
              label="Total Equipment"
              value={
                statistics.totalEquipment
              }
              icon={Truck}
            />

            <StatCard
              index="02"
              label="Available Units"
              value={
                statistics.totalAvailableUnits
              }
              icon={Boxes}
            />

            <StatCard
              index="03"
              label="Active Equipment"
              value={
                statistics.activeEquipment
              }
              icon={CheckCircle2}
              tone="success"
            />

            <StatCard
              index="04"
              label="Inactive Equipment"
              value={
                statistics.inactiveEquipment
              }
              icon={CircleOff}
            />
          </div>
        ) : null}

        {/* ================================
            Equipment Collection
        ================================= */}

        <section>
          <SectionHeader
            eyebrow="Equipment Catalog"
            title="Catalog Collection"
            description="Browse, filter and manage equipment available on the public website."
            icon={Truck}
            statLabel="Equipment"
            statValue={
              data?.pagination.total ??
              0
            }
            showStat={
              !isLoading &&
              !isError
            }
          />

          {/* ================================
              Filters
          ================================= */}

          <div className="mb-5 rounded-[22px] border border-border/70 bg-card p-4 shadow-[0_1px_3px_rgba(0,0,0,0.025)] sm:p-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              {/* Search */}

              <div className="relative min-w-0 flex-1">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground/45"
                  strokeWidth={1.8}
                  aria-hidden="true"
                />

                <Input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                  placeholder="Search equipment by title, description or location…"
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

              {/* Filters Label */}

              <div className="hidden shrink-0 items-center gap-2 px-1 text-[10px] font-semibold tracking-[0.1em] text-muted-foreground/55 uppercase xl:flex">
                <Filter
                  className="size-3.5"
                  strokeWidth={1.8}
                />

                Filters
              </div>

              {/* Select Filters */}

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:flex xl:shrink-0">
                {/* Category */}

                <Select
                  value={
                    categoryFilter
                  }
                  onValueChange={
                    setCategoryFilter
                  }
                >
                  <SelectTrigger
                    aria-label="Filter by category"
                    className="h-11 w-full rounded-xl border-border/70 bg-background px-3.5 shadow-none sm:min-w-[200px] xl:w-[220px]"
                  >
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem
                      value={
                        ACTIVE_FILTER_ALL
                      }
                    >
                      All categories
                    </SelectItem>

                    {(categories ?? []).map(
                      (category) => (
                        <SelectItem
                          key={
                            category._id
                          }
                          value={
                            category._id
                          }
                        >
                          {
                            category.name
                          }
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>

                {/* Status */}

                <Select
                  value={
                    activeFilter
                  }
                  onValueChange={
                    setActiveFilter
                  }
                >
                  <SelectTrigger
                    aria-label="Filter by status"
                    className="h-11 w-full rounded-xl border-border/70 bg-background px-3.5 shadow-none sm:min-w-[160px] xl:w-[175px]"
                  >
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem
                      value={
                        ACTIVE_FILTER_ALL
                      }
                    >
                      All statuses
                    </SelectItem>

                    <SelectItem value="true">
                      Active
                    </SelectItem>

                    <SelectItem value="false">
                      Inactive
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ================================
                Active Filters
            ================================= */}

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

                {selectedCategory ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-muted/25 px-2.5 py-1.5 text-[11px]">
                    <span className="font-medium text-foreground">
                      Category
                    </span>

                    <span className="text-muted-foreground">
                      {
                        selectedCategory.name
                      }
                    </span>
                  </span>
                ) : null}

                {activeFilter !==
                ACTIVE_FILTER_ALL ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-muted/25 px-2.5 py-1.5 text-[11px]">
                    <span className="font-medium text-foreground">
                      Status
                    </span>

                    <span className="text-muted-foreground">
                      {activeFilter ===
                      'true'
                        ? 'Active'
                        : 'Inactive'}
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

          {/* ================================
              Equipment List
          ================================= */}

          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({
                length: 8,
              }).map(
                (_, index) => (
                  <CollectionCardSkeleton
                    key={index}
                  />
                ),
              )}
            </div>
          ) : isError ? (
            <div className="rounded-[22px] border border-border/70 bg-card px-6 py-12">
              <ErrorState
                description="Equipment could not be loaded."
                onRetry={() =>
                  refetch()
                }
              />
            </div>
          ) : equipment.length ===
            0 ? (
            <div className="rounded-[22px] border border-border/70 bg-card px-6 py-12">
              <EmptyState
                icon={Truck}
                title="No equipment found"
                description="Try adjusting your filters, or add a new equipment item."
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {equipment.map(
                (item) => {
                  const imageUrl =
                    getEquipmentImageUrl(
                      item,
                    )

                  return (
                    <CollectionCard
                      key={item._id}
                      image={
                        imageUrl ? (
                          <img
                            src={
                              imageUrl
                            }
                            alt={
                              item.title
                            }
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-muted/30 text-muted-foreground/35">
                            <ImageIcon
                              className="size-7"
                              strokeWidth={
                                1.5
                              }
                            />
                          </div>
                        )
                      }
                      badges={
                        <Badge
                          variant={
                            item.isActive
                              ? 'success'
                              : 'secondary'
                          }
                          className="border-white/10 shadow-sm backdrop-blur-md"
                        >
                          {item.isActive
                            ? 'Active'
                            : 'Inactive'}
                        </Badge>
                      }
                      actions={
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Edit ${item.title}`}
                            className="size-7 text-white/80 hover:bg-white/15 hover:text-white"
                            asChild
                          >
                            <Link
                              to={`/equipment/${item._id}/edit`}
                            >
                              <Pencil
                                className="size-3.5"
                                strokeWidth={
                                  1.8
                                }
                              />
                            </Link>
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Delete ${item.title}`}
                            className="size-7 text-white/75 hover:bg-destructive/30 hover:text-white"
                            onClick={() =>
                              setDeletingEquipment(
                                item,
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
                        </>
                      }
                      overlayLeft={
                        item.category
                          ?.name ??
                        'Uncategorized'
                      }
                      overlayRight={`#${item.displayOrder}`}
                      eyebrow="Equipment"
                      icon={Truck}
                      title={
                        item.title
                      }
                      description={
                        item.shortDescription ||
                        'No equipment description available.'
                      }
                      footerLeft={{
                        icon: Boxes,

                        label:
                          'Available',

                        value: `${item.availableUnits} ${
                          item.availableUnits ===
                          1
                            ? 'unit'
                            : 'units'
                        }`,
                      }}
                      footerRight={{
                        icon: item
                          .safetyCertificate
                          ?.isAvailable
                          ? ShieldCheck
                          : ShieldX,

                        label:
                          'Certificate',

                        value: item
                          .safetyCertificate
                          ?.isAvailable
                          ? 'Certified'
                          : 'Not available',

                        valueClassName:
                          item
                            .safetyCertificate
                            ?.isAvailable
                            ? 'text-success'
                            : undefined,
                      }}
                      active={
                        item.isActive
                      }
                    />
                  )
                },
              )}
            </div>
          )}

          {/* ================================
              Pagination
          ================================= */}

          {data ? (
            <div className="mt-5">
              <Pagination
                page={
                  data.pagination.page
                }
                totalPages={
                  data.pagination
                    .totalPages
                }
                hasNextPage={
                  data.pagination
                    .hasNextPage
                }
                hasPreviousPage={
                  data.pagination
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
                onLimitChange={(
                  value,
                ) => {
                  setLimit(value)

                  setPage(1)
                }}
              />
            </div>
          ) : null}
        </section>

        {/* ================================
            Delete Confirmation
        ================================= */}

        <ConfirmDialog
          open={Boolean(
            deletingEquipment,
          )}
          onOpenChange={(open) => {
            if (!open) {
              setDeletingEquipment(
                null,
              )
            }
          }}
          title="Delete equipment"
          description={`Are you sure you want to delete "${deletingEquipment?.title}"? Equipment with existing requests will be deactivated instead of deleted.`}
          variant="destructive"
          confirmLabel="Delete"
          onConfirm={handleDelete}
          isLoading={
            deleteMutation.isPending
          }
        />
      </div>
    </PageContainer>
  )
}