import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import { Pencil, Plus, Trash2, Users } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/data-table/DataTable'
import { ConfirmDialog } from '@/components/overlays/ConfirmDialog'
import { ApiError } from '@/types/api'
import { cloudinaryThumbnail } from '@/lib/cloudinary'
import {
  useDeleteTeamMemberMutation,
  useTeamMembersQuery,
} from '@/features/team-members/queries'
import type { TeamMember } from '@/features/team-members/types'

export default function TeamMembersPage() {
  const { data, isLoading, isError, refetch } = useTeamMembersQuery()
  const deleteMutation = useDeleteTeamMemberMutation()

  const [deletingTeamMember, setDeletingTeamMember] = useState<TeamMember | null>(null)

  const columns = useMemo<ColumnDef<TeamMember, unknown>[]>(
    () => [
      {
        id: 'image',
        header: 'Photo',
        enableSorting: false,
        cell: ({ row }) => (
          <img
            src={cloudinaryThumbnail(row.original.image.url, 64)}
            alt={row.original.fullName}
            className="h-10 w-10 rounded-full border border-border object-cover"
          />
        ),
      },
      { accessorKey: 'fullName', header: 'Name' },
      { accessorKey: 'position', header: 'Position' },
      { accessorKey: 'experience', header: 'Experience' },
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
              aria-label={`Edit ${row.original.fullName}`}
              asChild
            >
              <Link to={`/team-members/${row.original._id}/edit`}>
                <Pencil className="size-4" />
              </Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Delete ${row.original.fullName}`}
              onClick={() => setDeletingTeamMember(row.original)}
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
    if (!deletingTeamMember) return
    deleteMutation.mutate(deletingTeamMember._id, {
      onSuccess: () => {
        toast.success('Team member deleted successfully')
        setDeletingTeamMember(null)
      },
      onError: (error) => {
        toast.error(
          error instanceof ApiError ? error.message : 'Failed to delete team member',
        )
      },
    })
  }

  return (
    <PageContainer>
      <PageHeader
        title="Team Members"
        description="Staff profiles shown on the public About page."
        action={
          <Button type="button" asChild>
            <Link to="/team-members/new">
              <Plus className="size-4" />
              Add team member
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
          icon: Users,
          title: 'No team members yet',
          description: 'Add a team member to display them on the public site.',
        }}
      />

      <ConfirmDialog
        open={Boolean(deletingTeamMember)}
        onOpenChange={(open) => !open && setDeletingTeamMember(null)}
        title="Delete team member"
        description={`Are you sure you want to delete "${deletingTeamMember?.fullName}"? This cannot be undone.`}
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  )
}
