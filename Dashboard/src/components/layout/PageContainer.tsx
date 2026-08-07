import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageContainerProps {
  children: ReactNode
  className?: string
}

/** Consistent max-width + vertical rhythm for a page's content — wraps
 * PageHeader/TableToolbar/DataTable etc. so every page gets the same
 * spacing without repeating layout classes. */
export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn('mx-auto flex w-full max-w-6xl flex-col gap-6', className)}>
      {children}
    </div>
  )
}
