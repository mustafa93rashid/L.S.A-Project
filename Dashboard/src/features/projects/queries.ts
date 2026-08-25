import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import * as api from '@/features/projects/api'
import type { Project } from '@/features/projects/types'

// ==================== Query Keys ====================

export const projectKeys = {
  all: ['projects'] as const,

  lists: () =>
    [...projectKeys.all, 'list'] as const,

  list: () =>
    [...projectKeys.lists()] as const,
}

// ==================== Helpers ====================

function sortProjects(projects: Project[]) {
  return [...projects].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  )
}

// ==================== Query ====================

export function useProjectsQuery() {
  return useQuery({
    queryKey: projectKeys.list(),
    queryFn: api.getProjects,
  })
}

// ==================== Create ====================

export function useCreateProjectMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (formData: FormData) =>
      api.createProject(formData),

    onSuccess: async (createdProject) => {
      queryClient.setQueryData<Project[]>(
        projectKeys.list(),
        (current = []) =>
          sortProjects([
            ...current,
            createdProject,
          ]),
      )

      await queryClient.invalidateQueries({
        queryKey: projectKeys.all,
      })
    },
  })
}

// ==================== Update ====================

export function useUpdateProjectMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      formData,
    }: {
      id: string
      formData: FormData
    }) =>
      api.updateProject(id, formData),

    onSuccess: async (updatedProject) => {
      queryClient.setQueryData<Project[]>(
        projectKeys.list(),
        (current = []) =>
          sortProjects(
            current.map((project) =>
              project._id === updatedProject._id
                ? updatedProject
                : project,
            ),
          ),
      )

      await queryClient.invalidateQueries({
        queryKey: projectKeys.all,
      })
    },
  })
}

// ==================== Delete ====================

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      api.deleteProject(id),

    onSuccess: async (_, deletedId) => {
      queryClient.setQueryData<Project[]>(
        projectKeys.list(),
        (current = []) =>
          current.filter(
            (project) =>
              project._id !== deletedId,
          ),
      )

      await queryClient.invalidateQueries({
        queryKey: projectKeys.all,
      })
    },
  })
}