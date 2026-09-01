import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import {
  CalendarDays,
  ImageIcon,
  Newspaper,
  Pencil,
  Plus,
  Tag,
  Trash2,
} from "lucide-react";

import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { SectionHeader } from "@/components/layout/SectionHeader";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  CollectionCard,
  CollectionCardSkeleton,
} from "@/components/collection-card";

import { ConfirmDialog } from "@/components/overlays/ConfirmDialog";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";

import {
  useDeleteNews,
  useNews,
} from "@/features/news/queries";

import type {
  News,
  NewsFilters,
} from "@/features/news/types";

// =========================================================
// CATEGORY LABEL
// =========================================================

const getCategoryLabel = (
  category: News["category"],
) => {
  const labels: Record<
    News["category"],
    string
  > = {
    projects: "Projects",
    company: "Company",
    hse: "HSE",
    events: "Events",
    partnerships: "Partnerships",
    achievements: "Achievements",
    training: "Training",
    equipment: "Equipment",
    other: "Other",
  };

  return (
    labels[category] ??
    category
  );
};

// =========================================================
// STATUS BADGE
// =========================================================

const getStatusBadgeClass = (
  status: News["status"],
) => {
  switch (status) {
    case "published":
      return "border-success/20 bg-success/90 text-white hover:bg-success/90";

    case "archived":
      return "border-white/10 bg-black/35 text-white backdrop-blur-md hover:bg-black/35";

    case "draft":
    default:
      return "border-white/10 bg-black/25 text-white backdrop-blur-md hover:bg-black/25";
  }
};

// =========================================================
// FORMAT DATE
// =========================================================

