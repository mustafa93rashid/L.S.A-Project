import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import { Pencil, Plus, Trash2, Truck } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/data-table/DataTable'
import { TableToolbar } from '@/components/data-table/TableToolbar'
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

export default function EquipmentPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Filters live in the URL (not just local state) so navigating to
  // Create/Edit and back — or sharing/bookmarking the URL — preserves
  // exactly what was being viewed.
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const debouncedSearch = useDebouncedValue(search)
  const categoryFilter = searchParams.get('category') ?? ACTIVE_FILTER_ALL
  const activeFilter = searchParams.get('active') ?? ACTIVE_FILTER_ALL

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
    // Only the debounced search text should trigger this sync.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const setCategoryFilter = (value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value === ACTIVE_FILTER_ALL) next.delete('category')
      else next.set('category', value)
      return next
    })
  }

  const setActiveFilter = (value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value === ACTIVE_FILTER_ALL) next.delete('active')
      else next.set('active', value)
      return next
    })
  }

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

  const [deletingEquipment, setDeletingEquipment] = useState<Equipment | null>(null)

  const columns = useMemo<ColumnDef<Equipment, unknown>[]>(
    () => [
      { accessorKey: 'title', header: 'Title' },
      {
        id: 'category',
        header: 'Category',
        cell: ({ row }) => row.original.category?.name ?? '—',
      },
      { accessorKey: 'location', header: 'Location' },
      { accessorKey: 'availableUnits', header: 'Units' },
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
              aria-label={`Edit ${row.original.title}`}
              asChild
            >
              <Link to={`/equipment/${row.original._id}/edit`}>
                <Pencil className="size-4" />
              </Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Delete ${row.original.title}`}
              onClick={() => setDeletingEquipment(row.original)}
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

  return (
    <PageContainer>
      <PageHeader
        title="Equipment"
        description="The rentable equipment catalog shown on the public site."
        action={
          <Button type="button" asChild>
            <Link to="/equipment/new">
              <Plus className="size-4" />
              Add equipment
            </Link>
          </Button>
        }
      />

      <TableToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by title, description, or location…"
        filters={
          <>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger size="sm" aria-label="Filter by category">
                <SelectValue placeholder="Category" />
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
              <SelectTrigger size="sm" aria-label="Filter by status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ACTIVE_FILTER_ALL}>All statuses</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </>
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
          icon: Truck,
          title: 'No equipment found',
          description: 'Try adjusting your filters, or add a new equipment item.',
        }}
      />

      <ConfirmDialog
        open={Boolean(deletingEquipment)}
        onOpenChange={(open) => !open && setDeletingEquipment(null)}
        title="Delete equipment"
        description={`Are you sure you want to delete "${deletingEquipment?.title}"? Equipment with existing requests will be deactivated instead of deleted.`}
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  )
}
