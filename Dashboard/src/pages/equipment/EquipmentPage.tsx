import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Boxes,
  CheckCircle2,
  CircleOff,
  Filter,
  ImageOff,
  MapPin,
  Pencil,
  Plus,
  Search,
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

import { ConfirmDialog } from '@/components/overlays/ConfirmDialog'

import { useDebouncedValue } from '@/hooks/useDebouncedValue'

import { ApiError } from '@/types/api'

import {
  useDeleteEquipmentMutation,
  useEquipmentListQuery,
} from '@/features/equipment/queries'

import { useEquipmentCategoriesQuery } from '@/features/equipment-categories/queries'

import type { Equipment } from '@/features/equipment/types'

const ACTIVE_FILTER_ALL = 'all'

/* =========================================================
    Equipment Media
========================================================= */

type EquipmentWithMedia = Equipment & {
  image?: {
    url?: string
  } | null

  images?: Array<{
    url?: string
  }>
}

function getEquipmentImageUrl(equipment: Equipment): string | null {
  const item = equipment as EquipmentWithMedia

  return item.images?.[0]?.url ?? item.image?.url ?? null
}

/* =========================================================
    Equipment Page
========================================================= */

export default function EquipmentPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  /* =========================================================
      Filters
  ========================================================= */

  const [search, setSearch] = useState(searchParams.get('q') ?? '')

  const debouncedSearch = useDebouncedValue(search)

  const categoryFilter = searchParams.get('category') ?? ACTIVE_FILTER_ALL

  const activeFilter = searchParams.get('active') ?? ACTIVE_FILTER_ALL

  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)

        if (debouncedSearch) {
          next.set('q', debouncedSearch)
        } else {
          next.delete('q')
        }

        return next
      },
      {
        replace: true,
      },
    )

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const setCategoryFilter = (value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)

      if (value === ACTIVE_FILTER_ALL) {
        next.delete('category')
      } else {
        next.set('category', value)
      }

      return next
    })
  }

  const setActiveFilter = (value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)

      if (value === ACTIVE_FILTER_ALL) {
        next.delete('active')
      } else {
        next.set('active', value)
      }

      return next
    })
  }

  const clearSearch = () => {
    setSearch('')

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)

        next.delete('q')

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
        const next = new URLSearchParams(prev)

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

  /* =========================================================
      Queries
  ========================================================= */

  const { data: categories } = useEquipmentCategoriesQuery()

  const filters = useMemo(
    () => ({
      category: categoryFilter === ACTIVE_FILTER_ALL ? undefined : categoryFilter,

      isActive: activeFilter === ACTIVE_FILTER_ALL ? undefined : activeFilter === 'true',

      search: debouncedSearch || undefined,
    }),
    [categoryFilter, activeFilter, debouncedSearch],
  )

  const { data, isLoading, isError, refetch } = useEquipmentListQuery(filters)

  const deleteMutation = useDeleteEquipmentMutation()

  /* =========================================================
      Local State
  ========================================================= */

  const [deletingEquipment, setDeletingEquipment] = useState<Equipment | null>(null)

  const equipment = data ?? []

  /* =========================================================
      Summary
  ========================================================= */

  const totalEquipment = equipment.length

  const activeEquipment = equipment.filter((item) => item.isActive).length

  const inactiveEquipment = totalEquipment - activeEquipment

  const totalAvailableUnits = equipment.reduce(
    (total, item) => total + (item.availableUnits ?? 0),
    0,
  )

  /* =========================================================
      Active Filters
  ========================================================= */

  const hasActiveFilters =
    Boolean(search) ||
    categoryFilter !== ACTIVE_FILTER_ALL ||
    activeFilter !== ACTIVE_FILTER_ALL

  const selectedCategory =
    categories?.find((category) => category._id === categoryFilter) ?? null

  /* =========================================================
      Delete
  ========================================================= */

  const handleDelete = () => {
    if (!deletingEquipment) return

    deleteMutation.mutate(deletingEquipment._id, {
      onSuccess: (message) => {
        toast.success(message)

        setDeletingEquipment(null)
      },

      onError: (error) => {
        toast.error(
          error instanceof ApiError ? error.message : 'Failed to delete equipment',
        )
      },
    })
  }

  /* =========================================================
      Render
  ========================================================= */

  return (
    <PageContainer className="max-w-6xl">
      <div className="space-y-7">
        {/* =====================================================
            Page Header
        ===================================================== */}

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

{/* =====================================================
    Overview
===================================================== */}

{!isLoading && !isError ? (
  <section className="space-y-5">


    {/* ===================================================
        Metrics
    =================================================== */}

    <div
      className="
        grid
        grid-cols-1
        gap-3
        sm:grid-cols-2
        xl:grid-cols-4
      "
    >
      {/* =================================================
          Total Equipment
      ================================================= */}

      <div
        className="
          group
          relative
          overflow-hidden
          rounded-[18px]
          border
          border-border/70
          bg-card
          px-5
          py-4
          shadow-[0_1px_3px_rgba(0,0,0,0.025)]
          transition-all
          duration-200
          hover:-translate-y-0.5
          hover:border-foreground/10
          hover:shadow-[0_8px_24px_rgba(0,0,0,0.045)]
        "
      >
        <span
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -bottom-5
            right-1
            select-none
            text-[76px]
            leading-none
            font-semibold
            tracking-[-0.08em]
            text-foreground/[0.025]
          "
        >
          01
        </span>

        <div className="relative flex items-center gap-4">
          <div
            className="
              flex
              size-11
              shrink-0
              items-center
              justify-center
              rounded-[13px]
              border
              border-border/70
              bg-muted/40
              text-muted-foreground
            "
          >
            <Truck
              className="size-[18px]"
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </div>

          <div className="min-w-0">
            <p
              className="
                text-[26px]
                leading-none
                font-semibold
                tracking-[-0.04em]
                text-foreground
                tabular-nums
              "
            >
              {totalEquipment}
            </p>

            <p
              className="
                mt-2
                text-[10px]
                font-semibold
                tracking-[0.08em]
                text-muted-foreground
                uppercase
              "
            >
              Total Equipment
            </p>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="
            absolute
            bottom-0
            left-5
            h-[2px]
            w-8
            rounded-full
            bg-foreground/20
            transition-all
            duration-300
            group-hover:w-12
          "
        />
      </div>

      {/* =================================================
          Available Units
      ================================================= */}

      <div
        className="
          group
          relative
          overflow-hidden
          rounded-[18px]
          border
          border-border/70
          bg-card
          px-5
          py-4
          shadow-[0_1px_3px_rgba(0,0,0,0.025)]
          transition-all
          duration-200
          hover:-translate-y-0.5
          hover:border-foreground/10
          hover:shadow-[0_8px_24px_rgba(0,0,0,0.045)]
        "
      >
        <span
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -bottom-5
            right-1
            select-none
            text-[76px]
            leading-none
            font-semibold
            tracking-[-0.08em]
            text-foreground/[0.025]
          "
        >
          02
        </span>

        <div className="relative flex items-center gap-4">
          <div
            className="
              flex
              size-11
              shrink-0
              items-center
              justify-center
              rounded-[13px]
              border
              border-border/70
              bg-muted/40
              text-muted-foreground
            "
          >
            <Boxes
              className="size-[18px]"
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </div>

          <div className="min-w-0">
            <p
              className="
                text-[26px]
                leading-none
                font-semibold
                tracking-[-0.04em]
                text-foreground
                tabular-nums
              "
            >
              {totalAvailableUnits}
            </p>

            <p
              className="
                mt-2
                text-[10px]
                font-semibold
                tracking-[0.08em]
                text-muted-foreground
                uppercase
              "
            >
              Available Units
            </p>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="
            absolute
            bottom-0
            left-5
            h-[2px]
            w-8
            rounded-full
            bg-foreground/20
            transition-all
            duration-300
            group-hover:w-12
          "
        />
      </div>

      {/* =================================================
          Active Equipment
      ================================================= */}

      <div
        className="
          group
          relative
          overflow-hidden
          rounded-[18px]
          border
          border-border/70
          bg-card
          px-5
          py-4
          shadow-[0_1px_3px_rgba(0,0,0,0.025)]
          transition-all
          duration-200
          hover:-translate-y-0.5
          hover:border-success/20
          hover:shadow-[0_8px_24px_rgba(0,0,0,0.045)]
        "
      >
        <span
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -bottom-5
            right-1
            select-none
            text-[76px]
            leading-none
            font-semibold
            tracking-[-0.08em]
            text-success/[0.035]
          "
        >
          03
        </span>

        <div className="relative flex items-center gap-4">
          <div
            className="
              flex
              size-11
              shrink-0
              items-center
              justify-center
              rounded-[13px]
              border
              border-success/15
              bg-success-subtle
              text-success
            "
          >
            <CheckCircle2
              className="size-[18px]"
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </div>

          <div className="min-w-0">
            <p
              className="
                text-[26px]
                leading-none
                font-semibold
                tracking-[-0.04em]
                text-foreground
                tabular-nums
              "
            >
              {activeEquipment}
            </p>

            <div className="mt-2 flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-success" />

              <p
                className="
                  text-[10px]
                  font-semibold
                  tracking-[0.08em]
                  text-muted-foreground
                  uppercase
                "
              >
                Active Equipment
              </p>
            </div>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="
            absolute
            bottom-0
            left-5
            h-[2px]
            w-8
            rounded-full
            bg-success/40
            transition-all
            duration-300
            group-hover:w-12
          "
        />
      </div>

      {/* =================================================
          Inactive Equipment
      ================================================= */}

      <div
        className="
          group
          relative
          overflow-hidden
          rounded-[18px]
          border
          border-border/70
          bg-card
          px-5
          py-4
          shadow-[0_1px_3px_rgba(0,0,0,0.025)]
          transition-all
          duration-200
          hover:-translate-y-0.5
          hover:border-foreground/10
          hover:shadow-[0_8px_24px_rgba(0,0,0,0.045)]
        "
      >
        <span
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -bottom-5
            right-1
            select-none
            text-[76px]
            leading-none
            font-semibold
            tracking-[-0.08em]
            text-foreground/[0.025]
          "
        >
          04
        </span>

        <div className="relative flex items-center gap-4">
          <div
            className="
              flex
              size-11
              shrink-0
              items-center
              justify-center
              rounded-[13px]
              border
              border-border/70
              bg-muted/40
              text-muted-foreground
            "
          >
            <CircleOff
              className="size-[18px]"
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </div>

          <div className="min-w-0">
            <p
              className="
                text-[26px]
                leading-none
                font-semibold
                tracking-[-0.04em]
                text-foreground
                tabular-nums
              "
            >
              {inactiveEquipment}
            </p>

            <div className="mt-2 flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-muted-foreground/40" />

              <p
                className="
                  text-[10px]
                  font-semibold
                  tracking-[0.08em]
                  text-muted-foreground
                  uppercase
                "
              >
                Inactive Equipment
              </p>
            </div>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="
            absolute
            bottom-0
            left-5
            h-[2px]
            w-8
            rounded-full
            bg-muted-foreground/20
            transition-all
            duration-300
            group-hover:w-12
          "
        />
      </div>
    </div>
  </section>
) : null}

        {/* =====================================================
            Catalog Management
        ===================================================== */}

        <section>
          {/* Title */}
          <div
            className="
              mb-5
              flex
              items-end
              justify-between
              gap-4
            "
          >
            <div>
              <span
                className="
                  text-[10px]
                  font-semibold
                  tracking-[0.14em]
                  text-muted-foreground
                  uppercase
                "
              >
                Catalog Management
              </span>

              <h2
                className="
                  mt-1.5
                  text-[15px]
                  font-semibold
                  tracking-[-0.015em]
                  text-foreground
                "
              >
                Equipment Catalog
              </h2>

              <p
                className="
                  mt-1
                  text-xs
                  leading-5
                  text-muted-foreground
                "
              >
                Search, filter and manage equipment available on the public site.
              </p>
            </div>

            {!isLoading && !isError ? (
              <span
                className="
                  hidden
                  text-[11px]
                  font-medium
                  text-muted-foreground/60
                  tabular-nums
                  sm:block
                "
              >
                {equipment.length} {equipment.length === 1 ? 'item' : 'items'}
              </span>
            ) : null}
          </div>

          {/* ===================================================
              Search & Filters
          =================================================== */}

          <div
            className="
              rounded-[22px]
              border
              border-border/70
              bg-card
              p-4
              shadow-[0_1px_3px_rgba(0,0,0,0.025)]
              sm:p-5
            "
          >
            <div
              className="
                flex
                flex-col
                gap-3
                xl:flex-row
                xl:items-center
              "
            >
              {/* Large Search */}
              <div
                className="
                  relative
                  min-w-0
                  flex-1
                "
              >
                <Search
                  className="
                    pointer-events-none
                    absolute
                    left-4
                    top-1/2
                    size-[18px]
                    -translate-y-1/2
                    text-muted-foreground/45
                  "
                  strokeWidth={1.8}
                />

                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search equipment by title, description or location…"
                  className="
                    h-11
                    w-full
                    rounded-xl
                    border-border/70
                    bg-background
                    pl-11
                    pr-11
                    text-[13px]
                    shadow-none
                    xl:min-w-[500px]
                  "
                />

                {search ? (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={clearSearch}
                    className="
                      absolute
                      right-3
                      top-1/2
                      flex
                      size-7
                      -translate-y-1/2
                      items-center
                      justify-center
                      rounded-lg
                      text-muted-foreground/45
                      transition-colors
                      hover:bg-muted
                      hover:text-foreground
                    "
                  >
                    <X className="size-3.5" />
                  </button>
                ) : null}
              </div>

              {/* Filter Label */}
              <div
                className="
                  hidden
                  shrink-0
                  items-center
                  gap-2
                  px-1
                  text-[10px]
                  font-semibold
                  tracking-[0.1em]
                  text-muted-foreground/55
                  uppercase
                  xl:flex
                "
              >
                <Filter className="size-3.5" strokeWidth={1.8} />
                Filters
              </div>

              {/* Filters */}
              <div
                className="
                  grid
                  grid-cols-1
                  gap-2
                  sm:grid-cols-2
                  xl:flex
                  xl:shrink-0
                "
              >
                {/* Category */}
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger
                    aria-label="Filter by category"
                    className="
                      h-11
                      w-full
                      rounded-xl
                      border-border/70
                      bg-background
                      px-3.5
                      shadow-none
                      sm:min-w-[200px]
                      xl:w-[220px]
                    "
                  >
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

                {/* Status */}
                <Select value={activeFilter} onValueChange={setActiveFilter}>
                  <SelectTrigger
                    aria-label="Filter by status"
                    className="
                      h-11
                      w-full
                      rounded-xl
                      border-border/70
                      bg-background
                      px-3.5
                      shadow-none
                      sm:min-w-[160px]
                      xl:w-[175px]
                    "
                  >
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

            {/* Active Filters */}
            {hasActiveFilters ? (
              <div
                className="
                  mt-4
                  flex
                  flex-wrap
                  items-center
                  gap-2
                  border-t
                  border-border/60
                  pt-3.5
                "
              >
                <span
                  className="
                    mr-1
                    text-[9px]
                    font-semibold
                    tracking-[0.1em]
                    text-muted-foreground/50
                    uppercase
                  "
                >
                  Active filters
                </span>

                {search ? (
                  <span
                    className="
                      inline-flex
                      max-w-[260px]
                      items-center
                      gap-1.5
                      rounded-lg
                      border
                      border-border/70
                      bg-muted/25
                      px-2.5
                      py-1.5
                      text-[11px]
                    "
                  >
                    <span className="font-medium text-foreground">Search</span>

                    <span className="truncate text-muted-foreground">{search}</span>
                  </span>
                ) : null}

                {selectedCategory ? (
                  <span
                    className="
                      inline-flex
                      items-center
                      gap-1.5
                      rounded-lg
                      border
                      border-border/70
                      bg-muted/25
                      px-2.5
                      py-1.5
                      text-[11px]
                    "
                  >
                    <span className="font-medium text-foreground">Category</span>

                    <span className="text-muted-foreground">{selectedCategory.name}</span>
                  </span>
                ) : null}

                {activeFilter !== ACTIVE_FILTER_ALL ? (
                  <span
                    className="
                      inline-flex
                      items-center
                      gap-1.5
                      rounded-lg
                      border
                      border-border/70
                      bg-muted/25
                      px-2.5
                      py-1.5
                      text-[11px]
                    "
                  >
                    <span className="font-medium text-foreground">Status</span>

                    <span className="text-muted-foreground">
                      {activeFilter === 'true' ? 'Active' : 'Inactive'}
                    </span>
                  </span>
                ) : null}

                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={clearFilters}
                  className="
                    ml-auto
                    text-muted-foreground
                  "
                >
                  <X className="size-3" />
                  Clear all
                </Button>
              </div>
            ) : null}
          </div>

          {/* ===================================================
              Equipment Content
          =================================================== */}

          <div className="mt-5">
            {/* Loading */}
            {isLoading ? (
              <div
                className="
                  grid
                  grid-cols-1
                  gap-5
                  md:grid-cols-2
                  2xl:grid-cols-3
                "
              >
                {Array.from({
                  length: 6,
                }).map((_, index) => (
                  <div
                    key={index}
                    className="
                        overflow-hidden
                        rounded-[22px]
                        border
                        border-border/70
                        bg-card
                      "
                  >
                    <div
                      className="
                          aspect-[16/8.5]
                          animate-pulse
                          bg-muted/55
                        "
                    />

                    <div className="space-y-3 p-5">
                      <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />

                      <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="h-14 animate-pulse rounded-xl bg-muted/70" />

                        <div className="h-14 animate-pulse rounded-xl bg-muted/70" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : isError ? (
              /* Error */
              <div
                className="
                  flex
                  min-h-[280px]
                  flex-col
                  items-center
                  justify-center
                  rounded-[22px]
                  border
                  border-border/70
                  bg-card
                  px-6
                  text-center
                "
              >
                <div
                  className="
                    flex
                    size-12
                    items-center
                    justify-center
                    rounded-2xl
                    border
                    border-border/70
                    bg-muted/35
                    text-muted-foreground
                  "
                >
                  <Truck className="size-5" strokeWidth={1.8} />
                </div>

                <h3 className="mt-4 text-sm font-semibold text-foreground">
                  Failed to load equipment
                </h3>

                <p className="mt-1.5 text-xs text-muted-foreground">
                  Something went wrong while loading the equipment catalog.
                </p>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => refetch()}
                >
                  Try again
                </Button>
              </div>
            ) : equipment.length === 0 ? (
              /* Empty */
              <div
                className="
                  flex
                  min-h-[300px]
                  flex-col
                  items-center
                  justify-center
                  rounded-[22px]
                  border
                  border-dashed
                  border-border
                  bg-card
                  px-6
                  text-center
                "
              >
                <div
                  className="
                    flex
                    size-12
                    items-center
                    justify-center
                    rounded-2xl
                    border
                    border-border/70
                    bg-muted/35
                    text-muted-foreground
                  "
                >
                  <ImageOff className="size-5" strokeWidth={1.8} />
                </div>

                <h3 className="mt-4 text-sm font-semibold text-foreground">
                  No equipment found
                </h3>

                <p
                  className="
                    mt-1.5
                    max-w-sm
                    text-xs
                    leading-5
                    text-muted-foreground
                  "
                >
                  Try adjusting your search or filters, or add a new equipment item.
                </p>

                {hasActiveFilters ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={clearFilters}
                  >
                    Clear filters
                  </Button>
                ) : null}
              </div>
            ) : (
              /* ===============================================
                  Equipment Grid
              =============================================== */

              <div
                className="
                  grid
                  grid-cols-1
                  gap-5
                  md:grid-cols-2
                  2xl:grid-cols-3
                "
              >
                {equipment.map((item) => {
  const imageUrl = getEquipmentImageUrl(item)

  return (
    <article
      key={item._id}
      className="
        group
        relative
        overflow-hidden
        rounded-[22px]
        border
        border-border/70
        bg-card
        shadow-[0_1px_3px_rgba(0,0,0,0.025)]
        transition-all
        duration-300
        hover:-translate-y-1
        hover:border-foreground/10
        hover:shadow-[0_14px_36px_rgba(0,0,0,0.07)]
      "
    >
      {/* =====================================================
          Image
      ===================================================== */}

      <div className="relative aspect-[16/9] overflow-hidden bg-muted/40">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.title}
            loading="lazy"
            className="
              h-full
              w-full
              object-cover
              transition-transform
              duration-500
              ease-out
              group-hover:scale-[1.045]
            "
          />
        ) : (
          <div
            className="
              flex
              h-full
              w-full
              flex-col
              items-center
              justify-center
              gap-2
              bg-muted/35
              text-muted-foreground/35
            "
          >
            <Truck
              className="size-10"
              strokeWidth={1.3}
              aria-hidden="true"
            />

            <span className="text-[10px] font-medium">
              No image available
            </span>
          </div>
        )}

        {/* Soft image overlay */}
        <div
          className="
            pointer-events-none
            absolute
            inset-0
            bg-gradient-to-t
            from-black/45
            via-black/[0.03]
            to-transparent
          "
        />

        {/* Status */}
        <div className="absolute left-4 top-4">
          <Badge
            variant={item.isActive ? 'success' : 'secondary'}
            className="
              border-white/10
              shadow-sm
              backdrop-blur-md
            "
          >
            {item.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        {/* Actions */}
        <div
          className="
            absolute
            right-3
            top-3
            flex
            items-center
            gap-1
            rounded-xl
            border
            border-white/15
            bg-black/20
            p-1
            opacity-0
            shadow-sm
            backdrop-blur-md
            transition-all
            duration-200
            group-hover:opacity-100
          "
        >
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Edit ${item.title}`}
            className="
              text-white/80
              hover:bg-white/15
              hover:text-white
            "
            asChild
          >
            <Link to={`/equipment/${item._id}/edit`}>
              <Pencil
                className="size-3.5"
                strokeWidth={1.8}
              />
            </Link>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${item.title}`}
            className="
              text-white/75
              hover:bg-red-500/20
              hover:text-red-100
            "
            onClick={() => setDeletingEquipment(item)}
          >
            <Trash2
              className="size-3.5"
              strokeWidth={1.8}
            />
          </Button>
        </div>

        {/* Image Bottom Data */}
        <div
          className="
            absolute
            inset-x-0
            bottom-0
            flex
            items-end
            justify-between
            gap-4
            px-4
            pb-3.5
          "
        >
          <span
            className="
              max-w-[70%]
              truncate
              text-[10px]
              font-medium
              text-white/65
            "
          >
            {item.category?.name ?? 'Uncategorized'}
          </span>

          <span
            className="
              shrink-0
              text-[10px]
              font-semibold
              text-white/75
              tabular-nums
            "
          >
            {item.availableUnits} units
          </span>
        </div>
      </div>

      {/* =====================================================
          Content
      ===================================================== */}

      <div className="p-5">
        {/* Title */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3
              className="
                truncate
                text-[15px]
                font-semibold
                tracking-[-0.018em]
                text-foreground
              "
            >
              {item.title}
            </h3>

            <p
              className="
                mt-1
                truncate
                text-[11px]
                font-medium
                text-muted-foreground
              "
            >
              {item.category?.name ?? 'Uncategorized'}
            </p>
          </div>

          <div
            className="
              flex
              size-9
              shrink-0
              items-center
              justify-center
              rounded-xl
              border
              border-border/70
              bg-muted/30
              text-muted-foreground
            "
          >
            <Truck
              className="size-4"
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </div>
        </div>

        {/* ===================================================
            Metadata
        =================================================== */}

        <div
          className="
            mt-4
            grid
            grid-cols-2
            overflow-hidden
            rounded-xl
            border
            border-border/60
            bg-muted/[0.12]
          "
        >
          {/* Location */}
          <div
            className="
              min-w-0
              border-r
              border-border/60
              px-3.5
              py-3
            "
          >
            <div className="flex items-center gap-2">
              <MapPin
                className="
                  size-3.5
                  shrink-0
                  text-muted-foreground/45
                "
                strokeWidth={1.8}
              />

              <span
                className="
                  text-[9px]
                  font-semibold
                  tracking-[0.08em]
                  text-muted-foreground
                  uppercase
                "
              >
                Location
              </span>
            </div>

            <p
              className="
                mt-1.5
                truncate
                text-[12px]
                font-medium
                text-foreground
              "
            >
              {item.location || '—'}
            </p>
          </div>

          {/* Units */}
          <div className="px-3.5 py-3">
            <div className="flex items-center gap-2">
              <Boxes
                className="
                  size-3.5
                  shrink-0
                  text-muted-foreground/45
                "
                strokeWidth={1.8}
              />

              <span
                className="
                  text-[9px]
                  font-semibold
                  tracking-[0.08em]
                  text-muted-foreground
                  uppercase
                "
              >
                Available
              </span>
            </div>

            <p
              className="
                mt-1.5
                text-[12px]
                font-semibold
                text-foreground
                tabular-nums
              "
            >
              {item.availableUnits}

              <span className="ml-1 font-normal text-muted-foreground">
                units
              </span>
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
        </section>

        {/* =====================================================
            Delete Confirmation
        ===================================================== */}

        <ConfirmDialog
          open={Boolean(deletingEquipment)}
          onOpenChange={(open) => {
            if (!open) {
              setDeletingEquipment(null)
            }
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
