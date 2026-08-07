import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface PaginationProps {
  page: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  onPageChange: (page: number) => void
  /** Optional page-size control — most list endpoints support `limit`,
   * but unpaginated modules simply won't pass these props. */
  limit?: number
  limitOptions?: number[]
  onLimitChange?: (limit: number) => void
}

/** Matches the backend's actual pagination contract exactly
 * ({page, totalPages, hasNextPage, hasPreviousPage}) — no page-number
 * jump list, since the API gives no total-count-independent way to
 * request an arbitrary page beyond next/previous... it does via `page`,
 * but a compact prev/next + "Page X of Y" is deliberately the whole UI
 * here; add numbered pages later only if a real module needs it. */
export function Pagination({
  page,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  onPageChange,
  limit,
  limitOptions,
  onLimitChange,
}: PaginationProps) {
  return (
    <div className="flex flex-col-reverse items-center justify-between gap-3 sm:flex-row">
      {limit && limitOptions && onLimitChange ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Rows per page</span>
          <Select
            value={String(limit)}
            onValueChange={(value) => onLimitChange(Number(value))}
          >
            <SelectTrigger size="sm" aria-label="Rows per page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {limitOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <span />
      )}

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground tabular-nums">
          Page {page} of {Math.max(totalPages, 1)}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPreviousPage}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
