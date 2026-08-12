import * as React from 'react'
import { Select as SelectPrimitive } from 'radix-ui'
import {
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

import { cn } from '@/lib/utils'

/* ============================================================
   Root
============================================================ */

function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return (
    <SelectPrimitive.Root
      data-slot="select"
      {...props}
    />
  )
}

/* ============================================================
   Group
============================================================ */

function SelectGroup({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn(
        'scroll-my-1 p-1',
        className,
      )}
      {...props}
    />
  )
}

/* ============================================================
   Value
============================================================ */

function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      {...props}
    />
  )
}

/* ============================================================
   Trigger
============================================================ */

function SelectTrigger({
  className,
  size = 'default',
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: 'sm' | 'default'
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        `
          group/select

          relative

          flex
          w-full
          min-w-0
          items-center
          justify-between
          gap-3

          rounded-xl

          border
          border-border/70

          bg-background

          text-left
          text-[13px]
          font-medium
          tracking-[-0.01em]
          text-foreground

          outline-none
          select-none

          shadow-[0_1px_2px_rgba(0,0,0,0.03)]

          transition-all
          duration-200
          ease-out

          hover:border-border
          hover:bg-muted/20

          focus-visible:border-primary/50
          focus-visible:ring-[3px]
          focus-visible:ring-primary/10

          data-[state=open]:border-primary/40
          data-[state=open]:bg-background
          data-[state=open]:ring-[3px]
          data-[state=open]:ring-primary/[0.07]

          disabled:pointer-events-none
          disabled:cursor-not-allowed
          disabled:bg-muted/30
          disabled:text-muted-foreground
          disabled:opacity-60

          aria-invalid:border-destructive/60
          aria-invalid:ring-[3px]
          aria-invalid:ring-destructive/10

          data-placeholder:text-muted-foreground/60

          data-[size=default]:h-11
          data-[size=default]:px-3.5

          data-[size=sm]:h-9
          data-[size=sm]:px-3
          data-[size=sm]:text-xs

          *:data-[slot=select-value]:min-w-0
          *:data-[slot=select-value]:flex-1
          *:data-[slot=select-value]:truncate

          [&_svg]:pointer-events-none
          [&_svg]:shrink-0
        `,
        className,
      )}
      {...props}
    >
      <div className="min-w-0 flex-1">
        {children}
      </div>

      <SelectPrimitive.Icon asChild>
        <ChevronDown
          className="
            size-4
            shrink-0

            text-muted-foreground/70

            transition-all
            duration-200
            ease-out

            group-hover/select:text-foreground/80

            group-data-[state=open]/select:rotate-180
            group-data-[state=open]/select:text-primary
          "
          strokeWidth={1.8}
        />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

/* ============================================================
   Content
============================================================ */

function SelectContent({
  className,
  children,
  position = 'popper',
  align = 'start',
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        position={position}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          `
            relative
            z-50

            max-h-[min(360px,var(--radix-select-content-available-height))]
            min-w-[180px]

            overflow-hidden

            rounded-xl

            border
            border-border/70

            bg-popover
            text-popover-foreground

            shadow-[
              0_14px_40px_rgba(0,0,0,0.10),
              0_3px_8px_rgba(0,0,0,0.04)
            ]

            outline-none

            data-[state=open]:animate-in
            data-[state=open]:fade-in-0
            data-[state=open]:zoom-in-[0.98]

            data-[state=closed]:animate-out
            data-[state=closed]:fade-out-0
            data-[state=closed]:zoom-out-[0.98]

            data-[side=bottom]:slide-in-from-top-1
            data-[side=top]:slide-in-from-bottom-1
            data-[side=left]:slide-in-from-right-1
            data-[side=right]:slide-in-from-left-1
          `,
          position === 'popper' &&
            `
              w-[var(--radix-select-trigger-width)]
              min-w-[var(--radix-select-trigger-width)]
            `,
          className,
        )}
        {...props}
      >
        <SelectScrollUpButton />

        <SelectPrimitive.Viewport
          className="p-1"
        >
          {children}
        </SelectPrimitive.Viewport>

        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

/* ============================================================
   Label
============================================================ */

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn(
        `
          px-2.5
          pb-1.5
          pt-2.5

          text-[10px]
          font-semibold
          tracking-[0.08em]

          text-muted-foreground/60
          uppercase
        `,
        className,
      )}
      {...props}
    />
  )
}

/* ============================================================
   Item
============================================================ */

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        `
          group/item

          relative

          flex
          min-h-9
          w-full
          cursor-default
          items-center
          gap-2.5

          overflow-hidden

          rounded-lg

          py-2
          pl-3
          pr-9

          text-[12.5px]
          font-medium
          tracking-[-0.006em]

          text-popover-foreground

          outline-none
          select-none

          transition-all
          duration-150
          ease-out

          focus:bg-muted/60
          focus:text-foreground

          data-[highlighted]:bg-muted/60
          data-[highlighted]:text-foreground

          data-[state=checked]:bg-primary/[0.08]
          data-[state=checked]:font-semibold
          data-[state=checked]:text-primary

          data-disabled:pointer-events-none
          data-disabled:text-muted-foreground
          data-disabled:opacity-40

          [&_svg]:pointer-events-none
          [&_svg]:shrink-0
        `,
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>
        {children}
      </SelectPrimitive.ItemText>

      <span
        className="
          pointer-events-none

          absolute
          right-2

          flex
          size-5
          items-center
          justify-center

          rounded-md

          text-primary

          opacity-0
          scale-90

          transition-all
          duration-150
          ease-out

          group-data-[state=checked]/item:scale-100
          group-data-[state=checked]/item:opacity-100
        "
      >
        <SelectPrimitive.ItemIndicator>
          <Check
            className="size-3.5"
            strokeWidth={2.4}
          />
        </SelectPrimitive.ItemIndicator>
      </span>
    </SelectPrimitive.Item>
  )
}

/* ============================================================
   Separator
============================================================ */

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn(
        `
          pointer-events-none

          mx-2
          my-1

          h-px

          bg-border/60
        `,
        className,
      )}
      {...props}
    />
  )
}

/* ============================================================
   Scroll Up
============================================================ */

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        `
          sticky
          top-0
          z-20

          flex
          h-8
          cursor-default
          items-center
          justify-center

          border-b
          border-border/40

          bg-popover

          text-muted-foreground

          transition-colors
          duration-150

          hover:text-foreground
        `,
        className,
      )}
      {...props}
    >
      <ChevronUp
        className="size-3.5"
        strokeWidth={1.8}
      />
    </SelectPrimitive.ScrollUpButton>
  )
}

/* ============================================================
   Scroll Down
============================================================ */

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        `
          sticky
          bottom-0
          z-20

          flex
          h-8
          cursor-default
          items-center
          justify-center

          border-t
          border-border/40

          bg-popover

          text-muted-foreground

          transition-colors
          duration-150

          hover:text-foreground
        `,
        className,
      )}
      {...props}
    >
      <ChevronDown
        className="size-3.5"
        strokeWidth={1.8}
      />
    </SelectPrimitive.ScrollDownButton>
  )
}

/* ============================================================
   Exports
============================================================ */

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}