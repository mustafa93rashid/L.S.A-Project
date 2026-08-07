import { apiClient } from '@/lib/api-client'
import type { ApiEnvelope } from '@/types/api'
import type {
  ProfileUser,
  RequestEmailChangePayload,
  VerifyEmailChangePayload,
} from '@/features/profile/types'

export async function getProfile(): Promise<ProfileUser> {
  const response = await apiClient.get<ApiEnvelope<ProfileUser>>('/users/profile')
  if (!response.data.data) throw new Error('Profile response did not include user data.')
  return response.data.data
}

/** Never send `email` in this FormData — the backend rejects it with a
 * 400 (`"Email changes require verification..."`). Email changes go
 * through `requestEmailChange`/`verifyEmailChange` below instead. */
export async function updateProfile(formData: FormData): Promise<ProfileUser> {
  const response = await apiClient.patch<ApiEnvelope<ProfileUser>>(
    '/users/profile',
    formData,
  )
  if (!response.data.data)
    throw new Error('Profile update response did not include user data.')
  return response.data.data
}

export async function deleteProfileImage(): Promise<void> {
  await apiClient.delete('/users/profile/image')
}

/** Step 1 of the email-change flow. On success the backend emails a
 * 6-digit code to `newEmail` — the account's active email is untouched
 * until `verifyEmailChange` succeeds. */
export async function requestEmailChange(
  payload: RequestEmailChangePayload,
): Promise<string> {
  const response = await apiClient.post<ApiEnvelope<never>>(
    '/users/profile/email-change/request',
    payload,
  )
  return response.data.message ?? 'Verification code sent to the new email address.'
}

/** Step 2. On success the backend returns the updated profile (new email
 * now active) — no session/cookie changes, the caller stays signed in. */
export async function verifyEmailChange(
  payload: VerifyEmailChangePayload,
): Promise<{ message: string; profile: ProfileUser }> {
  const response = await apiClient.post<ApiEnvelope<ProfileUser>>(
    '/users/profile/email-change/verify',
    payload,
  )
  if (!response.data.data)
    throw new Error('Email verification response did not include user data.')
  return {
    message: response.data.message ?? 'Email address updated successfully.',
    profile: response.data.data,
  }
}
