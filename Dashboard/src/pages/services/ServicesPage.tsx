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
import { cloudinaryThumbnail } from '@/lib/cloudinary'
import { useDeleteServiceMutation, useServicesQuery } from '@/features/services/queries'
import type { Service } from '@/features/services/types'

export default function ServicesPage() {
  const { data, isLoading, isError, refetch } = useServicesQuery()
  const deleteMutation = useDeleteServiceMutation()

  const [deletingService, setDeletingService] = useState<Service | null>(null)

  const visibleHomeCount = useMemo(
    () =>
      (data ?? []).filter(
        (service) => service.homeCapability?.isVisible && service.isActive,
      ).length,
    [data],
  )

  const columns = useMemo<ColumnDef<Service, unknown>[]>(
    () => [
      {
        id: 'image',
        header: 'Card',
        enableSorting: false,
        cell: ({ row }) =>
          row.original.serviceCard?.image.url ? (
            <img
              src={cloudinaryThumbnail(row.original.serviceCard.image.url, 64)}
              alt={row.original.serviceCard.image.alt}
              className="h-10 w-10 rounded-md border border-border object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-md border border-dashed border-border" />
          ),
      },
      { accessorKey: 'title', header: 'Title' },
      { accessorKey: 'slug', header: 'Slug', meta: { hideOnMobile: true } },
      { accessorKey: 'displayOrder', header: 'Order', meta: { hideOnMobile: true } },
      {
        id: 'completeness',
        header: 'Content',
        cell: ({ row }) =>
          row.original.serviceCard && row.original.heroSection ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <Badge variant="destructive">Incomplete</Badge>
          ),
      },
      {
        id: 'homeCapability',
        header: 'Home Capabilities',
        cell: ({ row }) =>
          row.original.homeCapability?.isVisible ? (
            <Badge variant="info">Featured</Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
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
              <Link to={`/services/${row.original._id}/edit`}>
                <Pencil className="size-4" />
              </Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Delete ${row.original.title}`}
              onClick={() => setDeletingService(row.original)}
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
    if (!deletingService) return
    deleteMutation.mutate(deletingService._id, {
      onSuccess: () => {
        toast.success('Service deleted successfully')
        setDeletingService(null)
      },
      onError: (error) => {
        toast.error(
          error instanceof ApiError ? error.message : 'Failed to delete service',
        )
      },
    })
  }

  return (
    <PageContainer>
      <PageHeader
        title="Services"
        description={`Service pages shown on the public site. ${visibleHomeCount}/6 Home Capabilities slots used.`}
        action={
          <Button type="button" asChild>
            <Link to="/services/new">
              <Plus className="size-4" />
              Add service
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
          title: 'No services yet',
          description: 'Add a service to display it on the public site.',
        }}
      />

      <ConfirmDialog
        open={Boolean(deletingService)}
        onOpenChange={(open) => !open && setDeletingService(null)}
        title="Delete service"
        description={`Are you sure you want to delete "${deletingService?.title}"? This cannot be undone.`}
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  )
}
