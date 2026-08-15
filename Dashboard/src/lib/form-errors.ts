import type { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form'
import { ApiError } from '@/types/api'


interface ApplyServerErrorsOptions {
  customFields?: Record<string, (message: string) => void>
}


/**
 * Maps backend validation errors to React Hook Form fields.
 *
 * Fields that are not managed by React Hook Form — such as uploaded files —
 * can be handled through `customFields`.
 *
 * Any non-field API error is returned as a general form message.
 */
export function applyServerErrors<TFieldValues extends FieldValues>(
  form: UseFormReturn<TFieldValues>,
  error: unknown,
  options?: ApplyServerErrorsOptions,
): string | null {
  if (!(error instanceof ApiError)) {
    return 'Something went wrong. Please try again.'
  }


  if (error.errors && error.errors.length > 0) {
    let hasMappedError = false

    for (const fieldError of error.errors) {
      const customHandler = options?.customFields?.[fieldError.field]

      if (customHandler) {
        customHandler(fieldError.message)
        hasMappedError = true
        continue
      }


      form.setError(fieldError.field as FieldPath<TFieldValues>, {
        type: 'server',
        message: fieldError.message,
      })

      hasMappedError = true
    }


    return hasMappedError ? null : error.message
  }


  return error.message
}