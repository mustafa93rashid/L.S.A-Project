import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useSessionStore } from '@/stores/session.store'
import { useNotificationStore } from '@/stores/notification.store'
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket'
import {
  notificationKeys,
  type NotificationsData,
} from '@/features/notifications/queries'
import type { NotificationEventPayload } from '@/features/notifications/types'

const NOTIFICATION_SOUND_PATH = '/sounds/notification.mp3'

export function SocketSync() {
  const queryClient = useQueryClient()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const status = useSessionStore((state) => state.status)

  const setConnectionStatus = useNotificationStore(
    (state) => state.setConnectionStatus,
  )

  const resetNotificationStore = useNotificationStore(
    (state) => state.reset,
  )

  useEffect(() => {
    const audio = new Audio(NOTIFICATION_SOUND_PATH)

    audio.preload = 'auto'
    audio.volume = 0.5

    audioRef.current = audio

    const unlockAudio = () => {
      if (!audioRef.current) return

      audioRef.current.muted = true

      void audioRef.current
        .play()
        .then(() => {
          if (!audioRef.current) return

          audioRef.current.pause()
          audioRef.current.currentTime = 0
          audioRef.current.muted = false
        })
        .catch(() => {})
    }

    window.addEventListener('pointerdown', unlockAudio, {
      once: true,
    })

    return () => {
      window.removeEventListener('pointerdown', unlockAudio)
      audioRef.current = null
    }
  }, [])

  useEffect(() => {
    if (status !== 'authenticated') {
      disconnectSocket()
      resetNotificationStore()

      queryClient.removeQueries({
        queryKey: notificationKeys.all,
      })

      return
    }

    const socket = getSocket()

    const handleConnect = () => {
      setConnectionStatus('connected')

      void queryClient.invalidateQueries({
        queryKey: notificationKeys.all,
      })
    }

    const handleDisconnect = () => {
      setConnectionStatus('disconnected')
    }

    const handleConnectError = () => {
      setConnectionStatus('disconnected')
    }

    const handleReconnectAttempt = () => {
      setConnectionStatus('connecting')
    }

    const handleNotification = (
      payload: NotificationEventPayload,
    ) => {
      if (!payload?.success || !payload.data) {
        return
      }

      const notification = payload.data

      let isNewNotification = false

      queryClient.setQueryData<NotificationsData>(
        notificationKeys.list(),
        (currentData) => {
          if (!currentData) {
            isNewNotification = true

            return {
              notifications: [notification],

              unreadCount: notification.isRead ? 0 : 1,

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

          const alreadyExists =
            currentData.notifications.some(
              (existingNotification) =>
                existingNotification._id === notification._id,
            )

          if (alreadyExists) {
            return currentData
          }

          isNewNotification = true

          const notifications = [
            notification,
            ...currentData.notifications,
          ].slice(0, currentData.pagination.limit)

          const total =
            currentData.pagination.total + 1

          const totalPages = Math.ceil(
            total / currentData.pagination.limit,
          )

          return {
            ...currentData,

            notifications,

            unreadCount:
              currentData.unreadCount +
              (notification.isRead ? 0 : 1),

            pagination: {
              ...currentData.pagination,
              total,
              totalPages,
              hasNextPage:
                currentData.pagination.page < totalPages,
            },
          }
        },
      )

      if (isNewNotification) {
        const audio = audioRef.current

        if (audio) {
          audio.currentTime = 0

          void audio.play().catch((error) => {
            console.warn(
              'Notification sound could not be played:',
              error,
            )
          })
        }

        toast.info(notification.title, {
          description: notification.message,
        })
      }
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('connect_error', handleConnectError)

    socket.io.on(
      'reconnect_attempt',
      handleReconnectAttempt,
    )

    socket.on(
      'notification:new',
      handleNotification,
    )

    setConnectionStatus('connecting')

    connectSocket()

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('connect_error', handleConnectError)

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