import { useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface PasswordInputProps extends Omit<React.ComponentProps<typeof Input>, 'type'> {
  /** Label text used to build the toggle button's aria-label, e.g. "current
   * password" -> "Show current password" / "Hide current password". */
  fieldLabel: string
}

/**
 * Password field with a show/hide toggle. Purely a display affordance —
 * the value itself lives wherever the caller's form state already does
 * (react-hook-form's `register`d field), never duplicated into local
 * state here, so there's exactly one place the password value exists.
 */
export function PasswordInput({
  fieldLabel,
  className,
  id,
  ...props
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false)
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <div className="relative">
      <Input
        id={inputId}
        type={isVisible ? 'text' : 'password'}
        className={cn('pr-9', className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setIsVisible((current) => !current)}
        aria-label={isVisible ? `Hide ${fieldLabel}` : `Show ${fieldLabel}`}
        aria-pressed={isVisible}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
      >
        {isVisible ? (
          <EyeOff className="size-4" aria-hidden="true" />
        ) : (
          <Eye className="size-4" aria-hidden="true" />
        )}
      </button>
    </div>
  )
}
