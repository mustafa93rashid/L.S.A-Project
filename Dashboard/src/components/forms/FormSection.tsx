import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
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
  icon?: LucideIcon
  /** Anchor target for SectionNav on long forms (Services/Projects). */
  id?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}


export function FormSection({
  title,
  description,
  icon: Icon,
  id,
  action,
  children,
  className,
}: FormSectionProps) {
  return (
    <Card id={id} className={cn('scroll-mt-20 overflow-hidden rounded-[22px] border-border/70 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.025)]', className)}>
      <CardHeader className="border-b border-border/60 px-5 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-4">

          <div className="flex min-w-0 items-start gap-3">

            {Icon ? (
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/35 text-muted-foreground">
                <Icon className="size-[17px]" strokeWidth={1.8} />
              </div>
            ) : null}


            <div className="min-w-0 flex flex-col gap-1">
              <CardTitle className="text-sm font-semibold tracking-[-0.015em] text-foreground">
                {title}
              </CardTitle>

              {description ? (
                <CardDescription className="text-[11px] leading-5 text-muted-foreground">
                  {description}
                </CardDescription>
              ) : null}
            </div>

          </div>


          {action ? (
            <div className="shrink-0">
              {action}
            </div>
          ) : null}

        </div>
      </CardHeader>


      <CardContent className="flex flex-col gap-4 p-5 sm:p-6">
        {children}
      </CardContent>
    </Card>
  )
}