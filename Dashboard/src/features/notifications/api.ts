import { apiClient } from '@/lib/api-client'
import type { AppNotification } from '@/features/notifications/types'

export interface NotificationsResponse {
  success: boolean
  data: {
    notifications: AppNotification[]
    unreadCount: number
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasNextPage: boolean
      hasPreviousPage: boolean
    }
  }
}

export interface UnreadCountResponse {
  success: boolean
  data: {
    unreadCount: number
  }
}

export async function getNotifications() {
  const { data } =
    await apiClient.get<NotificationsResponse>(
      '/notifications?page=1&limit=10',
    )

  return data.data
}

export async function getUnreadNotificationsCount() {
  const { data } =
    await apiClient.get<UnreadCountResponse>(
      '/notifications/unread-count',
    )

  return data.data
}

export async function markNotificationAsRead(id: string) {
  const { data } = await apiClient.patch<{
    success: boolean
    data: AppNotification
  }>(`/notifications/${id}/read`)

  return data.data
}

export async function markAllNotificationsAsRead() {
  const { data } = await apiClient.patch<{
    success: boolean
    data: {
      modifiedCount: number
    }
  }>('/notifications/read-all')

  return data.data
}