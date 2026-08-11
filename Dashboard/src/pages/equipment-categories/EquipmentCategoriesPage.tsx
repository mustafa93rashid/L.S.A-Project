import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'

import {
  Activity,
  CircleOff,
  Layers,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'

import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import { DataTable } from '@/components/data-table/DataTable'
import { StatCard } from '@/components/data-display/StatCard'

import { ConfirmDialog } from '@/components/overlays/ConfirmDialog'

import { ApiError } from '@/types/api'

import {
  useDeleteEquipmentCategoryMutation,
  useEquipmentCategoriesQuery,
} from '@/features/equipment-categories/queries'

import type { EquipmentCategory } from '@/features/equipment-categories/types'

export default function EquipmentCategoriesPage() {
  /* =========================================================
      Queries
  ========================================================= */

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useEquipmentCategoriesQuery()

  const deleteMutation =
    useDeleteEquipmentCategoryMutation()

  /* =========================================================
      Local State
  ========================================================= */

  const [
    deletingCategory,
    setDeletingCategory,
  ] = useState<EquipmentCategory | null>(null)

  const categories = data ?? []

  /* =========================================================
      Statistics
  ========================================================= */

  const totalCategories = categories.length

  const activeCategories = categories.filter(
    (category) => category.isActive,
  ).length

  const inactiveCategories =
    totalCategories - activeCategories

  /* =========================================================
      Table Columns
  ========================================================= */

  const columns = useMemo<
    ColumnDef<EquipmentCategory, unknown>[]
  >(
    () => [
      {
        accessorKey: 'name',
        header: 'Category',

        cell: ({ row }) => (
          <div className="flex items-center gap-3">
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
                bg-muted/35
                text-muted-foreground
              "
            >
              <Layers
                className="size-4"
                strokeWidth={1.8}
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0">
              <p
                className="
                  truncate
                  text-sm
                  font-semibold
                  text-foreground
                "
              >
                {row.original.name}
              </p>

              <p
                className="
                  mt-0.5
                  truncate
                  text-[11px]
                  text-muted-foreground
                "
              >
                Equipment category
              </p>
            </div>
          </div>
        ),
      },

      {
        accessorKey: 'slug',
        header: 'Slug',

        cell: ({ row }) => (
          <span
            className="
              inline-flex
              max-w-[220px]
              truncate
              rounded-md
              bg-muted/45
              px-2
              py-1
              font-mono
              text-[11px]
              text-muted-foreground
            "
          >
            {row.original.slug}
          </span>
        ),
      },

      {
        accessorKey: 'displayOrder',
        header: 'Order',

        cell: ({ row }) => (
          <span
            className="
              text-sm
              font-medium
              text-foreground
              tabular-nums
            "
          >
            {row.original.displayOrder}
          </span>
        ),
      },

      {
        accessorKey: 'isActive',
        header: 'Status',

        cell: ({ row }) => (
          <Badge
            variant={
              row.original.isActive
                ? 'success'
                : 'secondary'
            }
          >
            {row.original.isActive
              ? 'Active'
              : 'Inactive'}
          </Badge>
        ),
      },

      {
        id: 'actions',
        header: '',
        enableSorting: false,

        meta: {
          hideOnMobile: true,
        },

        cell: ({ row }) => (
          <div
            className="
              flex
              items-center
              justify-end
              gap-1
            "
          >
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Edit ${row.original.name}`}
              className="
                text-muted-foreground
                hover:bg-muted
                hover:text-foreground
              "
              asChild
            >
              <Link
                to={`/equipment-categories/${row.original._id}/edit`}
              >
                <Pencil
                  className="size-4"
                  strokeWidth={1.8}
                />
              </Link>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Delete ${row.original.name}`}
              className="
                text-muted-foreground
                hover:bg-destructive/10
                hover:text-destructive
              "
              onClick={() =>
                setDeletingCategory(
                  row.original,
                )
              }
            >
              <Trash2
                className="size-4"
                strokeWidth={1.8}
              />
            </Button>
          </div>
        ),
      },
    ],
    [],
  )

  /* =========================================================
      Delete
  ========================================================= */

  const handleDelete = () => {
    if (!deletingCategory) return

    deleteMutation.mutate(
      deletingCategory._id,
      {
        onSuccess: () => {
          toast.success(
            'Equipment category deleted successfully',
          )

          setDeletingCategory(null)
        },

        onError: (error) => {
          toast.error(
            error instanceof ApiError
              ? error.message
              : 'Failed to delete category',
          )
        },
      },
    )
  }

  /* =========================================================
      Render
  ========================================================= */

  return (
    <PageContainer className="max-w-6xl">
      <div className="space-y-7">
        {/* =====================================================
            Header
        ===================================================== */}

        <PageHeader
          title="Equipment Categories"
          description="Organize equipment into structured categories used across the catalog."
          action={
            <Button
              asChild
              className="
                h-10
                rounded-xl
                px-4
                shadow-sm
              "
            >
              <Link to="/equipment-categories/new">
                <Plus
                  className="mr-2 size-4"
                  strokeWidth={1.8}
                />

                Add category
              </Link>
            </Button>
          }
        />

        {/* =====================================================
            Overview
        ===================================================== */}

        {!isLoading && !isError ? (
          <section className="space-y-5">
            {/* =================================================
                Section Header
            ================================================= */}

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
                Business Snapshot
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
                Core Metrics
              </h2>

              <p
                className="
                  mt-1
                  text-xs
                  leading-5
                  text-muted-foreground
                "
              >
                Key category resources currently available across the equipment catalog.
              </p>
            </div>

            {/* =================================================
                Statistics
            ================================================= */}

            <div
              className="
                grid
                grid-cols-1
                gap-3
                sm:grid-cols-2
                lg:grid-cols-3
              "
            >
              <StatCard
                index="01"
                label="Total Categories"
                value={totalCategories}
                icon={Layers}
              />

              <StatCard
                index="02"
                label="Active Categories"
                value={activeCategories}
                icon={Activity}
                tone="success"
              />

              <StatCard
                index="03"
                label="Inactive Categories"
                value={inactiveCategories}
                icon={CircleOff}
              />
            </div>
          </section>
        ) : null}

        {/* =====================================================
            Categories
        ===================================================== */}

        <section>
          {/* ===================================================
              Section Header
          =================================================== */}

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
                Catalog Structure
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
                Categories
              </h2>

              <p
                className="
                  mt-1
                  text-xs
                  leading-5
                  text-muted-foreground
                "
              >
                Manage naming, ordering and visibility for equipment groups.
              </p>
            </div>

            {!isLoading &&
            !isError &&
            totalCategories > 0 ? (
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
                {totalCategories}{' '}
                {totalCategories === 1
                  ? 'category'
                  : 'categories'}
              </span>
            ) : null}
          </div>

          {/* ===================================================
              Table
          =================================================== */}

          <div
            className="
              overflow-hidden
              rounded-[20px]
              border
              border-border/70
              bg-card
              shadow-[0_1px_3px_rgba(0,0,0,0.025)]
            "
          >
            <DataTable
              columns={columns}
              data={categories}
              getRowId={(row) => row._id}
              isLoading={isLoading}
              isError={isError}
              onRetry={() => refetch()}
              emptyState={{
                icon: Layers,
                title:
                  'No equipment categories yet',
                description:
                  'Add a category to start organizing the equipment catalog.',
              }}
            />
          </div>
        </section>

        {/* =====================================================
            Delete Dialog
        ===================================================== */}

        <ConfirmDialog
          open={Boolean(
            deletingCategory,
          )}
          onOpenChange={(open) => {
            if (!open) {
              setDeletingCategory(
                null,
              )
            }
          }}
          title="Delete category"
          description={`Are you sure you want to delete "${deletingCategory?.name}"? This cannot be undone. Categories containing equipment cannot be deleted.`}
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