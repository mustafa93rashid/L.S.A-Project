import { apiClient } from '@/lib/api-client'

import type {
  News,
  NewsFilters,
  NewsListResponse,
  NewsResponse,
} from './types'

// ==================== Constants ====================

const NEWS_URL = '/news'

// ==================== Get News ====================

export const getNews = async (
  filters: NewsFilters = {},
): Promise<NewsListResponse> => {
  const { data } =
    await apiClient.get<NewsListResponse>(
      NEWS_URL,
      {
        params: filters,
      },
    )

  return data
}

// ==================== Get News By ID ====================

export const getNewsById = async (
  id: string,
): Promise<News> => {
  const { data } =
    await apiClient.get<NewsResponse>(
      `${NEWS_URL}/${id}`,
    )

  return data.data
}

// ==================== Create News ====================

export const createNews = async (
  formData: FormData,
): Promise<News> => {
  const { data } =
    await apiClient.post<NewsResponse>(
      NEWS_URL,
      formData,
    )

  return data.data
}

// ==================== Update News ====================

export const updateNews = async ({
  id,
  formData,
}: {
  id: string
  formData: FormData
}): Promise<News> => {
  const { data } =
    await apiClient.patch<NewsResponse>(
      `${NEWS_URL}/${id}`,
      formData,
    )

  return data.data
}

// ==================== Delete News ====================

export const deleteNews = async (
  id: string,
): Promise<void> => {
  await apiClient.delete(
    `${NEWS_URL}/${id}`,
  )
}

// ==================== Get Public News ====================

export const getPublicNews = async (
  limit = 3,
): Promise<News[]> => {
  const { data } =
    await apiClient.get<{
      success: boolean
      count: number
      data: News[]
    }>(
      `${NEWS_URL}/public`,
      {
        params: {
          limit,
        },
      },
    )

  return data.data
}