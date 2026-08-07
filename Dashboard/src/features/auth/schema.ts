import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required.')
    .email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
})
export type LoginInput = z.infer<typeof loginSchema>

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required.')
    .email('Enter a valid email address.'),
})
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

/** Mirrors `passwordValidationRules` in Backend/src/validation/auth.validate.js exactly. */
export const passwordRules = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(128, 'Password must be at most 128 characters.')
  .regex(/[a-z]/, 'Password must contain a lowercase letter.')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter.')
  .regex(/\d/, 'Password must contain a number.')
  .regex(/[@$!%*?&#^()_\-+=]/, 'Password must contain a special character.')

export const resetPasswordSchema = z
  .object({
    newPassword: passwordRules,
    confirmPassword: z.string().min(1, 'Confirm your password.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

/** Step 1 of the in-app change-password flow — mirrors
 * `requestPasswordChangeValidation` exactly: current password only, no new
 * password yet (that's collected in step 2, once the code is verified). */
export const requestPasswordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
})
export type RequestPasswordChangeInput = z.infer<typeof requestPasswordChangeSchema>

/** Step 2 — mirrors `verifyPasswordChangeValidation` exactly. */
export const verifyPasswordChangeSchema = z
  .object({
    verificationCode: z
      .string()
      .trim()
      .regex(/^\d{6}$/, 'Enter the 6-digit code.'),
    newPassword: passwordRules,
    confirmPassword: z.string().min(1, 'Confirm your new password.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })
export type VerifyPasswordChangeInput = z.infer<typeof verifyPasswordChangeSchema>

export const activateAccountSchema = z
  .object({
    password: passwordRules,
    confirmPassword: z.string().min(1, 'Confirm your password.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })
export type ActivateAccountInput = z.infer<typeof activateAccountSchema>
