import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface CollectionCardMeta {
  label: string
  value: ReactNode
  icon?: LucideIcon
  valueClassName?: string
}

interface CollectionCardProps {
  image?: ReactNode
  badges?: ReactNode
  actions?: ReactNode

  overlayLeft?: ReactNode
  overlayRight?: ReactNode

  eyebrow: string
  title: ReactNode
  icon: LucideIcon

  description?: ReactNode

  footerLeft?: CollectionCardMeta
  footerRight?: CollectionCardMeta

  active?: boolean

  className?: string
}

export function CollectionCard({
  image,
  badges,
  actions,

  overlayLeft,
  overlayRight,

  eyebrow,
  title,
  icon: Icon,

  description,

  footerLeft,
  footerRight,

  active = true,

  className,
}: CollectionCardProps) {
  const hasFooter = footerLeft || footerRight

  return (
    <article
      className={cn(
        `
          group
          relative
          overflow-hidden
          rounded-[18px]
          border
          border-border/70
          bg-card
          shadow-[0_1px_3px_rgba(0,0,0,0.025)]
          transition-all
          duration-300

          hover:-translate-y-0.5
          hover:border-foreground/10
          hover:shadow-[0_10px_26px_rgba(0,0,0,0.05)]
        `,
        className,
      )}
    >
      <div className="relative aspect-[16/7] overflow-hidden bg-muted/30">
        {image}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

        {badges ? (
          <div className="absolute left-3 top-3 flex items-center gap-1.5">
            {badges}
          </div>
        ) : null}

        {actions ? (
          <div
            className="
              absolute
              right-2.5
              top-2.5

              flex
              items-center
              gap-0.5

              rounded-lg
              border
              border-white/15

              bg-black/20
              p-0.5

              opacity-0
              backdrop-blur-md

              transition-opacity
              duration-200

              group-hover:opacity-100
            "
          >
            {actions}
          </div>
        ) : null}

        {overlayLeft || overlayRight ? (
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 px-3 pb-2.5">
            <span className="max-w-[75%] truncate text-[8px] font-semibold tracking-[0.08em] text-white/65 uppercase">
              {overlayLeft}
            </span>

            <span className="shrink-0 text-[8px] font-semibold text-white/65 tabular-nums">
              {overlayRight}
            </span>
          </div>
        ) : null}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Icon
                className="size-3"
                strokeWidth={1.8}
                aria-hidden="true"
              />

              <span className="text-[9px] font-semibold tracking-[0.06em] uppercase">
                {eyebrow}
              </span>
            </div>

            <h3 className="mt-1.5 truncate text-sm font-semibold tracking-[-0.015em] text-foreground">
              {title}
            </h3>
          </div>

          <div
            className="
              flex
              size-8
              shrink-0
              items-center
              justify-center

              rounded-lg
              border
              border-border/70

              bg-muted/30
              text-muted-foreground
            "
          >
            <Icon
              className="size-3.5"
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </div>
        </div>

        {description ? (
          <div className="mt-2 line-clamp-2 min-h-[34px] text-[10px] leading-[17px] text-muted-foreground">
            {description}
          </div>
        ) : (
          <div className="mt-2 min-h-[34px]" />
        )}

        {hasFooter ? (
          <div className="mt-3 grid grid-cols-2 divide-x divide-border/60 border-t border-border/60 pt-3">
            <CollectionCardMetaItem
              meta={footerLeft}
              side="left"
            />

            <CollectionCardMetaItem
              meta={footerRight}
              side="right"
            />
          </div>
        ) : null}
      </div>

      <span
        aria-hidden="true"
        className={cn(
          `
            absolute
            bottom-0
            left-4

            h-[2px]
            w-6

            rounded-full

            transition-all
            duration-300

            group-hover:w-10
          `,
          active
            ? 'bg-success/45'
            : 'bg-foreground/20',
        )}
      />
    </article>
  )
}

function CollectionCardMetaItem({
  meta,
  side,
}: {
  meta?: CollectionCardMeta
  side: 'left' | 'right'
}) {
  if (!meta) {
    return <div />
  }

  const MetaIcon = meta.icon

  return (
    <div
      className={cn(
        side === 'left'
          ? 'pr-3'
          : 'pl-3',
      )}
    >
      <div className="flex items-center gap-1.5">
        {MetaIcon ? (
          <MetaIcon
            className="size-3 text-muted-foreground/55"
            strokeWidth={1.8}
            aria-hidden="true"
          />
        ) : null}

        <span className="text-[8px] font-semibold tracking-[0.08em] text-muted-foreground/60 uppercase">
          {meta.label}
        </span>
      </div>

      <div
        className={cn(
          'mt-1 truncate text-[10px] font-semibold text-foreground',
          meta.valueClassName,
        )}
      >
        {meta.value}
      </div>
    </div>
  )
}