import type { ReactNode } from 'react'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

import { cn } from '@/lib/utils'

interface DrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

/**
 * Semantic wrapper around Sheet for viewing or editing a record
 * without leaving the current list.
 *
 * The drawer uses a comfortable default desktop width and can be
 * customized per feature through `className`.
 */
export function Drawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: DrawerProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        className={cn(
          'flex w-full flex-col gap-0 p-0',
          'sm:max-w-[760px]',
          className,
        )}
      >
        <SheetHeader className="shrink-0 border-b border-border/70 px-6 py-5">
          <SheetTitle className="text-lg font-semibold tracking-tight">
            {title}
          </SheetTitle>

          {description ? (
            <SheetDescription className="mt-1 text-sm leading-5">
              {description}
            </SheetDescription>
          ) : null}
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6">
          {children}
        </div>

        {footer ? (
          <SheetFooter className="shrink-0 border-t border-border/70 px-6 py-4">
            {footer}
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}