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
import { ConfirmDialog } from '@/components/overlays/ConfirmDialog'

import { ApiError } from '@/types/api'

import {
  useDeleteEquipmentCategoryMutation,
  useEquipmentCategoriesQuery,
} from '@/features/equipment-categories/queries'

import type { EquipmentCategory } from '@/features/equipment-categories/types'

export default function EquipmentCategoriesPage() {
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useEquipmentCategoriesQuery()

  const deleteMutation =
    useDeleteEquipmentCategoryMutation()

  const [
    deletingCategory,
    setDeletingCategory,
  ] = useState<EquipmentCategory | null>(null)

  const categories = data ?? []

  const totalCategories = categories.length

  const activeCategories = categories.filter(
    (category) => category.isActive,
  ).length

  const inactiveCategories =
    totalCategories - activeCategories

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
              <p className="truncate text-sm font-semibold text-foreground">
                {row.original.name}
              </p>

              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
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
          <span className="text-sm font-medium text-foreground tabular-nums">
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
          <div className="flex items-center justify-end gap-1">
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
              onClick={() =>
                setDeletingCategory(
                  row.original,
                )
              }
              className="
                text-muted-foreground
                hover:bg-destructive/10
                hover:text-destructive
              "
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


    {/* ===================================================
        Metrics
    =================================================== */}

    <div
      className="
        grid
        grid-cols-1
        gap-3
        sm:grid-cols-2
        lg:grid-cols-3
      "
    >
      {/* =================================================
          Total Categories
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
        {/* Decorative number */}
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
            <Layers
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
              {totalCategories}
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
              Total Categories
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
          Active Categories
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
              border-success/15
              bg-success-subtle
              text-success
            "
          >
            <Activity
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
              {activeCategories}
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
                Active Categories
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
          Inactive Categories
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
              {inactiveCategories}
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
                Inactive Categories
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
            Categories
        ===================================================== */}

        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <span className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                Catalog Structure
              </span>

              <h2 className="mt-1.5 text-[15px] font-semibold tracking-[-0.015em] text-foreground">
                Categories
              </h2>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Manage naming, ordering and visibility for equipment groups.
              </p>
            </div>

            {!isLoading &&
            !isError &&
            totalCategories > 0 ? (
              <span className="hidden text-[11px] font-medium text-muted-foreground/60 tabular-nums sm:block">
                {totalCategories}{' '}
                {totalCategories === 1
                  ? 'category'
                  : 'categories'}
              </span>
            ) : null}
          </div>

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
          open={Boolean(deletingCategory)}
          onOpenChange={(open) => {
            if (!open) {
              setDeletingCategory(null)
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
