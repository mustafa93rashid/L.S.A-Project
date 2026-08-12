import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ExternalLink,
  Handshake,
  ImageIcon,
  Link2,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'

import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/overlays/ConfirmDialog'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'

import { ApiError } from '@/types/api'
import { cloudinaryThumbnail } from '@/lib/cloudinary'

import {
  useDeletePartnerMutation,
  usePartnersQuery,
} from '@/features/partners/queries'
import type { Partner } from '@/features/partners/types'

function PartnerCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[18px] border border-border/70 bg-card">
      <Skeleton className="aspect-[16/7] w-full rounded-none" />

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-36" />
          </div>

          <Skeleton className="size-8 rounded-lg" />
        </div>

        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />

        <div className="border-t border-border/60 pt-3">
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
    </div>
  )
}

export default function PartnersPage() {
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = usePartnersQuery()

  const deleteMutation =
    useDeletePartnerMutation()

  const [
    deletingPartner,
    setDeletingPartner,
  ] = useState<Partner | null>(null)

  const partners = data ?? []

  const handleDelete = () => {
    if (!deletingPartner) return

    deleteMutation.mutate(
      deletingPartner._id,
      {
        onSuccess: () => {
          toast.success(
            'Partner deleted successfully',
          )

          setDeletingPartner(null)
        },

        onError: (error) => {
          toast.error(
            error instanceof ApiError
              ? error.message
              : 'Failed to delete partner',
          )
        },
      },
    )
  }

  return (
    <PageContainer>
      <div className="space-y-7">
        <PageHeader
          title="Partners"
          description="Manage the partner logos displayed across the public website."
          action={
            <Button
              type="button"
              asChild
              size="lg"
            >
              <Link to="/partners/new">
                <Plus
                  className="size-4"
                  strokeWidth={1.8}
                />

                Add partner
              </Link>
            </Button>
          }
        />

        <section>
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                Partner Management
              </span>

              <h2 className="mt-1.5 text-[15px] font-semibold tracking-[-0.015em] text-foreground">
                Company Partners
              </h2>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Manage partner logos and
                website links displayed on the
                public website.
              </p>
            </div>

            {!isLoading && !isError ? (
              <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-card px-3 py-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-muted/40 text-muted-foreground">
                  <Handshake
                    className="size-3.5"
                    strokeWidth={1.8}
                  />
                </div>

                <div>
                  <p className="text-[9px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                    Partners
                  </p>

                  <p className="mt-0.5 text-sm font-semibold text-foreground tabular-nums">
                    {partners.length}
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({
                length: 8,
              }).map((_, index) => (
                <PartnerCardSkeleton
                  key={index}
                />
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-[22px] border border-border/70 bg-card px-6 py-12">
              <ErrorState
                description="Partners could not be loaded."
                onRetry={() => refetch()}
              />
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
                <article
                  key={partner._id}
                  className="group relative overflow-hidden rounded-[18px] border border-border/70 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.025)] transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/10 hover:shadow-[0_10px_26px_rgba(0,0,0,0.05)]"
                >
                  <div className="relative aspect-[16/7] overflow-hidden bg-muted/30">
                    {partner.logo?.url ? (
                      <img
                        src={cloudinaryThumbnail(
                          partner.logo.url,
                          720,
                        )}
                        alt="Partner logo"
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground/35">
                        <ImageIcon
                          className="size-7"
                          strokeWidth={1.5}
                        />
                      </div>
                    )}

                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

                    <div className="absolute right-2.5 top-2.5 flex items-center gap-0.5 rounded-lg border border-white/15 bg-black/20 p-0.5 opacity-0 backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Edit partner"
                        className="size-7 text-white/80 hover:bg-white/15 hover:text-white"
                        asChild
                      >
                        <Link
                          to={`/partners/${partner._id}/edit`}
                        >
                          <Pencil
                            className="size-3.5"
                            strokeWidth={1.8}
                          />
                        </Link>
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Delete partner"
                        className="size-7 text-white/75 hover:bg-destructive/30 hover:text-white"
                        onClick={() =>
                          setDeletingPartner(
                            partner,
                          )
                        }
                      >
                        <Trash2
                          className="size-3.5"
                          strokeWidth={1.8}
                        />
                      </Button>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 px-3 pb-2.5">
                      <span className="max-w-[75%] truncate text-[8px] font-semibold tracking-[0.08em] text-white/65 uppercase">
                        Partner
                      </span>

                      <span className="shrink-0 text-[8px] font-semibold text-white/65">
                        Company
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Handshake
                            className="size-3"
                            strokeWidth={1.8}
                          />

                          <span className="text-[9px] font-semibold tracking-[0.06em] uppercase">
                            Partner
                          </span>
                        </div>

                        <h3 className="mt-1.5 truncate text-sm font-semibold tracking-[-0.015em] text-foreground">
                          Company Partner
                        </h3>
                      </div>

                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted/30 text-muted-foreground">
                        <Handshake
                          className="size-3.5"
                          strokeWidth={1.8}
                        />
                      </div>
                    </div>

                    <p className="mt-2 line-clamp-2 min-h-[34px] text-[10px] leading-[17px] text-muted-foreground">
                      {partner.website
                        ? `Official partner website: ${partner.website}`
                        : 'Company partner displayed across the public website.'}
                    </p>

                    <div className="mt-3 grid grid-cols-2 divide-x divide-border/60 border-t border-border/60 pt-3">
                      <div className="pr-3">
                        <div className="flex items-center gap-1.5">
                          <Link2
                            className="size-3 text-muted-foreground/55"
                            strokeWidth={1.8}
                          />

                          <span className="text-[8px] font-semibold tracking-[0.08em] text-muted-foreground/60 uppercase">
                            Website
                          </span>
                        </div>

                        <p className="mt-1 truncate text-[10px] font-semibold text-foreground">
                          {partner.website
                            ? 'Available'
                            : 'Not added'}
                        </p>
                      </div>

                      <div className="pl-3">
                        <div className="flex items-center gap-1.5">
                          <ExternalLink
                            className="size-3 text-muted-foreground/55"
                            strokeWidth={1.8}
                          />

                          <span className="text-[8px] font-semibold tracking-[0.08em] text-muted-foreground/60 uppercase">
                            Link
                          </span>
                        </div>

                        {partner.website ? (
                          <a
                            href={
                              partner.website
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 block truncate text-[10px] font-semibold text-foreground transition-colors hover:text-primary"
                          >
                            Visit website
                          </a>
                        ) : (
                          <p className="mt-1 text-[10px] font-semibold text-muted-foreground">
                            —
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 left-4 h-[2px] w-6 rounded-full bg-foreground/20 transition-all duration-300 group-hover:w-10 group-hover:bg-foreground/35"
                  />
                </article>
              ))}
            </div>
          )}
        </section>

        <ConfirmDialog
          open={Boolean(
            deletingPartner,
          )}
          onOpenChange={(open) => {
            if (!open) {
              setDeletingPartner(null)
            }
          }}
          title="Delete partner"
          description="Are you sure you want to delete this partner? This cannot be undone."
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