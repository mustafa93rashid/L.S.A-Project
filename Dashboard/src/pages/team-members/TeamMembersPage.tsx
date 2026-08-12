import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { BriefcaseBusiness, ImageIcon, Pencil, Plus, Trash2, Users } from 'lucide-react'

import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/overlays/ConfirmDialog'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'

import { ApiError } from '@/types/api'
import { cloudinaryThumbnail } from '@/lib/cloudinary'

import { useDeleteTeamMemberMutation, useTeamMembersQuery } from '@/features/team-members/queries'
import type { TeamMember } from '@/features/team-members/types'

function TeamMemberCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[18px] border border-border/70 bg-card">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />

      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>

          <Skeleton className="size-8 rounded-lg" />
        </div>

        <Skeleton className="h-px w-full" />

        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-16 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export default function TeamMembersPage() {
  const { data, isLoading, isError, refetch } = useTeamMembersQuery()
  const deleteMutation = useDeleteTeamMemberMutation()

  const [deletingTeamMember, setDeletingTeamMember] = useState<TeamMember | null>(null)

  const teamMembers = data ?? []

  const handleDelete = () => {
    if (!deletingTeamMember) return

    deleteMutation.mutate(deletingTeamMember._id, {
      onSuccess: () => {
        toast.success('Team member deleted successfully')
        setDeletingTeamMember(null)
      },
      onError: (error) => {
        toast.error(error instanceof ApiError ? error.message : 'Failed to delete team member')
      },
    })
  }

  return (
    <PageContainer>
      <div className="space-y-7">
        <PageHeader
          title="Team Members"
          description="Manage the staff profiles displayed on the public About page."
          action={
            <Button type="button" asChild size="lg">
              <Link to="/team-members/new">
                <Plus className="size-4" strokeWidth={1.8} />
                Add team member
              </Link>
            </Button>
          }
        />

        <section className="w-full">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                People Management
              </span>

              <h2 className="mt-1.5 text-[15px] font-semibold tracking-[-0.015em] text-foreground">
                Team Collection
              </h2>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Manage employee profiles, roles and public visibility across the company website.
              </p>
            </div>

            {!isLoading && !isError ? (
              <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-card px-3 py-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-muted/40 text-muted-foreground">
                  <Users className="size-3.5" strokeWidth={1.8} />
                </div>

                <div>
                  <p className="text-[9px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                    Members
                  </p>

                  <p className="mt-0.5 text-sm font-semibold text-foreground tabular-nums">
                    {teamMembers.length}
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          {isLoading ? (
            <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <TeamMemberCardSkeleton key={index} />
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-[22px] border border-border/70 bg-card px-6 py-12">
              <ErrorState description="Team members could not be loaded." onRetry={() => refetch()} />
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="rounded-[22px] border border-border/70 bg-card px-6 py-12">
              <EmptyState icon={Users} title="No team members yet" description="Add a team member to display them on the public website." />
            </div>
          ) : (
            <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {teamMembers.map((member) => (
                <article
                  key={member._id}
                  className="group relative overflow-hidden rounded-[18px] border border-border/70 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.025)] transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/10 hover:shadow-[0_10px_26px_rgba(0,0,0,0.05)]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted/30">
                    {member.image?.url ? (
                      <img
                        src={cloudinaryThumbnail(member.image.url, 720)}
                        alt={member.fullName}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground/35">
                        <ImageIcon className="size-7" strokeWidth={1.5} />
                      </div>
                    )}

                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

                    <div className="absolute left-3 top-3">
                      <Badge variant={member.isActive ? 'success' : 'secondary'} className="border-white/10 shadow-sm backdrop-blur-md">
                        {member.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <div className="absolute right-2.5 top-2.5 flex items-center gap-0.5 rounded-lg border border-white/15 bg-black/20 p-0.5 opacity-0 backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100">
                      <Button type="button" variant="ghost" size="icon-sm" aria-label={`Edit ${member.fullName}`} className="size-7 text-white/80 hover:bg-white/15 hover:text-white" asChild>
                        <Link to={`/team-members/${member._id}/edit`}>
                          <Pencil className="size-3.5" strokeWidth={1.8} />
                        </Link>
                      </Button>

                      <Button type="button" variant="ghost" size="icon-sm" aria-label={`Delete ${member.fullName}`} className="size-7 text-white/75 hover:bg-destructive/30 hover:text-white" onClick={() => setDeletingTeamMember(member)}>
                        <Trash2 className="size-3.5" strokeWidth={1.8} />
                      </Button>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 px-3.5 pb-3">
                      <p className="truncate text-sm font-semibold tracking-[-0.015em] text-white">
                        {member.fullName}
                      </p>

                      <p className="mt-0.5 truncate text-[10px] font-medium text-white/70">
                        {member.position}
                      </p>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <BriefcaseBusiness className="size-3" strokeWidth={1.8} />

                          <span className="truncate text-[9px] font-semibold tracking-[0.06em] uppercase">
                            {member.position}
                          </span>
                        </div>

                        <h3 className="mt-1.5 truncate text-sm font-semibold tracking-[-0.015em] text-foreground">
                          {member.fullName}
                        </h3>
                      </div>

                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted/30 text-muted-foreground">
                        <Users className="size-3.5" strokeWidth={1.8} />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3 border-t border-border/60 pt-3">
                      <div>
                        <p className="text-[8px] font-semibold tracking-[0.08em] text-muted-foreground/60 uppercase">
                          Experience
                        </p>

                        <p className="mt-1 text-[10px] font-medium text-foreground">
                          {member.experience || '—'}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[8px] font-semibold tracking-[0.08em] text-muted-foreground/60 uppercase">
                          Order
                        </p>

                        <p className="mt-1 text-[10px] font-semibold text-foreground tabular-nums">
                          {member.displayOrder}
                        </p>
                      </div>
                    </div>
                  </div>

                  <span aria-hidden="true" className="absolute bottom-0 left-4 h-[2px] w-6 rounded-full bg-foreground/15 transition-all duration-300 group-hover:w-10 group-hover:bg-foreground/30" />
                </article>
              ))}
            </div>
          )}
        </section>

        <ConfirmDialog
          open={Boolean(deletingTeamMember)}
          onOpenChange={(open) => {
            if (!open) setDeletingTeamMember(null)
          }}
          title="Delete team member"
          description={`Are you sure you want to delete "${deletingTeamMember?.fullName}"? This cannot be undone.`}
          variant="destructive"
          confirmLabel="Delete"
          onConfirm={handleDelete}
          isLoading={deleteMutation.isPending}
        />
      </div>
    </PageContainer>
  )
}