import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ExternalLink, Handshake, ImageIcon, Link2, Pencil, Plus, Trash2 } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { CollectionCard, CollectionCardSkeleton } from '@/components/collection-card'
import { ConfirmDialog } from '@/components/overlays/ConfirmDialog'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ApiError } from '@/types/api'
import { cloudinaryThumbnail } from '@/lib/cloudinary'
import { useDeletePartnerMutation, usePartnersQuery } from '@/features/partners/queries'
import type { Partner } from '@/features/partners/types'
import { SectionHeader } from '@/components/layout/SectionHeader'

export default function PartnersPage() {
  const { data, isLoading, isError, refetch } = usePartnersQuery()
  const deleteMutation = useDeletePartnerMutation()
  const [deletingPartner, setDeletingPartner] = useState<Partner | null>(null)

  const partners = data ?? []


  const handleDelete = () => {
    if (!deletingPartner) return

    deleteMutation.mutate(deletingPartner._id, {
      onSuccess: () => {
        toast.success('Partner deleted successfully')
        setDeletingPartner(null)
      },
      onError: (error) => {
        toast.error(error instanceof ApiError ? error.message : 'Failed to delete partner')
      },
    })
  }


  return (
    <PageContainer>
      <div className="space-y-7">
        <PageHeader
          title="Partners"
          description="Manage the partner logos displayed across the public website."
          action={
            <Button type="button" asChild size="lg">
              <Link to="/partners/new">
                <Plus className="size-4" strokeWidth={1.8} />
                Add partner
              </Link>
            </Button>
          }
        />

        <section>
          <SectionHeader
            eyebrow="Partner Management"
            title="Company Partners"
            description="Manage partner logos and website links displayed on the public website."
            icon={Handshake}
            statLabel="Partners"
            statValue={partners.length}
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
              <ErrorState description="Partners could not be loaded." onRetry={() => refetch()} />
            </div>
          ) : partners.length === 0 ? (
            <div className="rounded-[22px] border border-border/70 bg-card px-6 py-12">
              <EmptyState
                icon={Handshake}
                title="No partners yet"
                description="Add your first partner to display their logo on the public website."
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {partners.map((partner) => (
                <CollectionCard
                  key={partner._id}
                  image={
                    partner.logo?.url ? (
                      <img
                        src={cloudinaryThumbnail(partner.logo.url, 720)}
                        alt="Partner logo"
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground/35">
                        <ImageIcon className="size-7" strokeWidth={1.5} />
                      </div>
                    )
                  }
                  actions={
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Edit partner"
                        className="size-7 text-white/80 hover:bg-white/15 hover:text-white"
                        asChild
                      >
                        <Link to={`/partners/${partner._id}/edit`}>
                          <Pencil className="size-3.5" strokeWidth={1.8} />
                        </Link>
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Delete partner"
                        className="size-7 text-white/75 hover:bg-destructive/30 hover:text-white"
                        onClick={() => setDeletingPartner(partner)}
                      >
                        <Trash2 className="size-3.5" strokeWidth={1.8} />
                      </Button>
                    </>
                  }
                  overlayLeft="Partner"
                  overlayRight="Company"
                  eyebrow="Partner"
                  icon={Handshake}
                  title="Company Partner"
                  description={partner.website ? `Official partner website: ${partner.website}` : 'Company partner displayed across the public website.'}
                  footerLeft={{
                    icon: Link2,
                    label: 'Website',
                    value: partner.website ? 'Available' : 'Not added',
                  }}
                  footerRight={{
                    icon: ExternalLink,
                    label: 'Link',
                    value: partner.website ? (
                      <a
                        href={partner.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-colors hover:text-primary"
                      >
                        Visit website
                      </a>
                    ) : (
                      '—'
                    ),
                  }}
                  active={false}
                />
              ))}
            </div>
          )}
        </section>


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
      </div>
    </PageContainer>
  )
}