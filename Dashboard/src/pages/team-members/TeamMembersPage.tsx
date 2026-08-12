import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { BriefcaseBusiness, ImageIcon, Pencil, Plus, Users, UserRoundCheck, Trash2 } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CollectionCard, CollectionCardSkeleton } from '@/components/collection-card'
import { ConfirmDialog } from '@/components/overlays/ConfirmDialog'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ApiError } from '@/types/api'
import { cloudinaryThumbnail } from '@/lib/cloudinary'
import { useDeleteTeamMemberMutation, useTeamMembersQuery } from '@/features/team-members/queries'
import type { TeamMember } from '@/features/team-members/types'
import { SectionHeader } from '@/components/layout/SectionHeader'


export default function TeamMembersPage() {
  const { data, isLoading, isError, refetch } = useTeamMembersQuery()
  const deleteMutation = useDeleteTeamMemberMutation()
  const [deletingTeamMember, setDeletingTeamMember] = useState<TeamMember | null>(null)

  const teamMembers = data ?? []

  const activeCount = teamMembers.filter((member) => member.isActive).length


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
          <SectionHeader
            eyebrow="People Management"
            title="Team Collection"
            description="Manage team profiles, positions, experience and public visibility."
            icon={Users}
            statLabel="Active Members"
            statValue={activeCount}
            showStat={!isLoading && !isError}
          />


          {isLoading ? (
            <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <CollectionCardSkeleton key={index} />
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-[22px] border border-border/70 bg-card px-6 py-12">
              <ErrorState description="Team members could not be loaded." onRetry={() => refetch()} />
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="rounded-[22px] border border-border/70 bg-card px-6 py-12">
              <EmptyState
                icon={Users}
                title="No team members yet"
                description="Add a team member to display them on the public website."
              />
            </div>
          ) : (
            <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {teamMembers.map((member) => (
                <CollectionCard
                  key={member._id}
                  image={
                    member.image?.url ? (
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
                    )
                  }
                  badges={
                    <Badge
                      variant={member.isActive ? 'success' : 'secondary'}
                      className="border-white/10 shadow-sm backdrop-blur-md"
                    >
                      {member.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  }
                  actions={
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Edit ${member.fullName}`}
                        className="size-7 text-white/80 hover:bg-white/15 hover:text-white"
                        asChild
                      >
                        <Link to={`/team-members/${member._id}/edit`}>
                          <Pencil className="size-3.5" strokeWidth={1.8} />
                        </Link>
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Delete ${member.fullName}`}
                        className="size-7 text-white/75 hover:bg-destructive/30 hover:text-white"
                        onClick={() => setDeletingTeamMember(member)}
                      >
                        <Trash2 className="size-3.5" strokeWidth={1.8} />
                      </Button>
                    </>
                  }
                  overlayLeft={member.position}
                  overlayRight={`#${member.displayOrder}`}
                  eyebrow="Team Member"
                  icon={Users}
                  title={member.fullName}
                  description={member.experience ? `${member.position} with ${member.experience} of professional experience.` : member.position}
                  footerLeft={{
                    icon: BriefcaseBusiness,
                    label: 'Position',
                    value: member.position,
                  }}
                  footerRight={{
                    icon: UserRoundCheck,
                    label: 'Experience',
                    value: member.experience || '—',
                  }}
                  active={member.isActive}
                />
              ))}
            </div>
          )}
        </section>


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
      </div>
    </PageContainer>
  )
}