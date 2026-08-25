import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import * as api from '@/features/profile/api'

import { useSessionStore } from '@/stores/session.store'

import type {
  RequestEmailChangePayload,
  VerifyEmailChangePayload,
} from '@/features/profile/types'

// ==================== Query Keys ====================

export const profileKeys = {
  all: ['profile'] as const,

  detail: () =>
    [...profileKeys.all, 'detail'] as const,
}

// ==================== Query ====================

export function useProfileQuery() {
  return useQuery({
    queryKey: profileKeys.detail(),
    queryFn: api.getProfile,
  })
}

// ==================== Update Profile ====================

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient()

  const setUser =
    useSessionStore((state) => state.setUser)

  return useMutation({
    mutationFn: (formData: FormData) =>
      api.updateProfile(formData),

    onSuccess: async (profile) => {
      // Update React Query cache immediately
      queryClient.setQueryData(
        profileKeys.detail(),
        profile,
      )

      // Update session store immediately
      setUser(profile)

      // Final synchronization
      await queryClient.invalidateQueries({
        queryKey: profileKeys.all,
      })
    },
  })
}

// ==================== Request Email Change ====================

export function useRequestEmailChangeMutation() {
  return useMutation({
    mutationFn: (
      payload: RequestEmailChangePayload,
    ) =>
      api.requestEmailChange(payload),
  })
}

// ==================== Verify Email Change ====================

export function useVerifyEmailChangeMutation() {
  const queryClient = useQueryClient()

  const setUser =
    useSessionStore((state) => state.setUser)

  return useMutation({
    mutationFn: (
      payload: VerifyEmailChangePayload,
    ) =>
      api.verifyEmailChange(payload),

    onSuccess: async ({ profile }) => {
      // Update React Query cache immediately
      queryClient.setQueryData(
        profileKeys.detail(),
        profile,
      )

      // Update session store immediately
      setUser(profile)

      // Final synchronization
      await queryClient.invalidateQueries({
        queryKey: profileKeys.all,
      })
    },
  })
}

// ==================== Delete Profile Image ====================

export function useDeleteProfileImageMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn:
      api.deleteProfileImage,

    onSuccess: async () => {
      // Update session store immediately
      const currentUser =
        useSessionStore.getState().user

      if (currentUser) {
        useSessionStore
          .getState()
          .setUser({
            ...currentUser,

            avatar: {
              url: null,
              publicId: null,
            },
          })
      }

      // Synchronize profile query
      await queryClient.invalidateQueries({
        queryKey: profileKeys.all,
      })
    },
  })
}