const formatDate = (
  value?: string | null,
) => {
  if (!value) {
    return "Not published";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Not published";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(date);
};

// =========================================================
// COMPONENT
// =========================================================

export default function NewsPage() {
  // =======================================================
  // FILTERS
  // =======================================================

  const [filters] =
    useState<NewsFilters>({
      page: 1,
      limit: 20,
    });

  // =======================================================
  // DELETE STATE
  // =======================================================

  const [
    deletingNews,
    setDeletingNews,
  ] = useState<News | null>(
    null,
  );

  // =======================================================
  // QUERY
  // =======================================================

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useNews(filters);

  // =======================================================
  // MUTATION
  // =======================================================

  const deleteMutation =
    useDeleteNews();

  // =======================================================
  // DATA
  // =======================================================

  const news =
    data?.data ?? [];

  // =======================================================
  // DELETE
  // =======================================================

  const handleDelete =
    () => {
      if (!deletingNews) {
        return;
      }

      deleteMutation.mutate(
        deletingNews._id,
        {
          onSuccess:
            () => {
              toast.success(
                "News deleted successfully",
              );

              setDeletingNews(
                null,
              );
            },

          onError: (
            error,
          ) => {
            console.error(
              "Delete news error:",
              error,
            );

            toast.error(
              "Failed to delete news",
            );
          },
        },
      );
    };

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <PageContainer>
      <div className="space-y-7">
        {/* ===================================================
            PAGE HEADER
        =================================================== */}

        <PageHeader
          title="Company News"
          description="Manage the latest company news, announcements, events, achievements and updates."
          action={
            <Button
              type="button"
              asChild
              size="lg"
            >
              <Link to="/news/new">
                <Plus
                  className="size-4"
                  strokeWidth={
                    1.8
                  }
                />

                Add news
              </Link>
            </Button>
          }
        />

        {/* ===================================================
            NEWS COLLECTION
        =================================================== */}

        <section>
          <SectionHeader
            eyebrow="Latest Updates"
            title="News Collection"
            description="Manage the news and announcements displayed across the company website."
            icon={Newspaper}
            statLabel="News"
            statValue={
              news.length
            }
            showStat={
              !isLoading &&
              !isError
            }
          />

          {/* =================================================
              LOADING
          ================================================= */}

          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({
                length: 8,
              }).map(
                (_, index) => (
                  <CollectionCardSkeleton
                    key={
                      index
                    }
                  />
                ),
              )}
            </div>
          ) : isError ? (
            /* =================================================
               ERROR
            ================================================= */

            <div className="rounded-[22px] border border-border/70 bg-card px-6 py-12">
              <ErrorState
                description="News could not be loaded."
                onRetry={() =>
                  refetch()
                }
              />
            </div>
          ) : news.length ===
            0 ? (
            /* =================================================
               EMPTY
            ================================================= */

            <div className="rounded-[22px] border border-border/70 bg-card px-6 py-12">
              <EmptyState
                icon={
                  Newspaper
                }
                title="No news yet"
                description="Add the first news item to begin building the company news collection."
              />
            </div>
          ) : (
            /* =================================================
               COLLECTION
            ================================================= */

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {news.map(
                (
                  item,
                  index,
                ) => (
                  <CollectionCard
                    key={
                      item._id
                    }
                    /* =========================================
                       IMAGE
                    ========================================= */

                    image={
                      item.image
                        ?.url ? (
                        <img
                          src={
                            item
                              .image
                              .url
                          }
                          alt={
                            item
                              .image
                              .alt ||
                            item.title
                          }
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground/35">
                          <ImageIcon
                            className="size-7"
                            strokeWidth={
                              1.5
                            }
                          />
                        </div>
                      )
                    }
                    /* =========================================
                       BADGES
                    ========================================= */

                    badges={
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge className="border-white/10 bg-black/25 px-2 py-0.5 text-[10px] text-white backdrop-blur-md hover:bg-black/25">
                          {getCategoryLabel(
                            item.category,
                          )}
                        </Badge>

                        <Badge
                          className={`px-2 py-0.5 text-[10px] capitalize ${getStatusBadgeClass(
                            item.status,
                          )}`}
                        >
                          {
                            item.status
                          }
                        </Badge>
                      </div>
                    }
                    /* =========================================
                       ACTIONS
                    ========================================= */

                    actions={
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Edit ${item.title}`}
                          className="size-7 text-white/80 hover:bg-white/15 hover:text-white"
                          asChild
                        >
                          <Link
                            to={`/news/${item._id}/edit`}
                          >
                            <Pencil
                              className="size-3.5"
                              strokeWidth={
                                1.8
                              }
                            />
                          </Link>
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Delete ${item.title}`}
                          className="size-7 text-white/75 hover:bg-destructive/30 hover:text-white"
                          onClick={() =>
                            setDeletingNews(
                              item,
                            )
                          }
                        >
                          <Trash2
                            className="size-3.5"
                            strokeWidth={
                              1.8
                            }
                          />
                        </Button>
                      </>
                    }
                    /* =========================================
                       OVERLAY
                    ========================================= */

                    overlayLeft="News"
                    overlayRight={`#${String(
                      index +
                        1,
                    ).padStart(
                      2,
                      "0",
                    )}`}
                    /* =========================================
                       CONTENT
                    ========================================= */

                    eyebrow={getCategoryLabel(
                      item.category,
                    )}
                    icon={
                      Newspaper
                    }
                    title={
                      item.title
                    }
                    description={
                      item.shortDescription
                    }
                    /* =========================================
                       FOOTER
                    ========================================= */

                    footerLeft={{
                      icon: CalendarDays,

                      label:
                        "Published",

                      value:
                        formatDate(
                          item.publishedAt,
                        ),
                    }}
                    footerRight={{
                      icon: Tag,

                      label:
                        "Order",

                      value:
                        String(
                          item.displayOrder ??
                            0,
                        ),
                    }}
                    active={
                      item.status ===
                      "published"
                    }
                  />
                ),
              )}
            </div>
          )}
        </section>

        {/* ===================================================
            DELETE CONFIRMATION
        =================================================== */}

        <ConfirmDialog
          open={Boolean(
            deletingNews,
          )}
          onOpenChange={(
            open,
          ) => {
            if (
              !open &&
              !deleteMutation.isPending
            ) {
              setDeletingNews(
                null,
              );
            }
          }}
          title="Delete news"
          description={`Are you sure you want to delete "${deletingNews?.title ?? ""}"? This cannot be undone.`}
          variant="destructive"
          confirmLabel="Delete"
          onConfirm={
            handleDelete
          }
          isLoading={
            deleteMutation.isPending
          }
        />
      </div>
    </PageContainer>
  );
}