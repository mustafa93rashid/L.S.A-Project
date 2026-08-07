import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import { Layers, Pencil, Plus, Trash2 } from 'lucide-react'
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
  const { data, isLoading, isError, refetch } = useEquipmentCategoriesQuery()
  const deleteMutation = useDeleteEquipmentCategoryMutation()

  const [deletingCategory, setDeletingCategory] = useState<EquipmentCategory | null>(null)

  const columns = useMemo<ColumnDef<EquipmentCategory, unknown>[]>(
    () => [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'slug', header: 'Slug' },
      { accessorKey: 'displayOrder', header: 'Order' },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? 'success' : 'secondary'}>
            {row.original.isActive ? 'Active' : 'Inactive'}
          </Badge>
        ),
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
              aria-label={`Edit ${row.original.name}`}
              asChild
            >
              <Link to={`/equipment-categories/${row.original._id}/edit`}>
                <Pencil className="size-4" />
              </Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Delete ${row.original.name}`}
              onClick={() => setDeletingCategory(row.original)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    [],
  )

  const handleDelete = () => {
    if (!deletingCategory) return
    deleteMutation.mutate(deletingCategory._id, {
      onSuccess: () => {
        toast.success('Equipment category deleted successfully')
        setDeletingCategory(null)
      },
      onError: (error) => {
        toast.error(
          error instanceof ApiError ? error.message : 'Failed to delete category',
        )
      },
    })
  }

  return (
    <PageContainer>
      <PageHeader
        title="Equipment Categories"
        description="Groups equipment items for the public catalog."
        action={
          <Button type="button" asChild>
            <Link to="/equipment-categories/new">
              <Plus className="size-4" />
              Add category
            </Link>
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data ?? []}
        getRowId={(row) => row._id}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        emptyState={{
          icon: Layers,
          title: 'No equipment categories yet',
          description: 'Add a category to start organizing the equipment catalog.',
        }}
      />

      <ConfirmDialog
        open={Boolean(deletingCategory)}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
        title="Delete category"
        description={`Are you sure you want to delete "${deletingCategory?.name}"? This cannot be undone. Categories containing equipment cannot be deleted.`}
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  )
}
