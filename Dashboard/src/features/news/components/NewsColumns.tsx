import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { News } from "../types";

type NewsColumnsOptions = {
  onEdit: (news: News) => void;
  onDelete: (news: News) => void;
};

// ==================== Format Date ====================

const formatDate = (value?: string | null) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

// ==================== Status Variant ====================

const getStatusVariant = (
  status: News["status"],
): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "published":
      return "default";

    case "draft":
      return "secondary";

    case "archived":
      return "outline";

    default:
      return "secondary";
  }
};

// ==================== Category Label ====================

const getCategoryLabel = (category: News["category"]) => {
  const labels: Record<News["category"], string> = {
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

  return labels[category] ?? category;
};

// ==================== News Columns ====================

export const getNewsColumns = ({
  onEdit,
  onDelete,
}: NewsColumnsOptions): ColumnDef<News>[] => [
  // ==================== Image ====================

  {
    id: "image",
    header: "Image",

    cell: ({ row }) => {
      const news = row.original;

      return (
        <div className="h-14 w-20 overflow-hidden rounded-md border bg-muted">
          {news.image?.url ? (
            <img
              src={news.image.url}
              alt={news.image.alt || news.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
              No image
            </div>
          )}
        </div>
      );
    },

    enableSorting: false,
  },

  // ==================== Title ====================

  {
    accessorKey: "title",
    header: "Title",

    cell: ({ row }) => {
      const news = row.original;

      return (
        <div className="max-w-[360px]">
          <p className="font-medium text-foreground">
            {news.title}
          </p>

          {news.shortDescription && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {news.shortDescription}
            </p>
          )}
        </div>
      );
    },
  },

  // ==================== Category ====================

  {
    accessorKey: "category",
    header: "Category",

    cell: ({ row }) => {
      const category = row.original.category;

      return (
        <span className="text-sm">
          {getCategoryLabel(category)}
        </span>
      );
    },
  },

  // ==================== Status ====================

  {
    accessorKey: "status",
    header: "Status",

    cell: ({ row }) => {
      const status = row.original.status;

      return (
        <Badge
          variant={getStatusVariant(status)}
          className="capitalize"
        >
          {status}
        </Badge>
      );
    },
  },

  // ==================== Display Order ====================

  {
    accessorKey: "displayOrder",
    header: "Order",

    cell: ({ row }) => {
      return (
        <span className="tabular-nums">
          {row.original.displayOrder ?? 0}
        </span>
      );
    },
  },

  // ==================== Published At ====================

  {
    accessorKey: "publishedAt",
    header: "Published",

    cell: ({ row }) => {
      return (
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {formatDate(row.original.publishedAt)}
        </span>
      );
    },
  },

  // ==================== Actions ====================

  {
    id: "actions",
    header: () => (
      <div className="text-right">
        Actions
      </div>
    ),

    cell: ({ row }) => {
      const news = row.original;

      return (
        <div className="flex justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onEdit(news)}
            aria-label={`Edit ${news.title}`}
            title="Edit"
          >
            <Pencil className="size-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onDelete(news)}
            aria-label={`Delete ${news.title}`}
            title="Delete"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      );
    },

    enableSorting: false,
    enableHiding: false,
  },
];