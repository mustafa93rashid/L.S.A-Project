import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import { Handshake, Pencil, Plus, Trash2 } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/data-table/DataTable'
import { ConfirmDialog } from '@/components/overlays/ConfirmDialog'
import { ApiError } from '@/types/api'
import { cloudinaryThumbnail } from '@/lib/cloudinary'
import { useDeletePartnerMutation, usePartnersQuery } from '@/features/partners/queries'
import type { Partner } from '@/features/partners/types'

export default function PartnersPage() {
  const { data, isLoading, isError, refetch } = usePartnersQuery()
  const deleteMutation = useDeletePartnerMutation()

  const [deletingPartner, setDeletingPartner] = useState<Partner | null>(null)

  const columns = useMemo<ColumnDef<Partner, unknown>[]>(
    () => [
      {
        id: 'logo',
        header: 'Logo',
        enableSorting: false,
        cell: ({ row }) => (
          <img
            src={cloudinaryThumbnail(row.original.logo.url, 64)}
            alt="Partner logo"
            className="h-10 w-10 rounded-md border border-border object-contain p-1"
          />
        ),
      },
      {
        id: 'website',
        header: 'Website',
        cell: ({ row }) =>
          row.original.website ? (
            <a
              href={row.original.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {row.original.website}
            </a>
          ) : (
            <span className="text-muted-foreground">—</span>
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
              aria-label="Edit partner"
              asChild
            >
              <Link to={`/partners/${row.original._id}/edit`}>
                <Pencil className="size-4" />
              </Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Delete partner"
              onClick={() => setDeletingPartner(row.original)}
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
    if (!deletingPartner) return
    deleteMutation.mutate(deletingPartner._id, {
      onSuccess: () => {
        toast.success('Partner deleted successfully')
        setDeletingPartner(null)
      },
      onError: (error) => {
        toast.error(
          error instanceof ApiError ? error.message : 'Failed to delete partner',
        )
      },
    })
  }

  return (
    <PageContainer>
      <PageHeader
        title="Partners"
        description="Partner logos shown on the public site."
        action={
          <Button type="button" asChild>
            <Link to="/partners/new">
              <Plus className="size-4" />
              Add partner
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
          icon: Handshake,
          title: 'No partners yet',
          description: 'Add a partner logo to display it on the public site.',
        }}
      />

      <ConfirmDialog
        open={Boolean(deletingPartner)}
        onOpenChange={(open) => !open && setDeletingPartner(null)}
        title="Delete partner"
        description="Are you sure you want to delete this partner? This cannot be undone."
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  )
}
