import { apiClient } from '@/lib/api-client'
import type { ApiEnvelope } from '@/types/api'
import type { AuthUser } from '@/types/auth'
import type {
  ActivateAccountPayload,
  ForgotPasswordPayload,
  LoginPayload,
  RequestPasswordChangePayload,
  ResetPasswordPayload,
  VerifyPasswordChangePayload,
} from '@/features/auth/types'

export async function login(payload: LoginPayload): Promise<AuthUser> {
  const response = await apiClient.post<ApiEnvelope<AuthUser>>('/auth/login', payload)
  if (!response.data.data) {
    throw new Error('Login response did not include user data.')
  }
  return response.data.data
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout')
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await apiClient.get<ApiEnvelope<AuthUser>>('/auth/me')
  if (!response.data.data) {
    throw new Error('Session response did not include user data.')
  }
  return response.data.data
}

export async function forgotPassword(payload: ForgotPasswordPayload): Promise<string> {
  const response = await apiClient.post<ApiEnvelope<never>>(
    '/auth/forgot-password',
    payload,
  )
  return (
    response.data.message ??
    'If an account exists for that email, a reset link has been sent.'
  )
}

export async function resetPassword(
  token: string,
  payload: ResetPasswordPayload,
): Promise<string> {
  const response = await apiClient.post<ApiEnvelope<never>>(
    `/auth/reset-password/${token}`,
    payload,
  )
  return response.data.message ?? 'Password reset successfully.'
}

/** Step 1 of the in-app change-password flow: current password only. On
 * success the backend emails a 6-digit verification code (no code is ever
 * returned in the response body). */
export async function requestPasswordChange(
  payload: RequestPasswordChangePayload,
): Promise<string> {
  const response = await apiClient.post<ApiEnvelope<never>>(
    '/auth/change-password/request',
    payload,
  )
  return response.data.message ?? 'Verification code sent successfully.'
}

/** Step 2: verification code + new password. On success the backend
 * revokes the refresh token and clears the auth cookies server-side, so
 * the caller must treat the session as ended. */
export async function verifyPasswordChange(
  payload: VerifyPasswordChangePayload,
): Promise<string> {
  const response = await apiClient.post<ApiEnvelope<never>>(
    '/auth/change-password/verify',
    payload,
  )
  return response.data.message ?? 'Password changed successfully. Please sign in again.'
}

export async function activateAccount(payload: ActivateAccountPayload): Promise<string> {
  const response = await apiClient.post<ApiEnvelope<never>>(
    '/users/activate-account',
    payload,
  )
  return response.data.message ?? 'Account activated successfully.'
}
