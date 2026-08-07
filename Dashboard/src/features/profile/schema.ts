import { z } from 'zod'

/** Mirrors Backend/src/validation/user.validate.js's updateProfileValidation.
 * Email is deliberately NOT here — `PATCH /users/profile` no longer accepts
 * it (see `requestEmailChangeSchema`/`verifyEmailChangeSchema` below); the
 * backend now rejects an `email` key on this endpoint with a 400. */
export const personalInfoSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, 'Full name must be at least 3 characters.')
    .max(100, 'Full name must be at most 100 characters.'),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{7,15}$/, 'Enter a valid phone number.'),
  department: z
    .string()
    .trim()
    .min(2, 'Department must be at least 2 characters.')
    .max(100, 'Department must be at most 100 characters.'),
})

export type PersonalInfoInput = z.infer<typeof personalInfoSchema>

/** Step 1 of the email-change flow — mirrors `requestEmailChangeValidation`. */
export const requestEmailChangeSchema = z.object({
  newEmail: z
    .string()
    .trim()
    .min(1, 'New email is required.')
    .email('Enter a valid email address.'),
})
export type RequestEmailChangeInput = z.infer<typeof requestEmailChangeSchema>

/** Step 2 — mirrors `verifyEmailChangeValidation`. */
export const verifyEmailChangeSchema = z.object({
  verificationCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter the 6-digit code.'),
})
export type VerifyEmailChangeInput = z.infer<typeof verifyEmailChangeSchema>
