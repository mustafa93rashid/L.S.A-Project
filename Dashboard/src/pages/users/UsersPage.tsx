import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Users as UsersIcon } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TableToolbar } from '@/components/data-table/TableToolbar'
import { Pagination } from '@/components/data-table/Pagination'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ConfirmDialog } from '@/components/overlays/ConfirmDialog'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useOpenCreateOnArrival } from '@/hooks/useOpenCreateOnArrival'
import { useSessionStore } from '@/stores/session.store'
import { ROLES, ROLE_LABELS, type Role } from '@/constants/roles'
import { ApiError } from '@/types/api'
import {
  useDeleteUserMutation,
  useUpdateUserStatusMutation,
  useUsersQuery,
} from '@/features/users/queries'
import type { User } from '@/features/users/types'
import { InviteUserDialog } from '@/features/users/components/InviteUserDialog'
import { ChangeRoleDialog } from '@/features/users/components/ChangeRoleDialog'
import { UserCard } from '@/features/users/components/UserCard'
import { UserCardSkeleton } from '@/features/users/components/UserCardSkeleton'

const ALL = 'all'
const DEFAULT_LIMIT = 10
const SKELETON_COUNT = 8
const ASSIGNABLE_ROLES = Object.values(ROLES)

const CARD_GRID_CLASSES =
  'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'

export default function UsersPage() {
  const currentUserId = useSessionStore((state) => state.user?._id)

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [roleFilter, setRoleFilter] = useState<string>(ALL)
  const [statusFilter, setStatusFilter] = useState<string>(ALL)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_LIMIT)

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      role: roleFilter === ALL ? undefined : (roleFilter as Role),
      isActive: statusFilter === ALL ? undefined : statusFilter === 'true',
      page,
      limit,
    }),
    [debouncedSearch, roleFilter, statusFilter, page, limit],
  )

  const { data, isLoading, isError, refetch } = useUsersQuery(filters)
  const statusMutation = useUpdateUserStatusMutation()
  const deleteMutation = useDeleteUserMutation()

  const [inviteOpen, setInviteOpen] = useState(false)
  useOpenCreateOnArrival(() => setInviteOpen(true))

  const [roleTarget, setRoleTarget] = useState<User | null>(null)
  const [statusTarget, setStatusTarget] = useState<User | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)

  const handleStatusToggle = () => {
    if (!statusTarget) return
    statusMutation.mutate(
      { id: statusTarget._id, isActive: !statusTarget.isActive },
      {
        onSuccess: () => {
          toast.success(
            statusTarget.isActive
              ? 'User deactivated successfully'
              : 'User activated successfully',
          )
          setStatusTarget(null)
        },
        onError: (error) => {
          toast.error(
            error instanceof ApiError ? error.message : 'Failed to update status',
          )
          setStatusTarget(null)
        },
      },
    )
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    const isLastRowOnPage = data?.data.length === 1 && page > 1
    deleteMutation.mutate(deleteTarget._id, {
      onSuccess: () => {
        toast.success('User deleted successfully')
        setDeleteTarget(null)
        if (isLastRowOnPage) setPage((current) => current - 1)
      },
      onError: (error) => {
        toast.error(error instanceof ApiError ? error.message : 'Failed to delete user')
      },
    })
  }

  return (
    <PageContainer>
      <PageHeader
        title="Users"
        description="Dashboard accounts and role assignments."
        action={
          <Button type="button" onClick={() => setInviteOpen(true)}>
            <Plus className="size-4" />
            Invite user
          </Button>
        }
      />

      <TableToolbar
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value)
          setPage(1)
        }}
        searchPlaceholder="Search by name, email, or phone…"
        filters={
          <>
            <Select
              value={roleFilter}
              onValueChange={(value) => {
                setRoleFilter(value)
                setPage(1)
              }}
            >
              <SelectTrigger size="sm" aria-label="Filter by role">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All roles</SelectItem>
                {ASSIGNABLE_ROLES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {ROLE_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value)
                setPage(1)
              }}
            >
              <SelectTrigger size="sm" aria-label="Filter by status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All statuses</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
      />

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className={CARD_GRID_CLASSES}>
          {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <UserCardSkeleton key={index} />
          ))}
        </div>
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="No users found"
          description="Try adjusting your filters, or invite a new dashboard user."
        />
      ) : (
        <div className={CARD_GRID_CLASSES}>
          {data.data.map((user) => (
            <UserCard
              key={user._id}
              user={user}
              isSelf={user._id === currentUserId}
              onChangeRole={() => setRoleTarget(user)}
              onToggleStatus={() => setStatusTarget(user)}
              onDelete={() => setDeleteTarget(user)}
            />
          ))}
        </div>
      )}

      {data ? (
        <Pagination
          page={data.pagination.currentPage}
          totalPages={data.pagination.totalPages}
          hasNextPage={data.pagination.currentPage < data.pagination.totalPages}
          hasPreviousPage={data.pagination.currentPage > 1}
          onPageChange={setPage}
          limit={limit}
          limitOptions={[10, 20, 50, 100]}
          onLimitChange={(value) => {
            setLimit(value)
            setPage(1)
          }}
        />
      ) : null}

      <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} />

      <ChangeRoleDialog
        user={roleTarget}
        onOpenChange={(open) => !open && setRoleTarget(null)}
      />

      <ConfirmDialog
        open={Boolean(statusTarget)}
        onOpenChange={(open) => !open && setStatusTarget(null)}
        title={statusTarget?.isActive ? 'Deactivate user' : 'Activate user'}
        description={`Are you sure you want to ${statusTarget?.isActive ? 'deactivate' : 'activate'} "${statusTarget?.fullName}"?`}
        variant={statusTarget?.isActive ? 'destructive' : 'default'}
        confirmLabel={statusTarget?.isActive ? 'Deactivate' : 'Activate'}
        onConfirm={handleStatusToggle}
        isLoading={statusMutation.isPending}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete user"
        description={`Are you sure you want to delete "${deleteTarget?.fullName}"? This cannot be undone.`}
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </PageContainer>
  )
}
