import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/features/notifications/api'

import type {
  AppNotification,
} from '@/features/notifications/types'

// ==================== Query Keys ====================

export const notificationKeys = {
  all: ['notifications'] as const,

  lists: () =>
    [...notificationKeys.all, 'list'] as const,

  list: () =>
    [...notificationKeys.lists()] as const,
}

// ==================== Types ====================

export interface NotificationsData {
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

// ==================== Query ====================

export function useNotificationsQuery() {
  return useQuery({
    queryKey: notificationKeys.list(),
    queryFn: getNotifications,
  })
}

// ==================== Mark One As Read ====================

export function useMarkNotificationAsReadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markNotificationAsRead,

    onSuccess: async (_, notificationId) => {
      queryClient.setQueryData<NotificationsData>(
        notificationKeys.list(),
        (current) => {
          if (!current) {
            return current
          }

          const notification =
            current.notifications.find(
              (item) =>
                item._id === notificationId,
            )

          if (!notification) {
            return current
          }

          // Already read: nothing to decrement
          if (notification.isRead) {
            return current
          }

          return {
            ...current,

            unreadCount: Math.max(
              0,
              current.unreadCount - 1,
            ),

            notifications:
              current.notifications.map(
                (item) =>
                  item._id === notificationId
                    ? {
                        ...item,
                        isRead: true,
                        readAt:
                          item.readAt ??
                          new Date().toISOString(),
                      }
                    : item,
              ),
          }
        },
      )

      await queryClient.invalidateQueries({
        queryKey: notificationKeys.all,
      })
    },
  })
}

// ==================== Mark All As Read ====================

export function useMarkAllNotificationsAsReadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markAllNotificationsAsRead,

    onSuccess: async () => {
      const readAt = new Date().toISOString()

      queryClient.setQueryData<NotificationsData>(
        notificationKeys.list(),
        (current) => {
          if (!current) {
            return current
          }

          return {
            ...current,

            unreadCount: 0,

            notifications:
              current.notifications.map(
                (notification) => ({
                  ...notification,

                  isRead: true,

                  readAt:
                    notification.readAt ??
                    readAt,
                }),
              ),
          }
        },
      )

      await queryClient.invalidateQueries({
        queryKey: notificationKeys.all,
      })
    },
  })
}