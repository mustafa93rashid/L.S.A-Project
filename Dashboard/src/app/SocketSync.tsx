import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useSessionStore } from '@/stores/session.store'
import { useNotificationStore } from '@/stores/notification.store'

import {
  connectSocket,
  disconnectSocket,
  getSocket,
} from '@/lib/socket'

import {
  notificationKeys,
  type NotificationsData,
} from '@/features/notifications/queries'

import { equipmentRequestKeys } from '@/features/equipment-requests/queries'
import { jobRequestKeys } from '@/features/job-requests/queries'
import { contactMessageKeys } from '@/features/contact-messages/queries'

import type { NotificationEventPayload } from '@/features/notifications/types'

const NOTIFICATION_SOUND_PATH = '/sounds/notification.mp3'

export function SocketSync() {
  const queryClient = useQueryClient()

  const audioRef =
    useRef<HTMLAudioElement | null>(null)

  const status =
    useSessionStore((state) => state.status)

  const setConnectionStatus =
    useNotificationStore(
      (state) => state.setConnectionStatus,
    )

  const resetNotificationStore =
    useNotificationStore(
      (state) => state.reset,
    )

  // ==================== Notification Sound ====================

  useEffect(() => {
    const audio =
      new Audio(NOTIFICATION_SOUND_PATH)

    audio.preload = 'auto'
    audio.volume = 0.5

    audioRef.current = audio

    const unlockAudio = () => {
      if (!audioRef.current) {
        return
      }

      audioRef.current.muted = true

      void audioRef.current
        .play()
        .then(() => {
          if (!audioRef.current) {
            return
          }

          audioRef.current.pause()
          audioRef.current.currentTime = 0
          audioRef.current.muted = false
        })
        .catch(() => {})
    }

    window.addEventListener(
      'pointerdown',
      unlockAudio,
      {
        once: true,
      },
    )

    return () => {
      window.removeEventListener(
        'pointerdown',
        unlockAudio,
      )

      audioRef.current = null
    }
  }, [])

  // ==================== Socket Sync ====================

  useEffect(() => {
    // ==================== Unauthenticated ====================

    if (status !== 'authenticated') {
      disconnectSocket()

      resetNotificationStore()

      queryClient.removeQueries({
        queryKey: notificationKeys.all,
      })

      return
    }

    // ==================== Socket ====================

    const socket = getSocket()

    // ==================== Connect ====================

    const handleConnect = () => {
      setConnectionStatus('connected')

      /*
       * Synchronize notifications after reconnect.
       * This catches anything that may have arrived
       * while the socket was temporarily offline.
       */
      void queryClient.invalidateQueries({
        queryKey: notificationKeys.all,
      })
    }

    // ==================== Disconnect ====================

    const handleDisconnect = () => {
      setConnectionStatus('disconnected')
    }

    // ==================== Connection Error ====================

    const handleConnectError = () => {
      setConnectionStatus('disconnected')
    }

    // ==================== Reconnect Attempt ====================

    const handleReconnectAttempt = () => {
      setConnectionStatus('connecting')
    }

    // ==================== New Notification ====================

    const handleNotification = (
      payload: NotificationEventPayload,
    ) => {
      if (!payload?.success || !payload.data) {
        return
      }

      const notification = payload.data

      // =========================================================
      // Synchronize related dashboard data
      // =========================================================

      switch (notification.type) {
        // ==================== Equipment Request ====================

        case 'equipmentRequest': {
          void queryClient.invalidateQueries({
            queryKey: equipmentRequestKeys.all,
          })

          break
        }

        // ==================== Job Request ====================

        case 'jobRequest': {
          void queryClient.invalidateQueries({
            queryKey: jobRequestKeys.all,
          })

          break
        }

        // ==================== Contact Message ====================

        case 'contactMessage': {
          void queryClient.invalidateQueries({
            queryKey: contactMessageKeys.all,
          })

          break
        }

        // ==================== System ====================

        case 'system': {
          break
        }

        default: {
          break
        }
      }

      // =========================================================
      // Update notification cache immediately
      // =========================================================

      let isNewNotification = false

      queryClient.setQueryData<NotificationsData>(
        notificationKeys.list(),
        (currentData) => {
          // ==================== No Existing Cache ====================

          if (!currentData) {
            isNewNotification = true

            return {
              notifications: [
                notification,
              ],

              unreadCount:
                notification.isRead
                  ? 0
                  : 1,

              pagination: {
                page: 1,
                limit: 10,
                total: 1,
                totalPages: 1,
                hasNextPage: false,
                hasPreviousPage: false,
              },
            }
          }

          // ==================== Prevent Duplicate ====================

          const alreadyExists =
            currentData.notifications.some(
              (existingNotification) =>
                existingNotification._id ===
                notification._id,
            )

          if (alreadyExists) {
            return currentData
          }

          isNewNotification = true

          // ==================== Insert New Notification ====================

          const notifications = [
            notification,
            ...currentData.notifications,
          ].slice(
            0,
            currentData.pagination.limit,
          )

          // ==================== Pagination ====================

          const total =
            currentData.pagination.total + 1

          const totalPages =
            Math.ceil(
              total /
                currentData.pagination.limit,
            )

          return {
            ...currentData,

            notifications,

            unreadCount:
              currentData.unreadCount +
              (notification.isRead
                ? 0
                : 1),

            pagination: {
              ...currentData.pagination,

              total,

              totalPages,

              hasNextPage:
                currentData.pagination.page <
                totalPages,
            },
          }
        },
      )

      // =========================================================
      // Sound + Toast
      // =========================================================

      if (isNewNotification) {
        const audio =
          audioRef.current

        if (audio) {
          audio.currentTime = 0

          void audio
            .play()
            .catch((error) => {
              console.warn(
                'Notification sound could not be played:',
                error,
              )
            })
        }

        toast.info(
          notification.title,
          {
            description:
              notification.message,
          },
        )
      }
    }

    // ==================== Listeners ====================

    socket.on(
      'connect',
      handleConnect,
    )

    socket.on(
      'disconnect',
      handleDisconnect,
    )

    socket.on(
      'connect_error',
      handleConnectError,
    )

    socket.io.on(
      'reconnect_attempt',
      handleReconnectAttempt,
    )

    socket.on(
      'notification:new',
      handleNotification,
    )

    // ==================== Connect ====================

    setConnectionStatus(
      'connecting',
    )

    connectSocket()

    // ==================== Cleanup ====================

    return () => {
      socket.off(
        'connect',
        handleConnect,
      )

      socket.off(
        'disconnect',
        handleDisconnect,
      )

      socket.off(
        'connect_error',
        handleConnectError,
      )

      socket.io.off(
        'reconnect_attempt',
        handleReconnectAttempt,
      )

      socket.off(
        'notification:new',
        handleNotification,
      )
    }
  }, [
    status,
    queryClient,
    setConnectionStatus,
    resetNotificationStore,
  ])

  return null
}