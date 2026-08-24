import { z } from 'zod'

/**
 * Mirrors Backend/src/validation/partner.validate.js
 * isURL({
 *   protocols: ['http', 'https'],
 *   require_protocol: true,
 * })
 *
 * Empty string is treated as "not provided",
 * matching the backend checkFalsy behavior.
 */
function isValidWebsite(value: string): boolean {
  try {
    const url = new URL(value)

    return (
      url.protocol === 'http:' ||
      url.protocol === 'https:'
    )
  } catch {
    return false
  }
}

// ==================== Partner Schema ====================

export const partnerSchema = z.object({
  // ==================== Website ====================

  website: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || isValidWebsite(value),
      {
        message:
          'Website must be a valid URL including http:// or https://',
      },
    ),

  // ==================== Display Order ====================

  displayOrder: z
    .number({
      message: 'Display order is required',
    })
    .int({
      message: 'Display order must be a whole number',
    })
    .min(1, {
      message: 'Display order must be at least 1',
    }),
})

// ==================== Partner Input ====================

export type PartnerInput = z.infer<
  typeof partnerSchema
>