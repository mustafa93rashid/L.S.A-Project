import { ChevronLeft, ChevronRight, Rows3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface PaginationProps {
  page: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  onPageChange: (page: number) => void
  limit?: number
  limitOptions?: number[]
  onLimitChange?: (limit: number) => void
}

export function Pagination({ page, totalPages, hasNextPage, hasPreviousPage, onPageChange, limit, limitOptions, onLimitChange }: PaginationProps) {
  const safeTotalPages = Math.max(totalPages, 1)
  const canChangeLimit = Boolean(limit && limitOptions?.length && onLimitChange)

  return (
    <div className="flex flex-col gap-3 rounded-[18px] border border-border/70 bg-card px-3.5 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.025)] sm:flex-row sm:items-center sm:justify-between sm:px-4">

      <div className="flex min-h-9 items-center">
        {canChangeLimit ? (
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/30 text-muted-foreground">
              <Rows3 className="size-3.5" strokeWidth={1.8} />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-muted-foreground">
                Rows
              </span>

              <Select value={String(limit)} onValueChange={(value) => onLimitChange?.(Number(value))}>
                <SelectTrigger size="sm" aria-label="Rows per page" className="h-8 min-w-[72px] rounded-lg border-border/70 bg-background px-2.5 shadow-none">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {limitOptions?.map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <span />
        )}
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <span>Page</span>

          <span className="inline-flex min-w-7 items-center justify-center rounded-lg border border-border/70 bg-muted/25 px-2 py-1 font-semibold text-foreground tabular-nums">
            {page}
          </span>

          <span>of</span>

          <span className="font-semibold text-foreground tabular-nums">
            {safeTotalPages}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(page - 1)}
            disabled={!hasPreviousPage}
            aria-label="Previous page"
            className="size-8 rounded-lg border-border/70 shadow-none"
          >
            <ChevronLeft className="size-3.5" strokeWidth={1.8} />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(page + 1)}
            disabled={!hasNextPage}
            aria-label="Next page"
            className="size-8 rounded-lg border-border/70 shadow-none"
          >
            <ChevronRight className="size-3.5" strokeWidth={1.8} />
          </Button>
        </div>
      </div>

    </div>
  )
}