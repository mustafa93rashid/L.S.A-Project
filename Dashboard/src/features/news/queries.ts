import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  createNews,
  deleteNews,
  getNews,
  getNewsById,
  updateNews,
} from './api'

import type {
  NewsFilters,
} from './types'

// ==================== Query Keys ====================

export const newsKeys = {
  all: ['news'] as const,

  lists: () =>
    [
      ...newsKeys.all,
      'list',
    ] as const,

  list: (
    filters: NewsFilters,
  ) =>
    [
      ...newsKeys.lists(),
      filters,
    ] as const,

  details: () =>
    [
      ...newsKeys.all,
      'detail',
    ] as const,

  detail: (
    id: string,
  ) =>
    [
      ...newsKeys.details(),
      id,
    ] as const,
}

// ==================== News List Query ====================

export const useNews = (
  filters: NewsFilters = {},
) => {
  return useQuery({
    queryKey:
      newsKeys.list(filters),

    queryFn: () =>
      getNews(filters),
  })
}

// ==================== News Details Query ====================

export const useNewsById = (
  id?: string,
) => {
  return useQuery({
    queryKey:
      newsKeys.detail(
        id || '',
      ),

    queryFn: () =>
      getNewsById(id!),

    enabled:
      Boolean(id),
  })
}

// ==================== Create News Mutation ====================

export const useCreateNews = () => {
  const queryClient =
    useQueryClient()

  return useMutation({
    mutationFn: (
      formData: FormData,
    ) =>
      createNews(
        formData,
      ),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey:
          newsKeys.all,
      })
    },
  })
}

// ==================== Update News Mutation ====================

export const useUpdateNews = () => {
  const queryClient =
    useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      formData,
    }: {
      id: string
      formData: FormData
    }) =>
      updateNews({
        id,
        formData,
      }),

    onSuccess: async (
      updatedNews,
    ) => {
      queryClient.setQueryData(
        newsKeys.detail(
          updatedNews._id,
        ),
        updatedNews,
      )

      await queryClient.invalidateQueries({
        queryKey:
          newsKeys.lists(),
      })
    },
  })
}

// ==================== Delete News Mutation ====================

export const useDeleteNews = () => {
  const queryClient =
    useQueryClient()

  return useMutation({
    mutationFn: (
      id: string,
    ) =>
      deleteNews(id),

    onSuccess: async (
      _,
      id,
    ) => {
      queryClient.removeQueries({
        queryKey:
          newsKeys.detail(id),
      })

      await queryClient.invalidateQueries({
        queryKey:
          newsKeys.lists(),
      })
    },
  })
}