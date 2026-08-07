import type { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form'
import { ApiError } from '@/types/api'

/**
 * Maps a failed mutation's error onto a form: field-level errors from the
 * backend's `errors: [{ field, message }]` are attached to their matching
 * fields via RHF's `setError`. Anything without a field mapping (e.g.
 * login's "Invalid email or password", which isn't tied to one input) is
 * returned as a general message for the caller to render in a form-level
 * banner instead.
 */
export function applyServerErrors<TFieldValues extends FieldValues>(
  form: UseFormReturn<TFieldValues>,
  error: unknown,
): string | null {
  if (!(error instanceof ApiError)) {
    return 'Something went wrong. Please try again.'
  }

  if (error.errors && error.errors.length > 0) {
    for (const fieldError of error.errors) {
      form.setError(fieldError.field as FieldPath<TFieldValues>, {
        type: 'server',
        message: fieldError.message,
      })
    }
    return null
  }

  return error.message
}
