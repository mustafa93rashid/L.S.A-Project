import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import { Milestone, Pencil, Plus, Trash2 } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/data-table/DataTable'
import { ConfirmDialog } from '@/components/overlays/ConfirmDialog'
import { ApiError } from '@/types/api'
import { cloudinaryThumbnail } from '@/lib/cloudinary'
import { useDeleteJourneyMutation, useJourneysQuery } from '@/features/journeys/queries'
import type { Journey } from '@/features/journeys/types'

export default function JourneysPage() {
  const { data, isLoading, isError, refetch } = useJourneysQuery()
  const deleteMutation = useDeleteJourneyMutation()

  const [deletingJourney, setDeletingJourney] = useState<Journey | null>(null)

  const columns = useMemo<ColumnDef<Journey, unknown>[]>(
    () => [
      {
        id: 'image',
        header: 'Image',
        enableSorting: false,
        cell: ({ row }) => (
          <img
            src={cloudinaryThumbnail(row.original.image.url, 64)}
            alt={row.original.title}
            className="h-10 w-10 rounded-md border border-border object-cover"
          />
        ),
      },
      { accessorKey: 'period', header: 'Period' },
      { accessorKey: 'title', header: 'Title' },
      {
        accessorKey: 'side',
        header: 'Side',
        cell: ({ row }) => (
          <Badge variant="secondary">
            {row.original.side === 'left' ? 'Left' : 'Right'}
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
              <Link to={`/journeys/${row.original._id}/edit`}>
                <Pencil className="size-4" />
              </Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Delete ${row.original.title}`}
              onClick={() => setDeletingJourney(row.original)}
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
    if (!deletingJourney) return
    deleteMutation.mutate(deletingJourney._id, {
      onSuccess: () => {
        toast.success('Journey milestone deleted successfully')
        setDeletingJourney(null)
      },
      onError: (error) => {
        toast.error(
          error instanceof ApiError
            ? error.message
            : 'Failed to delete journey milestone',
        )
      },
    })
  }

  return (
    <PageContainer>
      <PageHeader
        title="Company Journey"
        description="Timeline milestones shown on the public About page."
        action={
          <Button type="button" asChild>
            <Link to="/journeys/new">
              <Plus className="size-4" />
              Add milestone
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
          icon: Milestone,
          title: 'No journey milestones yet',
          description: 'Add a milestone to start building the company timeline.',
        }}
      />

      <ConfirmDialog
        open={Boolean(deletingJourney)}
        onOpenChange={(open) => !open && setDeletingJourney(null)}
        title="Delete journey milestone"
        description={`Are you sure you want to delete "${deletingJourney?.title}"? This cannot be undone.`}
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  )
}
