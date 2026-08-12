import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Filter, Plus, Search, Users as UsersIcon, X } from 'lucide-react'

import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

  const [inviteOpen, setInviteOpen] = useState(false)
  const [roleTarget, setRoleTarget] = useState<User | null>(null)
  const [statusTarget, setStatusTarget] = useState<User | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)

  useOpenCreateOnArrival(() => setInviteOpen(true))

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      role: roleFilter === ALL ? undefined : (roleFilter as Role),
      isActive:
        statusFilter === ALL
          ? undefined
          : statusFilter === 'true',
      page,
      limit,
    }),
    [
      debouncedSearch,
      roleFilter,
      statusFilter,
      page,
      limit,
    ],
  )

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useUsersQuery(filters)

  const statusMutation = useUpdateUserStatusMutation()
  const deleteMutation = useDeleteUserMutation()

  const users = data?.data ?? []

  const hasActiveFilters =
    Boolean(search) ||
    roleFilter !== ALL ||
    statusFilter !== ALL

  const clearFilters = () => {
    setSearch('')
    setRoleFilter(ALL)
    setStatusFilter(ALL)
    setPage(1)
  }

  const handleStatusToggle = () => {
    if (!statusTarget) return

    statusMutation.mutate(
      {
        id: statusTarget._id,
        isActive: !statusTarget.isActive,
      },
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
            error instanceof ApiError
              ? error.message
              : 'Failed to update status',
          )

          setStatusTarget(null)
        },
      },
    )
  }

  const handleDelete = () => {
    if (!deleteTarget) return

    const isLastRowOnPage =
      data?.data.length === 1 && page > 1

    deleteMutation.mutate(deleteTarget._id, {
      onSuccess: () => {
        toast.success('User deleted successfully')

        setDeleteTarget(null)

        if (isLastRowOnPage) {
          setPage((current) => current - 1)
        }
      },

      onError: (error) => {
        toast.error(
          error instanceof ApiError
            ? error.message
            : 'Failed to delete user',
        )
      },
    })
  }

  return (
    <PageContainer>
      <div className="space-y-7">
        <PageHeader
          title="Users"
          description="Manage dashboard accounts, roles, permissions and account status."
          action={
            <Button
              type="button"
              size="lg"
              onClick={() => setInviteOpen(true)}
            >
              <Plus
                className="size-4"
                strokeWidth={1.8}
              />

              Invite user
            </Button>
          }
        />

        <section>
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                Access Management
              </span>

              <h2 className="mt-1.5 text-[15px] font-semibold tracking-[-0.015em] text-foreground">
                Dashboard Accounts
              </h2>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Search users, review account status and manage assigned roles.
              </p>
            </div>

            {data ? (
              <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-card px-3 py-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-muted/40 text-muted-foreground">
                  <UsersIcon
                    className="size-3.5"
                    strokeWidth={1.8}
                  />
                </div>

                <div>
                  <p className="text-[9px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                    Users
                  </p>

                  <p className="mt-0.5 text-sm font-semibold text-foreground tabular-nums">
                    {data.pagination.totalUsers}
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mb-5 rounded-[22px] border border-border/70 bg-card p-4 shadow-[0_1px_3px_rgba(0,0,0,0.025)] sm:p-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <div className="relative min-w-0 flex-1">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground/45"
                  strokeWidth={1.8}
                />

                <Input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value)
                    setPage(1)
                  }}
                  placeholder="Search by name, email, or phone…"
                  className="h-11 w-full rounded-xl border-border/70 bg-background pl-11 pr-11 text-[13px] shadow-none"
                />

                {search ? (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                      setSearch('')
                      setPage(1)
                    }}
                    className="absolute right-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground/45 transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                ) : null}
              </div>

              <div className="hidden shrink-0 items-center gap-2 px-1 text-[10px] font-semibold tracking-[0.1em] text-muted-foreground/55 uppercase xl:flex">
                <Filter
                  className="size-3.5"
                  strokeWidth={1.8}
                />

                Filters
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:flex xl:shrink-0">
                <Select
                  value={roleFilter}
                  onValueChange={(value) => {
                    setRoleFilter(value)
                    setPage(1)
                  }}
                >
                  <SelectTrigger
                    aria-label="Filter by role"
                    className="h-11 w-full rounded-xl border-border/70 bg-background px-3.5 shadow-none sm:min-w-[190px] xl:w-[210px]"
                  >
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value={ALL}>
                      All roles
                    </SelectItem>

                    {ASSIGNABLE_ROLES.map((value) => (
                      <SelectItem
                        key={value}
                        value={value}
                      >
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
                  <SelectTrigger
                    aria-label="Filter by status"
                    className="h-11 w-full rounded-xl border-border/70 bg-background px-3.5 shadow-none sm:min-w-[160px] xl:w-[175px]"
                  >
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value={ALL}>
                      All statuses
                    </SelectItem>

                    <SelectItem value="true">
                      Active
                    </SelectItem>

                    <SelectItem value="false">
                      Inactive
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {hasActiveFilters ? (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3.5">
                <span className="mr-1 text-[9px] font-semibold tracking-[0.1em] text-muted-foreground/50 uppercase">
                  Active filters
                </span>

                {search ? (
                  <span className="inline-flex max-w-[240px] items-center gap-1.5 rounded-lg border border-border/70 bg-muted/25 px-2.5 py-1.5 text-[11px]">
                    <span className="font-medium text-foreground">
                      Search
                    </span>

                    <span className="truncate text-muted-foreground">
                      {search}
                    </span>
                  </span>
                ) : null}

                {roleFilter !== ALL ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-muted/25 px-2.5 py-1.5 text-[11px]">
                    <span className="font-medium text-foreground">
                      Role
                    </span>

                    <span className="text-muted-foreground">
                      {ROLE_LABELS[roleFilter as Role]}
                    </span>
                  </span>
                ) : null}

                {statusFilter !== ALL ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-muted/25 px-2.5 py-1.5 text-[11px]">
                    <span className="font-medium text-foreground">
                      Status
                    </span>

                    <span className="text-muted-foreground">
                      {statusFilter === 'true'
                        ? 'Active'
                        : 'Inactive'}
                    </span>
                  </span>
                ) : null}

                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="ml-auto text-muted-foreground"
                  onClick={clearFilters}
                >
                  <X className="size-3" />

                  Clear all
                </Button>
              </div>
            ) : null}
          </div>

          {isError ? (
            <div className="rounded-[22px] border border-border/70 bg-card px-6 py-12">
              <ErrorState
                description="Dashboard users could not be loaded."
                onRetry={() => refetch()}
              />
            </div>
          ) : isLoading ? (
            <div className={CARD_GRID_CLASSES}>
              {Array.from({
                length: SKELETON_COUNT,
              }).map((_, index) => (
                <UserCardSkeleton key={index} />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="rounded-[22px] border border-border/70 bg-card px-6 py-12">
              <EmptyState
                icon={UsersIcon}
                title="No users found"
                description="Try adjusting your filters, or invite a new dashboard user."
              />
            </div>
          ) : (
            <div className={CARD_GRID_CLASSES}>
              {users.map((user) => (
                <UserCard
                  key={user._id}
                  user={user}
                  isSelf={
                    user._id === currentUserId
                  }
                  onChangeRole={() =>
                    setRoleTarget(user)
                  }
                  onToggleStatus={() =>
                    setStatusTarget(user)
                  }
                  onDelete={() =>
                    setDeleteTarget(user)
                  }
                />
              ))}
            </div>
          )}

          {data ? (
            <div className="mt-5">
              <Pagination
                page={
                  data.pagination.currentPage
                }
                totalPages={
                  data.pagination.totalPages
                }
                hasNextPage={
                  data.pagination.currentPage <
                  data.pagination.totalPages
                }
                hasPreviousPage={
                  data.pagination.currentPage >
                  1
                }
                onPageChange={setPage}
                limit={limit}
                limitOptions={[
                  10,
                  20,
                  50,
                  100,
                ]}
                onLimitChange={(value) => {
                  setLimit(value)
                  setPage(1)
                }}
              />
            </div>
          ) : null}
        </section>

        <InviteUserDialog
          open={inviteOpen}
          onOpenChange={setInviteOpen}
        />

        <ChangeRoleDialog
          user={roleTarget}
          onOpenChange={(open) => {
            if (!open) {
              setRoleTarget(null)
            }
          }}
        />

        <ConfirmDialog
          open={Boolean(statusTarget)}
          onOpenChange={(open) => {
            if (!open) {
              setStatusTarget(null)
            }
          }}
          title={
            statusTarget?.isActive
              ? 'Deactivate user'
              : 'Activate user'
          }
          description={`Are you sure you want to ${
            statusTarget?.isActive
              ? 'deactivate'
              : 'activate'
          } "${statusTarget?.fullName}"?`}
          variant={
            statusTarget?.isActive
              ? 'destructive'
              : 'default'
          }
          confirmLabel={
            statusTarget?.isActive
              ? 'Deactivate'
              : 'Activate'
          }
          onConfirm={handleStatusToggle}
          isLoading={
            statusMutation.isPending
          }
        />

        <ConfirmDialog
          open={Boolean(deleteTarget)}
          onOpenChange={(open) => {
            if (!open) {
              setDeleteTarget(null)
            }
          }}
          title="Delete user"
          description={`Are you sure you want to delete "${deleteTarget?.fullName}"? This cannot be undone.`}
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