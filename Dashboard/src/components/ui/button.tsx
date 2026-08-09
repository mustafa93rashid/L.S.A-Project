import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  `
    group/button
    inline-flex
    shrink-0
    items-center
    justify-center
    whitespace-nowrap
    rounded-xl
    border
    border-transparent
    text-sm
    font-semibold
    tracking-[-0.01em]
    outline-none
    select-none

    transition-[transform,background-color,border-color,color,box-shadow]
    duration-200
    ease-out

    focus-visible:ring-3
    focus-visible:ring-[#315b7c]/15

    disabled:pointer-events-none
    disabled:opacity-50

    aria-invalid:border-destructive
    aria-invalid:ring-3
    aria-invalid:ring-destructive/15

    [&_svg]:pointer-events-none
    [&_svg]:shrink-0
    [&_svg]:transition-transform
    [&_svg]:duration-200

    [&_svg:not([class*='size-'])]:size-4
  `,
  {
    variants: {
      variant: {
        /* =====================================================
            Primary
        ===================================================== */

        default: `
          border-[#315b7c]/15
          bg-[#183b56]
          text-white

          shadow-[0_1px_2px_rgba(15,42,62,0.10),0_3px_8px_rgba(15,42,62,0.08)]

          hover:-translate-y-[1px]
          hover:border-[#315b7c]/20
          hover:bg-[#204b69]
          hover:shadow-[0_3px_10px_rgba(15,42,62,0.12)]

          active:translate-y-0
          active:scale-[0.985]
          active:bg-[#14344d]

          [&_svg]:text-white/85
        `,

        /* =====================================================
            Outline
        ===================================================== */

        outline: `
          border-[#315b7c]/18
          bg-card
          text-[#244b68]

          shadow-[0_1px_2px_rgba(15,42,62,0.025)]

          hover:-translate-y-[1px]
          hover:border-[#315b7c]/28
          hover:bg-[#315b7c]/[0.045]
          hover:text-[#183b56]

          hover:shadow-[0_3px_10px_rgba(15,42,62,0.05)]

          aria-expanded:border-[#315b7c]/28
          aria-expanded:bg-[#315b7c]/[0.05]

          active:translate-y-0
          active:bg-[#315b7c]/[0.07]
        `,

        /* =====================================================
            Secondary
        ===================================================== */

        secondary: `
          border-[#315b7c]/[0.06]
          bg-[#315b7c]/[0.075]
          text-[#244b68]

          shadow-none

          hover:bg-[#315b7c]/[0.11]
          hover:text-[#183b56]

          aria-expanded:bg-[#315b7c]/[0.11]

          active:scale-[0.985]
          active:bg-[#315b7c]/[0.14]
        `,

        /* =====================================================
            Ghost
        ===================================================== */

        ghost: `
          text-muted-foreground

          hover:bg-[#315b7c]/[0.06]
          hover:text-[#244b68]

          aria-expanded:bg-[#315b7c]/[0.07]
          aria-expanded:text-[#244b68]

          active:scale-[0.97]
          active:bg-[#315b7c]/[0.09]
        `,

        /* =====================================================
            Destructive
        ===================================================== */

        destructive: `
          border-red-500/10
          bg-red-500/[0.055]
          text-red-600

          shadow-none

          hover:border-red-500/18
          hover:bg-red-500/[0.09]

          active:scale-[0.985]
          active:bg-red-500/[0.12]

          focus-visible:ring-red-500/15
        `,

        /* =====================================================
            Link
        ===================================================== */

        link: `
          h-auto
          rounded-none
          border-transparent
          bg-transparent
          p-0

          font-medium
          text-[#315b7c]

          shadow-none

          underline-offset-4

          hover:text-[#183b56]
          hover:underline

          active:scale-100
        `,
      },

      size: {
        default: `
          h-9
          gap-2
          px-3.5

          has-data-[icon=inline-end]:pr-3
          has-data-[icon=inline-start]:pl-3
        `,

        xs: `
          h-7
          gap-1.5
          rounded-lg
          px-2.5
          text-xs

          has-data-[icon=inline-end]:pr-2
          has-data-[icon=inline-start]:pl-2

          [&_svg:not([class*='size-'])]:size-3
        `,

        sm: `
          h-8
          gap-1.5
          rounded-[10px]
          px-3
          text-[0.8rem]

          has-data-[icon=inline-end]:pr-2.5
          has-data-[icon=inline-start]:pl-2.5

          [&_svg:not([class*='size-'])]:size-3.5
        `,

        lg: `
          h-11
          gap-2
          rounded-xl
          px-5
          text-[0.9rem]

          has-data-[icon=inline-end]:pr-4
          has-data-[icon=inline-start]:pl-4

          [&_svg:not([class*='size-'])]:size-[17px]
        `,

        icon: `
          size-9
          rounded-xl
          p-0
        `,

        'icon-xs': `
          size-7
          rounded-lg
          p-0

          [&_svg:not([class*='size-'])]:size-3
        `,

        'icon-sm': `
          size-8
          rounded-[10px]
          p-0

          [&_svg:not([class*='size-'])]:size-3.5
        `,

        'icon-lg': `
          size-11
          rounded-xl
          p-0

          [&_svg:not([class*='size-'])]:size-[18px]
        `,
      },
    },

    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

interface ButtonProps
  extends React.ComponentProps<'button'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(
        buttonVariants({
          variant,
          size,
          className,
        }),
      )}
      {...props}
    />
  )
}

export {
  Button,
  buttonVariants,
  type ButtonProps,
}