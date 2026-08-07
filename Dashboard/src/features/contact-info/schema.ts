import { z } from 'zod'

/** Mirrors Backend/src/validation/contactInfo.validate.js. Address,
 * primaryPhone, email, and workingHours are required in this form even
 * though the backend's per-field rules mark them "optional" — those four
 * are the fields the Mongoose model itself requires the first time the
 * singleton is created, so the dashboard collects them unconditionally
 * rather than allowing a create that would fail. */
const PHONE_REGEX = /^[0-9+\-()\s]{7,30}$/

function isValidUrl(value: string): boolean {
  if (!value) return true
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const optionalUrlField = z
  .string()
  .trim()
  .max(1000)
  .optional()
  .refine((value) => !value || isValidUrl(value), {
    message: 'Must be a valid URL including http:// or https://',
  })

export const contactInfoSchema = z
  .object({
    title: z.string().trim().max(150).optional(),
    description: z.string().trim().max(1000).optional(),
    address: z.string().trim().min(2, 'Address is required.').max(500),
    mapUrl: optionalUrlField,
    phones: z
      .array(z.string().trim().regex(PHONE_REGEX, 'Invalid phone number format.'))
      .min(1, 'At least one phone number is required.')
      .max(10, 'At most 10 phone numbers are allowed.'),
    primaryPhone: z
      .string()
      .trim()
      .min(1, 'Primary phone number is required.')
      .regex(PHONE_REGEX, 'Invalid phone number format.'),
    email: z
      .string()
      .trim()
      .min(1, 'Email is required.')
      .email('Must be a valid email address.'),
    workingHours: z.string().trim().min(1, 'Working hours are required.').max(250),
    emergencyHours: z.string().trim().max(250).optional(),
    facebook: optionalUrlField,
    instagram: optionalUrlField,
    linkedin: optionalUrlField,
    whatsapp: z
      .string()
      .trim()
      .optional()
      .refine((value) => !value || PHONE_REGEX.test(value), {
        message: 'Invalid WhatsApp phone number format.',
      }),
    isActive: z.boolean().optional(),
  })
  .refine((data) => data.phones.includes(data.primaryPhone.trim()), {
    message: 'Primary phone number must exist in the phones list.',
    path: ['primaryPhone'],
  })

export type ContactInfoInput = z.infer<typeof contactInfoSchema>
