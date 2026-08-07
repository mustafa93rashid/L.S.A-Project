import { Skeleton } from '@/components/ui/skeleton'
import { TableBody, TableCell, TableRow } from '@/components/ui/table'

interface TableSkeletonProps {
  columnCount: number
  rowCount?: number
}

/** DataTable's loading state — renders placeholder rows matching the real
 * column count, inside the caller's own <Table>/<TableHeader> so the
 * header stays visible while data loads. */
export function TableSkeleton({ columnCount, rowCount = 5 }: TableSkeletonProps) {
  return (
    <TableBody>
      {Array.from({ length: rowCount }).map((_, rowIndex) => (
        <TableRow key={rowIndex}>
          {Array.from({ length: columnCount }).map((_, columnIndex) => (
            <TableCell key={columnIndex}>
              <Skeleton className="h-4 w-full max-w-32" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  )
}
