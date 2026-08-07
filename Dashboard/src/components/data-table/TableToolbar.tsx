import type { ReactNode } from 'react'
import { SearchInput } from '@/components/forms/SearchInput'

interface TableToolbarProps {
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  /** Module-specific filter controls (e.g. status/role Selects) — composed
   * by the caller, not by this component. See the Phase 6 plan's note on
   * why "filter controls" aren't a single bespoke component. */
  filters?: ReactNode
  /** Primary action, e.g. a "+ Add" Button. */
  action?: ReactNode
}

/** Layout row above a DataTable: search + filter slot + primary action,
 * wraps responsively. Pure layout — no business logic. */
export function TableToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  filters,
  action,
}: TableToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {onSearchChange ? (
          <SearchInput
            value={searchValue ?? ''}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
          />
        ) : null}
        {filters ? (
          <div className="flex flex-wrap items-center gap-2">{filters}</div>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  )
}
