import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/features/team-members/api'

export const teamMemberKeys = {
  all: ['teamMembers'] as const,
  list: () => [...teamMemberKeys.all, 'list'] as const,
}

export function useTeamMembersQuery() {
  return useQuery({
    queryKey: teamMemberKeys.list(),
    queryFn: api.getTeamMembers,
  })
}

export function useCreateTeamMemberMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) => api.createTeamMember(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamMemberKeys.all })
    },
  })
}

export function useUpdateTeamMemberMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      api.updateTeamMember(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamMemberKeys.all })
    },
  })
}

export function useDeleteTeamMemberMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteTeamMember(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamMemberKeys.all })
    },
  })
}
