import { useState, type ReactNode } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown, type LucideIcon } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { TableSkeleton } from '@/components/data-table/TableSkeleton'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { cn } from '@/lib/utils'

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> {
    /** Omit this column from the <md mobile card view (e.g. a redundant
     * internal id column) — most columns don't need this. */
    hideOnMobile?: boolean
  }
}

interface DataTableEmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  getRowId?: (row: TData) => string
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
  /** Required, not optional — every list gets real empty-state copy
   * instead of a generic fallback (see the project's coding standards). */
  emptyState: DataTableEmptyStateProps
  onRowClick?: (row: TData) => void
}

/**
 * Headless TanStack Table + shadcn Table, with a genuine mobile card
 * fallback (not just horizontal scroll) built generically from the same
 * column defs — no feature-module knowledge lives here.
 *
 * Sorting is client-side, current-page-only: no backend endpoint supports
 * server-side sort (verified in the backend analysis), so this is
 * deliberately scoped to "sort what's already loaded," not a promise of
 * sorting the full dataset. Pagination is a separate, composed component
 * (see Pagination.tsx) — this component has no opinion on paging.
 */
export function DataTable<TData>({
  columns,
  data,
  getRowId,
  isLoading = false,
  isError = false,
  onRetry,
  emptyState,
  onRowClick,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId,
  })

  if (isError) {
    return <ErrorState onRetry={onRetry} />
  }

  if (!isLoading && data.length === 0) {
    return <EmptyState {...emptyState} />
  }

  const columnCount = columns.length
  const flatHeaders = table.getFlatHeaders()

  return (
    <>
      {/* Desktop / tablet */}
      <div className="hidden overflow-hidden rounded-xl border border-border bg-card shadow-xs md:block">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const sortState = header.column.getIsSorted()

                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="flex items-center gap-1.5 rounded-sm text-left transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/20"
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {sortState === 'asc' ? (
                            <ArrowUp className="size-3.5" />
                          ) : sortState === 'desc' ? (
                            <ArrowDown className="size-3.5" />
                          ) : (
                            <ArrowUpDown className="size-3.5 text-muted-foreground/50" />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          {isLoading ? (
            <TableSkeleton columnCount={columnCount} />
          ) : (
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  className={cn(onRowClick && 'cursor-pointer')}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          )}
        </Table>
      </div>

      {/* Mobile: stacked cards generated from the same column defs */}
      <div className="flex flex-col gap-3 md:hidden">
        {isLoading
          ? Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-xl border border-border bg-card p-4 shadow-xs"
              >
                <div className="flex flex-col gap-2">
                  {Array.from({ length: Math.min(columnCount, 4) }).map((_, rowIndex) => (
                    <Skeleton key={rowIndex} className="h-4 w-full" />
                  ))}
                </div>
              </div>
            ))
          : table.getRowModel().rows.map((row) => (
              <div
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                className={cn(
                  'rounded-xl border border-border bg-card p-4 shadow-xs transition-shadow',
                  onRowClick &&
                    'cursor-pointer hover:border-primary/30 hover:shadow-card',
                )}
              >
                {row
                  .getVisibleCells()
                  .filter((cell) => !cell.column.columnDef.meta?.hideOnMobile)
                  .map((cell) => {
                    const header = flatHeaders.find(
                      (candidate) => candidate.column.id === cell.column.id,
                    )
                    return (
                      <div
                        key={cell.id}
                        className="flex items-center justify-between gap-4 border-b border-border py-1.5 text-sm last:border-0"
                      >
                        <span className="text-muted-foreground">
                          {header
                            ? flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )
                            : cell.column.id}
                        </span>
                        <span className="font-medium text-foreground">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </span>
                      </div>
                    )
                  })}
              </div>
            ))}
      </div>
    </>
  )
}
