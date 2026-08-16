// components/forms/FieldError.tsx

import { AlertCircle } from 'lucide-react'

interface FieldErrorProps {
  message?: string | null
  className?: string
}

export function FieldError({
  message,
  className = '',
}: FieldErrorProps) {
  if (!message) return null

  return (
    <p
      className={`mt-1 flex items-center gap-1.5 text-[9px] font-medium leading-4 text-destructive/80 ${className}`}
    >
      <AlertCircle className="size-3 shrink-0" strokeWidth={1.7} />
      {message}
    </p>
  )
}