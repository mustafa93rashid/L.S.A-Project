import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ExternalLink, Handshake, ImageIcon, Pencil, Plus, Trash2 } from 'lucide-react'

import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/overlays/ConfirmDialog'

import { ApiError } from '@/types/api'
import { cloudinaryThumbnail } from '@/lib/cloudinary'

import { useDeletePartnerMutation, usePartnersQuery } from '@/features/partners/queries'
import type { Partner } from '@/features/partners/types'

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
    <PageContainer className="max-w-6xl">
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
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <span className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                Partner Management
              </span>

              <h2 className="mt-1.5 text-[15px] font-semibold tracking-[-0.015em] text-foreground">
                Company Partners
              </h2>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Manage partner logos and their website links displayed on the public site.
              </p>
            </div>

            {!isLoading && !isError ? (
              <span className="hidden text-[11px] font-medium text-muted-foreground/60 tabular-nums sm:block">
                {partners.length} {partners.length === 1 ? 'partner' : 'partners'}
              </span>
            ) : null}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="overflow-hidden rounded-[18px] border border-border/70 bg-card">
                  <div className="aspect-[16/7] animate-pulse bg-muted/40" />

                  <div className="space-y-2 px-4 py-3">
                    <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                    <div className="h-2.5 w-32 animate-pulse rounded bg-muted/70" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="flex min-h-52 flex-col items-center justify-center rounded-[22px] border border-border/70 bg-card px-6 text-center">
              <Handshake className="mb-3 size-7 text-muted-foreground/40" strokeWidth={1.5} />

              <p className="text-sm font-semibold text-foreground">
                Partners could not be loaded
              </p>

              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                Something went wrong while loading the partner information.
              </p>

              <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
                Try again
              </Button>
            </div>
          ) : partners.length === 0 ? (
            <div className="flex min-h-52 flex-col items-center justify-center rounded-[22px] border border-dashed border-border bg-card px-6 text-center">
              <div className="mb-3 flex size-10 items-center justify-center rounded-xl border border-border/70 bg-muted/30">
                <Handshake className="size-4 text-muted-foreground" strokeWidth={1.7} />
              </div>

              <p className="text-sm font-semibold text-foreground">
                No partners yet
              </p>

              <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
                Add your first partner to display their logo on the public website.
              </p>

              <Button type="button" size="sm" className="mt-4" asChild>
                <Link to="/partners/new">
                  <Plus className="size-3.5" />
                  Add partner
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {partners.map((partner) => (
                <article
                  key={partner._id}
                  className="group overflow-hidden rounded-[18px] border border-border/70 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.025)] transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/10 hover:shadow-[0_8px_24px_rgba(0,0,0,0.045)]"
                >
<div className="relative aspect-[16/7] w-full overflow-hidden bg-muted/20">
  {partner.logo?.url ? (
    <img
      src={cloudinaryThumbnail(partner.logo.url, 640)}
      alt="Partner logo"
      loading="lazy"
      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center text-muted-foreground/35">
      <ImageIcon className="size-7" strokeWidth={1.5} />
    </div>
  )}

                      <div className="absolute right-2.5 top-2.5 flex items-center gap-0.5 rounded-lg border border-white/15 bg-black/20 p-0.5 opacity-0 backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100">
    <Button type="button" variant="ghost" size="icon-sm" aria-label="Edit partner" className="size-7 text-muted-foreground hover:bg-muted hover:text-foreground" asChild>
      <Link to={`/partners/${partner._id}/edit`}>
        <Pencil className="size-3.5" strokeWidth={1.8} />
      </Link>
    </Button>

    <Button type="button" variant="ghost" size="icon-sm" aria-label="Delete partner" className="size-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeletingPartner(partner)}>
      <Trash2 className="size-3.5" strokeWidth={1.8} />
    </Button>
  </div>
</div>

                  <div className="flex min-h-[52px] items-center justify-between gap-3 border-t border-border/50 px-3.5 py-2.5">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold tracking-[0.1em] text-muted-foreground/60 uppercase">
                        Partner
                      </p>

                      {partner.website ? (
                        <a
                          href={partner.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-0.5 block max-w-[180px] truncate text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {partner.website}
                        </a>
                      ) : (
                        <p className="mt-0.5 text-[11px] text-muted-foreground/50">
                          No website
                        </p>
                      )}
                    </div>

                    {partner.website ? (
                      <a
                        href={partner.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Visit partner website"
                        className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <ExternalLink className="size-3.5" strokeWidth={1.8} />
                      </a>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <ConfirmDialog
          open={Boolean(deletingPartner)}
          onOpenChange={(open) => {
            if (!open) setDeletingPartner(null)
          }}
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