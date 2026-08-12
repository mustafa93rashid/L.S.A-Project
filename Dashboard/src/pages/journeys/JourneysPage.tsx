import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { CalendarDays, ImageIcon, Milestone, Pencil, Plus, Route, Trash2 } from 'lucide-react'
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
import { useDeleteJourneyMutation, useJourneysQuery } from '@/features/journeys/queries'
import type { Journey } from '@/features/journeys/types'
import { SectionHeader } from '@/components/layout/SectionHeader'

export default function JourneysPage() {
  const { data, isLoading, isError, refetch } = useJourneysQuery()
  const deleteMutation = useDeleteJourneyMutation()
  const [deletingJourney, setDeletingJourney] = useState<Journey | null>(null)

  const journeys = data ?? []


  const handleDelete = () => {
    if (!deletingJourney) return

    deleteMutation.mutate(deletingJourney._id, {
      onSuccess: () => {
        toast.success('Journey milestone deleted successfully')
        setDeletingJourney(null)
      },
      onError: (error) => {
        toast.error(error instanceof ApiError ? error.message : 'Failed to delete journey milestone')
      },
    })
  }


  return (
    <PageContainer>
      <div className="space-y-7">
        <PageHeader
          title="Company Journey"
          description="Curate the milestones that tell the story of the company's growth and evolution."
          action={
            <Button type="button" asChild size="lg">
              <Link to="/journeys/new">
                <Plus className="size-4" strokeWidth={1.8} />
                Add milestone
              </Link>
            </Button>
          }
        />

        <section>
          <SectionHeader
            eyebrow="Company History"
            title="Timeline Collection"
            description="Manage the key milestones that define the company's history and progression."
            icon={Milestone}
            statLabel="Milestones"
            statValue={journeys.length}
            showStat={!isLoading && !isError}
          />

          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <CollectionCardSkeleton key={index} />
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-[22px] border border-border/70 bg-card px-6 py-12">
              <ErrorState description="Journey milestones could not be loaded." onRetry={() => refetch()} />
            </div>
          ) : journeys.length === 0 ? (
            <div className="rounded-[22px] border border-border/70 bg-card px-6 py-12">
              <EmptyState icon={Milestone} title="No journey milestones yet" description="Add the first milestone to begin building the company timeline." />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {journeys.map((journey, index) => (
                <CollectionCard
                  key={journey._id}
                  image={
                    journey.image?.url ? (
                      <img
                        src={cloudinaryThumbnail(journey.image.url, 720)}
                        alt={journey.title}
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
                    <Badge className="border-white/10 bg-black/25 px-2 py-0.5 text-[10px] text-white backdrop-blur-md hover:bg-black/25">
                      {journey.period}
                    </Badge>
                  }
                  actions={
                    <>
                      <Button type="button" variant="ghost" size="icon-sm" aria-label={`Edit ${journey.title}`} className="size-7 text-white/80 hover:bg-white/15 hover:text-white" asChild>
                        <Link to={`/journeys/${journey._id}/edit`}>
                          <Pencil className="size-3.5" strokeWidth={1.8} />
                        </Link>
                      </Button>

                      <Button type="button" variant="ghost" size="icon-sm" aria-label={`Delete ${journey.title}`} className="size-7 text-white/75 hover:bg-destructive/30 hover:text-white" onClick={() => setDeletingJourney(journey)}>
                        <Trash2 className="size-3.5" strokeWidth={1.8} />
                      </Button>
                    </>
                  }
                  overlayLeft="Milestone"
                  overlayRight={`#${String(index + 1).padStart(2, '0')}`}
                  eyebrow="Journey"
                  icon={Milestone}
                  title={journey.title}
                  description={journey.description}
                  footerLeft={{
                    icon: CalendarDays,
                    label: 'Period',
                    value: journey.period,
                  }}
                  footerRight={{
                    icon: Route,
                    label: 'Position',
                    value: journey.side === 'left' ? 'Left' : 'Right',
                  }}
                  active={false}
                />
              ))}
            </div>
          )}
        </section>


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
      </div>
    </PageContainer>
  )
}