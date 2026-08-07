import type { ReactNode } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface FormSectionProps {
  title: string
  description?: string
  /** Anchor target for SectionNav on long forms (Services/Projects). */
  id?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

/** One card per logical section of a Create/Edit page form — replaces the
 * plain SectionHeader-only grouping the old Drawer/Dialog forms used,
 * where the Drawer/Dialog chrome itself provided visual separation. */
export function FormSection({
  title,
  description,
  id,
  action,
  children,
  className,
}: FormSectionProps) {
  return (
    <Card id={id} className={cn('scroll-mt-20', className)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle>{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">{children}</CardContent>
    </Card>
  )
}
