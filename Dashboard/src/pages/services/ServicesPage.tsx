import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {CheckCircle2, Eye, ImageIcon, Layers, Pencil, Plus, Sparkles, Trash2} from 'lucide-react'
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
import { useDeleteServiceMutation, useServicesQuery } from '@/features/services/queries'
import type { Service } from '@/features/services/types'
import { SectionHeader } from '@/components/layout/SectionHeader'

export default function ServicesPage() {
  const { data, isLoading, isError, refetch } = useServicesQuery()
  const deleteMutation = useDeleteServiceMutation()
  const [deletingService, setDeletingService] = useState<Service | null>(null)

  const services = data ?? []

  const visibleHomeCount = useMemo(
    () =>
      services.filter((service) => service.homeCapability?.isVisible && service.isActive)
        .length,
    [services],
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
      <div className="space-y-7">
        <PageHeader
          title="Services"
          description="Manage the service pages and capabilities displayed across the public website."
          action={
            <Button type="button" asChild size="lg">
              <Link to="/services/new">
                <Plus className="size-4" strokeWidth={1.8} />
                Add service
              </Link>
            </Button>
          }
        />

        <section>
          <SectionHeader
            eyebrow="Service Management"
            title="Service Collection"
            description="Manage service content, public visibility and Home Capabilities placement."
            icon={Sparkles}
            statLabel="Home Capabilities"
            statValue={`${visibleHomeCount}/6`}
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
              <ErrorState
                description="Services could not be loaded."
                onRetry={() => refetch()}
              />
            </div>
          ) : services.length === 0 ? (
            <div className="rounded-[22px] border border-border/70 bg-card px-6 py-12">
              <EmptyState
                icon={Layers}
                title="No services yet"
                description="Add a service to display it on the public website."
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {services.map((service) => {
                const imageUrl = service.serviceCard?.image?.url ?? null
                const isComplete = Boolean(service.serviceCard && service.heroSection)

                return (
                  <CollectionCard
                    key={service._id}
                    image={
                      imageUrl ? (
                        <img
                          src={cloudinaryThumbnail(imageUrl, 720)}
                          alt={service.serviceCard?.image?.alt || service.title}
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
                      <>
                        <Badge
                          variant={service.isActive ? 'success' : 'secondary'}
                          className="border-white/10 shadow-sm backdrop-blur-md"
                        >
                          {service.isActive ? 'Active' : 'Inactive'}
                        </Badge>

                        {service.homeCapability?.isVisible ? (
                          <Badge
                            variant="info"
                            className="border-white/10 shadow-sm backdrop-blur-md"
                          >
                            Featured
                          </Badge>
                        ) : null}
                      </>
                    }
                    actions={
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Edit ${service.title}`}
                          className="size-7 text-white/80 hover:bg-white/15 hover:text-white"
                          asChild
                        >
                          <Link to={`/services/${service._id}/edit`}>
                            <Pencil className="size-3.5" strokeWidth={1.8} />
                          </Link>
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Delete ${service.title}`}
                          className="size-7 text-white/75 hover:bg-destructive/30 hover:text-white"
                          onClick={() => setDeletingService(service)}
                        >
                          <Trash2 className="size-3.5" strokeWidth={1.8} />
                        </Button>
                      </>
                    }
                    overlayLeft={service.slug}
                    overlayRight={`#${service.displayOrder}`}
                    eyebrow="Service"
                    icon={Layers}
                    title={service.title}
                    description={
                      service.serviceCard?.description ??
                      service.heroSection?.description ??
                      'No service description available.'
                    }
                    footerLeft={{
                      icon: isComplete ? CheckCircle2 : Layers,
                      label: 'Content',
                      value: isComplete ? 'Complete' : 'Incomplete',
                      valueClassName: isComplete ? 'text-foreground' : 'text-destructive',
                    }}
                    footerRight={{
                      icon: Eye,
                      label: 'Home',
                      value: service.homeCapability?.isVisible ? 'Featured' : 'Hidden',
                    }}
                    active={service.isActive}
                  />
                )
              })}
            </div>
          )}
        </section>

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
      </div>
    </PageContainer>
  )
}
