import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import * as api from '@/features/team-members/api'
import type { TeamMember } from '@/features/team-members/types'

// ==================== Query Keys ====================

export const teamMemberKeys = {
  all: ['teamMembers'] as const,

  lists: () =>
    [...teamMemberKeys.all, 'list'] as const,

  list: () =>
    [...teamMemberKeys.lists()] as const,
}

// ==================== Helpers ====================

function sortTeamMembers(teamMembers: TeamMember[]) {
  return [...teamMembers].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  )
}

// ==================== Query ====================

export function useTeamMembersQuery() {
  return useQuery({
    queryKey: teamMemberKeys.list(),
    queryFn: api.getTeamMembers,
  })
}

// ==================== Create ====================

export function useCreateTeamMemberMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (formData: FormData) =>
      api.createTeamMember(formData),

    onSuccess: async (createdTeamMember) => {
      queryClient.setQueryData<TeamMember[]>(
        teamMemberKeys.list(),
        (current = []) =>
          sortTeamMembers([
            ...current,
            createdTeamMember,
          ]),
      )

      await queryClient.invalidateQueries({
        queryKey: teamMemberKeys.all,
      })
    },
  })
}

// ==================== Update ====================

export function useUpdateTeamMemberMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      formData,
    }: {
      id: string
      formData: FormData
    }) =>
      api.updateTeamMember(id, formData),

    onSuccess: async (updatedTeamMember) => {
      queryClient.setQueryData<TeamMember[]>(
        teamMemberKeys.list(),
        (current = []) =>
          sortTeamMembers(
            current.map((teamMember) =>
              teamMember._id === updatedTeamMember._id
                ? updatedTeamMember
                : teamMember,
            ),
          ),
      )

      await queryClient.invalidateQueries({
        queryKey: teamMemberKeys.all,
      })
    },
  })
}

// ==================== Delete ====================

export function useDeleteTeamMemberMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      api.deleteTeamMember(id),

    onSuccess: async (_, deletedId) => {
      queryClient.setQueryData<TeamMember[]>(
        teamMemberKeys.list(),
        (current = []) =>
          current.filter(
            (teamMember) =>
              teamMember._id !== deletedId,
          ),
      )

      await queryClient.invalidateQueries({
        queryKey: teamMemberKeys.all,
      })
    },
  })
}