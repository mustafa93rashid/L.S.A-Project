import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Boxes, CheckCircle2, CircleOff, Filter, ImageOff, MapPin, Pencil, Plus, Search, Trash2, Truck, X } from 'lucide-react'

import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatCard } from '@/components/data-display/StatCard'
import { Pagination } from '@/components/data-table/Pagination'
import { ConfirmDialog } from '@/components/overlays/ConfirmDialog'

import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { ApiError } from '@/types/api'

import { useDeleteEquipmentMutation, useEquipmentListQuery } from '@/features/equipment/queries'
import { useEquipmentCategoriesQuery } from '@/features/equipment-categories/queries'

import type { Equipment } from '@/features/equipment/types'

const ACTIVE_FILTER_ALL = 'all'
const DEFAULT_LIMIT = 20

type EquipmentWithMedia = Equipment & {
  image?: { url?: string } | null
  images?: Array<{ url?: string }>
}

function getEquipmentImageUrl(equipment: Equipment): string | null {
  const item = equipment as EquipmentWithMedia
  return item.images?.[0]?.url ?? item.image?.url ?? null
}

export default function EquipmentPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const debouncedSearch = useDebouncedValue(search)

  const categoryFilter = searchParams.get('category') ?? ACTIVE_FILTER_ALL
  const activeFilter = searchParams.get('active') ?? ACTIVE_FILTER_ALL

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_LIMIT)
  const [deletingEquipment, setDeletingEquipment] = useState<Equipment | null>(null)

  const { data: categories } = useEquipmentCategoriesQuery()
  const deleteMutation = useDeleteEquipmentMutation()

  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)

        if (debouncedSearch) next.set('q', debouncedSearch)
        else next.delete('q')

        return next
      },
      { replace: true },
    )

    setPage(1)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const setCategoryFilter = (value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)

      if (value === ACTIVE_FILTER_ALL) next.delete('category')
      else next.set('category', value)

      return next
    })

    setPage(1)
  }

  const setActiveFilter = (value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)

      if (value === ACTIVE_FILTER_ALL) next.delete('active')
      else next.set('active', value)

      return next
    })

    setPage(1)
  }

  const clearSearch = () => {
    setSearch('')
    setPage(1)

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('q')
        return next
      },
      { replace: true },
    )
  }

  const clearFilters = () => {
    setSearch('')
    setPage(1)

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('q')
        next.delete('category')
        next.delete('active')
        return next
      },
      { replace: true },
    )
  }

  const filters = useMemo(
    () => ({
      category: categoryFilter === ACTIVE_FILTER_ALL ? undefined : categoryFilter,
      isActive: activeFilter === ACTIVE_FILTER_ALL ? undefined : activeFilter === 'true',
      search: debouncedSearch || undefined,
      page,
      limit,
    }),
    [categoryFilter, activeFilter, debouncedSearch, page, limit],
  )

  const { data, isLoading, isError, refetch } = useEquipmentListQuery(filters)

  const equipment = data?.data ?? []

  const totalEquipment = data?.pagination.total ?? 0
  const activeEquipment = equipment.filter((item) => item.isActive).length
  const inactiveEquipment = equipment.filter((item) => !item.isActive).length
  const totalAvailableUnits = equipment.reduce((total, item) => total + (item.availableUnits ?? 0), 0)

  const hasActiveFilters = Boolean(search) || categoryFilter !== ACTIVE_FILTER_ALL || activeFilter !== ACTIVE_FILTER_ALL
  const selectedCategory = categories?.find((category) => category._id === categoryFilter) ?? null

  const handleDelete = () => {
    if (!deletingEquipment) return

    const isLastItemOnPage = equipment.length === 1 && page > 1

    deleteMutation.mutate(deletingEquipment._id, {
      onSuccess: (message) => {
        toast.success(message)
        setDeletingEquipment(null)

        if (isLastItemOnPage) setPage((current) => current - 1)
      },
      onError: (error) => {
        toast.error(error instanceof ApiError ? error.message : 'Failed to delete equipment')
      },
    })
  }

  return (
    <PageContainer className="max-w-6xl">
      <div className="space-y-7">
        <PageHeader
          title="Equipment"
          description="Manage the rentable equipment catalog displayed on the public website."
          action={
            <Button asChild size="lg">
              <Link to="/equipment/new">
                <Plus className="size-4" strokeWidth={1.8} />
                Add equipment
              </Link>
            </Button>
          }
        />

        {!isLoading && !isError ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard index="01" label="Total Equipment" value={totalEquipment} icon={Truck} />
            <StatCard index="02" label="Page Units" value={totalAvailableUnits} icon={Boxes} />
            <StatCard index="03" label="Page Active" value={activeEquipment} icon={CheckCircle2} tone="success" />
            <StatCard index="04" label="Page Inactive" value={inactiveEquipment} icon={CircleOff} />
          </div>
        ) : null}

        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <span className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">Catalog Management</span>
              <h2 className="mt-1.5 text-[15px] font-semibold tracking-[-0.015em] text-foreground">Equipment Catalog</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Search, filter and manage equipment available on the public site.</p>
            </div>

            {data ? (
              <span className="hidden text-[11px] font-medium text-muted-foreground/60 tabular-nums sm:block">
                {data.pagination.total} {data.pagination.total === 1 ? 'item' : 'items'}
              </span>
            ) : null}
          </div>

          <div className="rounded-[22px] border border-border/70 bg-card p-4 shadow-[0_1px_3px_rgba(0,0,0,0.025)] sm:p-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground/45" strokeWidth={1.8} aria-hidden="true" />

                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search equipment by title, description or location…"
                  className="h-11 w-full rounded-xl border-border/70 bg-background pl-11 pr-11 text-[13px] shadow-none xl:min-w-[500px]"
                />

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
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger aria-label="Filter by category" className="h-11 w-full rounded-xl border-border/70 bg-background px-3.5 shadow-none sm:min-w-[200px] xl:w-[220px]">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value={ACTIVE_FILTER_ALL}>All categories</SelectItem>

                    {(categories ?? []).map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={activeFilter} onValueChange={setActiveFilter}>
                  <SelectTrigger aria-label="Filter by status" className="h-11 w-full rounded-xl border-border/70 bg-background px-3.5 shadow-none sm:min-w-[160px] xl:w-[175px]">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value={ACTIVE_FILTER_ALL}>All statuses</SelectItem>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
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

                {selectedCategory ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-muted/25 px-2.5 py-1.5 text-[11px]">
                    <span className="font-medium text-foreground">Category</span>
                    <span className="text-muted-foreground">{selectedCategory.name}</span>
                  </span>
                ) : null}

                {activeFilter !== ACTIVE_FILTER_ALL ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-muted/25 px-2.5 py-1.5 text-[11px]">
                    <span className="font-medium text-foreground">Status</span>
                    <span className="text-muted-foreground">{activeFilter === 'true' ? 'Active' : 'Inactive'}</span>
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="overflow-hidden rounded-[18px] border border-border/70 bg-card">
                    <div className="aspect-[16/7.5] animate-pulse bg-muted/55" />

                    <div className="space-y-2.5 p-4">
                      <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />

                      <div className="grid grid-cols-2 gap-2.5 pt-1">
                        <div className="h-12 animate-pulse rounded-[10px] bg-muted/70" />
                        <div className="h-12 animate-pulse rounded-[10px] bg-muted/70" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="flex min-h-[240px] flex-col items-center justify-center rounded-[20px] border border-border/70 bg-card px-6 text-center">
                <div className="flex size-11 items-center justify-center rounded-xl border border-border/70 bg-muted/35 text-muted-foreground">
                  <Truck className="size-5" strokeWidth={1.8} />
                </div>

                <h3 className="mt-3.5 text-sm font-semibold text-foreground">Failed to load equipment</h3>
                <p className="mt-1.5 text-xs text-muted-foreground">Something went wrong while loading the equipment catalog.</p>

                <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
                  Try again
                </Button>
              </div>
            ) : equipment.length === 0 ? (
              <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[20px] border border-dashed border-border bg-card px-6 text-center">
                <div className="flex size-11 items-center justify-center rounded-xl border border-border/70 bg-muted/35 text-muted-foreground">
                  <ImageOff className="size-5" strokeWidth={1.8} />
                </div>

                <h3 className="mt-3.5 text-sm font-semibold text-foreground">No equipment found</h3>
                <p className="mt-1.5 max-w-sm text-xs leading-5 text-muted-foreground">Try adjusting your search or filters, or add a new equipment item.</p>

                {hasActiveFilters ? (
                  <Button type="button" variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {equipment.map((item) => {
                  const imageUrl = getEquipmentImageUrl(item)

                  return (
                    <article key={item._id} className="group relative overflow-hidden rounded-[18px] border border-border/70 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.025)] transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/10 hover:shadow-[0_10px_28px_rgba(0,0,0,0.06)]">
                      <div className="relative aspect-[16/7.5] overflow-hidden bg-muted/40">
                        {imageUrl ? (
                          <img src={imageUrl} alt={item.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.035]" />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-muted/35 text-muted-foreground/35">
                            <Truck className="size-8" strokeWidth={1.3} aria-hidden="true" />
                            <span className="text-[10px] font-medium">No image available</span>
                          </div>
                        )}

                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/[0.02] to-transparent" />

                        <div className="absolute left-3 top-3">
                          <Badge variant={item.isActive ? 'success' : 'secondary'} className="border-white/10 shadow-sm backdrop-blur-md">
                            {item.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>

                        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-lg border border-white/15 bg-black/20 p-1 opacity-0 backdrop-blur-md transition-all duration-200 group-hover:opacity-100">
                          <Button type="button" variant="ghost" size="icon-sm" aria-label={`Edit ${item.title}`} className="text-white/80 hover:bg-white/15 hover:text-white" asChild>
                            <Link to={`/equipment/${item._id}/edit`}>
                              <Pencil className="size-3.5" strokeWidth={1.8} />
                            </Link>
                          </Button>

                          <Button type="button" variant="ghost" size="icon-sm" aria-label={`Delete ${item.title}`} className="text-white/75 hover:bg-red-500/20 hover:text-red-100" onClick={() => setDeletingEquipment(item)}>
                            <Trash2 className="size-3.5" strokeWidth={1.8} />
                          </Button>
                        </div>

                        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 px-3.5 pb-3">
                          <span className="max-w-[68%] truncate text-[9px] font-medium text-white/65">{item.category?.name ?? 'Uncategorized'}</span>
                          <span className="shrink-0 text-[9px] font-semibold text-white/75 tabular-nums">{item.availableUnits} units</span>
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold tracking-[-0.015em] text-foreground">{item.title}</h3>
                            <p className="mt-0.5 truncate text-[10px] font-medium text-muted-foreground">{item.category?.name ?? 'Uncategorized'}</p>
                          </div>

                          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted/30 text-muted-foreground">
                            <Truck className="size-3.5" strokeWidth={1.8} aria-hidden="true" />
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 overflow-hidden rounded-[10px] border border-border/60 bg-muted/[0.12]">
                          <div className="min-w-0 border-r border-border/60 px-3 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="size-3 shrink-0 text-muted-foreground/45" strokeWidth={1.8} />
                              <span className="text-[8px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Location</span>
                            </div>

                            <p className="mt-1 truncate text-[11px] font-medium text-foreground">{item.location || '—'}</p>
                          </div>

                          <div className="px-3 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <Boxes className="size-3 shrink-0 text-muted-foreground/45" strokeWidth={1.8} />
                              <span className="text-[8px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">Available</span>
                            </div>

                            <p className="mt-1 text-[11px] font-semibold text-foreground tabular-nums">
                              {item.availableUnits}
                              <span className="ml-1 font-normal text-muted-foreground">units</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>

          {data ? (
            <div className="mt-5">
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

        <ConfirmDialog
          open={Boolean(deletingEquipment)}
          onOpenChange={(open) => {
            if (!open) setDeletingEquipment(null)
          }}
          title="Delete equipment"
          description={`Are you sure you want to delete "${deletingEquipment?.title}"? Equipment with existing requests will be deactivated instead of deleted.`}
          variant="destructive"
          confirmLabel="Delete"
          onConfirm={handleDelete}
          isLoading={deleteMutation.isPending}
        />
      </div>
    </PageContainer>
  )
}