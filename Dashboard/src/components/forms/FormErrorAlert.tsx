// components/forms/FormErrorAlert.tsx

import { AlertCircle } from 'lucide-react'

interface FormErrorAlertProps {
  message?: string | null
  title?: string
}

export function FormErrorAlert({
  message,
  title = 'Unable to save',
}: FormErrorAlertProps) {
  if (!message) return null

  return (
    <div
      role="alert"
      className="flex shrink-0 items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/[0.045] px-4 py-3.5"
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
        <AlertCircle className="size-4" strokeWidth={1.8} />
      </div>

      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-destructive">
          {title}
        </p>

        <p className="mt-1 text-[10px] leading-5 text-destructive/75">
          {message}
        </p>
      </div>
    </div>
  )
}