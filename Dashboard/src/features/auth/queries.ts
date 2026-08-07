import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as authApi from '@/features/auth/api'
import { useSessionStore } from '@/stores/session.store'
import type {
  ActivateAccountPayload,
  ForgotPasswordPayload,
  LoginPayload,
  RequestPasswordChangePayload,
  ResetPasswordPayload,
  VerifyPasswordChangePayload,
} from '@/features/auth/types'

export const authKeys = {
  me: ['auth', 'me'] as const,
}

/**
 * `staleTime: Infinity` — this is the session-of-truth query, refetched
 * manually (by invalidation) after login/logout, not on a timer.
 */
export function useCurrentUserQuery(enabled: boolean) {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: authApi.getCurrentUser,
    enabled,
    retry: false,
    staleTime: Infinity,
  })
}

export function useLoginMutation() {
  const queryClient = useQueryClient()
  const setUser = useSessionStore((state) => state.setUser)

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (user) => {
      setUser(user)
      queryClient.setQueryData(authKeys.me, user)
    },
  })
}

export function useLogoutMutation() {
  const queryClient = useQueryClient()
  const clearSession = useSessionStore((state) => state.clearSession)

  return useMutation({
    mutationFn: authApi.logout,
    // Best-effort: clear local session/cache even if the network call
    // itself fails — the user's intent to log out is unambiguous, and
    // leaving stale "authenticated" UI up is worse than a false negative
    // on the server-side cookie clear.
    onSettled: () => {
      clearSession()
      queryClient.removeQueries({ queryKey: authKeys.me })
    },
  })
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordPayload) => authApi.forgotPassword(payload),
  })
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: ({ token, payload }: { token: string; payload: ResetPasswordPayload }) =>
      authApi.resetPassword(token, payload),
  })
}

/** Step 1 of the in-app change-password flow. Deliberately no `onSuccess`
 * side effects here — the caller (SecurityCard) owns transitioning to step
 * 2 and holding the verified `currentPassword` in its own ephemeral state
 * for a possible resend; nothing password-related is cached by React Query
 * or persisted to the session store. */
export function useRequestPasswordChangeMutation() {
  return useMutation({
    mutationFn: (payload: RequestPasswordChangePayload) =>
      authApi.requestPasswordChange(payload),
  })
}

/**
 * Step 2. On success the backend has already revoked the refresh token and
 * cleared the auth cookies — this mirrors `useLogoutMutation`'s cleanup
 * (clear session store, drop the cached `auth/me` query) but does NOT
 * attempt a silent refresh or re-fetch; the caller navigates to /login.
 */
export function useVerifyPasswordChangeMutation() {
  const queryClient = useQueryClient()
  const clearSession = useSessionStore((state) => state.clearSession)

  return useMutation({
    mutationFn: (payload: VerifyPasswordChangePayload) =>
      authApi.verifyPasswordChange(payload),
    onSuccess: () => {
      clearSession()
      queryClient.removeQueries({ queryKey: authKeys.me })
    },
  })
}

export function useActivateAccountMutation() {
  return useMutation({
    mutationFn: (payload: ActivateAccountPayload) => authApi.activateAccount(payload),
  })
}
