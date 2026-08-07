import { z } from 'zod'

/** Mirrors Backend/src/validation/partner.validate.js's isURL({protocols:
 * ['http','https'], require_protocol:true}) with checkFalsy (empty
 * string is treated as "not provided", same as the backend). */
function isValidWebsite(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export const partnerSchema = z.object({
  website: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || isValidWebsite(value), {
      message: 'Website must be a valid URL including http:// or https://',
    }),
})

export type PartnerInput = z.infer<typeof partnerSchema>
