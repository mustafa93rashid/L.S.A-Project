import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import { FolderKanban, Pencil, Plus, Trash2 } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/data-table/DataTable'
import { ConfirmDialog } from '@/components/overlays/ConfirmDialog'
import { ApiError } from '@/types/api'
import { cloudinaryThumbnail } from '@/lib/cloudinary'
import { useDeleteProjectMutation, useProjectsQuery } from '@/features/projects/queries'
import type { Project } from '@/features/projects/types'

export default function ProjectsPage() {
  const { data, isLoading, isError, refetch } = useProjectsQuery()
  const deleteMutation = useDeleteProjectMutation()

  const [deletingProject, setDeletingProject] = useState<Project | null>(null)

  const columns = useMemo<ColumnDef<Project, unknown>[]>(
    () => [
      {
        id: 'image',
        header: 'Card',
        enableSorting: false,
        cell: ({ row }) => (
          <img
            src={cloudinaryThumbnail(row.original.cardImage.url, 64)}
            alt={row.original.cardImage.alt}
            className="h-10 w-10 rounded-md border border-border object-cover"
          />
        ),
      },
      { accessorKey: 'title', header: 'Title' },
      { accessorKey: 'categoryLabel', header: 'Category', meta: { hideOnMobile: true } },
      { accessorKey: 'displayOrder', header: 'Order', meta: { hideOnMobile: true } },
      {
        id: 'isFeatured',
        header: 'Featured',
        cell: ({ row }) =>
          row.original.isFeatured ? (
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
              <Link to={`/projects/${row.original._id}/edit`}>
                <Pencil className="size-4" />
              </Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Delete ${row.original.title}`}
              onClick={() => setDeletingProject(row.original)}
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
    if (!deletingProject) return
    deleteMutation.mutate(deletingProject._id, {
      onSuccess: () => {
        toast.success('Project deleted successfully')
        setDeletingProject(null)
      },
      onError: (error) => {
        toast.error(
          error instanceof ApiError ? error.message : 'Failed to delete project',
        )
      },
    })
  }

  return (
    <PageContainer>
      <PageHeader
        title="Projects"
        description="Project case studies shown on the public site."
        action={
          <Button type="button" asChild>
            <Link to="/projects/new">
              <Plus className="size-4" />
              Add project
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
          icon: FolderKanban,
          title: 'No projects yet',
          description: 'Add a project to display it on the public site.',
        }}
      />

      <ConfirmDialog
        open={Boolean(deletingProject)}
        onOpenChange={(open) => !open && setDeletingProject(null)}
        title="Delete project"
        description={`Are you sure you want to delete "${deletingProject?.title}"? This cannot be undone.`}
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  )
}
