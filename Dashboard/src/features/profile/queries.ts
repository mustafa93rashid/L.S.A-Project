import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/features/profile/api'
import { useSessionStore } from '@/stores/session.store'
import type {
  RequestEmailChangePayload,
  VerifyEmailChangePayload,
} from '@/features/profile/types'

export const profileKeys = {
  detail: ['profile'] as const,
}

export function useProfileQuery() {
  return useQuery({
    queryKey: profileKeys.detail,
    queryFn: api.getProfile,
  })
}

/**
 * On success, also patches the session store directly (not just
 * invalidating) — the Topbar reads the session store's `user`, not this
 * query, so without this the avatar/name there would look stale until
 * the next full session bootstrap.
 */
export function useUpdateProfileMutation() {
  const queryClient = useQueryClient()
  const setUser = useSessionStore((state) => state.setUser)

  return useMutation({
    mutationFn: (formData: FormData) => api.updateProfile(formData),
    onSuccess: (profile) => {
      queryClient.setQueryData(profileKeys.detail, profile)
      setUser(profile)
    },
  })
}

/** Step 1 of the email-change flow. No cache/session side effects — the
 * account's active email hasn't changed yet, only a code was sent. */
export function useRequestEmailChangeMutation() {
  return useMutation({
    mutationFn: (payload: RequestEmailChangePayload) => api.requestEmailChange(payload),
  })
}

/**
 * Step 2. On success the account email has actually changed — this
 * propagates the new profile the same way `useUpdateProfileMutation` does
 * (query cache + session store), since the Topbar reads the session store
 * directly. No session/cookie invalidation: unlike password change, email
 * change doesn't touch auth, so the user stays signed in.
 */
export function useVerifyEmailChangeMutation() {
  const queryClient = useQueryClient()
  const setUser = useSessionStore((state) => state.setUser)

  return useMutation({
    mutationFn: (payload: VerifyEmailChangePayload) => api.verifyEmailChange(payload),
    onSuccess: ({ profile }) => {
      queryClient.setQueryData(profileKeys.detail, profile)
      setUser(profile)
    },
  })
}

export function useDeleteProfileImageMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.deleteProfileImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail })
      // .getState() (not the reactive hook value) so this always reflects
      // the session at the moment the mutation actually resolves.
      const currentUser = useSessionStore.getState().user
      if (currentUser) {
        useSessionStore
          .getState()
          .setUser({ ...currentUser, avatar: { url: null, publicId: null } })
      }
    },
  })
}
