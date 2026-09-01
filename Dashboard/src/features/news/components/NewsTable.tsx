import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { News } from "../types";

type NewsTableProps = {
  news: News[];
  isLoading?: boolean;
  onEdit: (news: News) => void;
  onDelete: (news: News) => void;
};

const getStatusVariant = (
  status: News["status"],
):
  | "default"
  | "secondary"
  | "destructive"
  | "outline" => {
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

export default function NewsTable({
  news,
  isLoading = false,
  onEdit,
  onDelete,
}: NewsTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border">
        <div className="flex min-h-40 items-center justify-center text-sm text-muted-foreground">
          Loading news...
        </div>
      </div>
    );
  }

  if (!news.length) {
    return (
      <div className="rounded-lg border">
        <div className="flex min-h-40 items-center justify-center text-sm text-muted-foreground">
          No news found.
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[90px]">
              Image
            </TableHead>

            <TableHead>
              Title
            </TableHead>

            <TableHead>
              Category
            </TableHead>

            <TableHead>
              Status
            </TableHead>

            <TableHead>
              Order
            </TableHead>

            <TableHead>
              Published
            </TableHead>

            <TableHead className="w-[120px] text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {news.map((item) => (
            <TableRow key={item._id}>
              {/* ==================== Image ==================== */}

              <TableCell>
                <div className="h-14 w-20 overflow-hidden rounded-md border bg-muted">
                  {item.image?.url ? (
                    <img
                      src={item.image.url}
                      alt={
                        item.image.alt ||
                        item.title
                      }
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      No image
                    </div>
                  )}
                </div>
              </TableCell>

              {/* ==================== Title ==================== */}

              <TableCell>
                <div className="max-w-[360px]">
                  <p className="font-medium">
                    {item.title}
                  </p>

                  {item.shortDescription && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {item.shortDescription}
                    </p>
                  )}
                </div>
              </TableCell>

              {/* ==================== Category ==================== */}

              <TableCell>
                <span className="capitalize">
                  {item.category}
                </span>
              </TableCell>

              {/* ==================== Status ==================== */}

              <TableCell>
                <Badge
                  variant={getStatusVariant(
                    item.status
                  )}
                  className="capitalize"
                >
                  {item.status}
                </Badge>
              </TableCell>

              {/* ==================== Order ==================== */}

              <TableCell>
                {item.displayOrder ?? 0}
              </TableCell>

              {/* ==================== Published Date ==================== */}

              <TableCell>
                {formatDate(
                  item.publishedAt
                )}
              </TableCell>

              {/* ==================== Actions ==================== */}

              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      onEdit(item)
                    }
                    aria-label={`Edit ${item.title}`}
                  >
                    <Pencil className="size-4" />
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      onDelete(item)
                    }
                    aria-label={`Delete ${item.title}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}