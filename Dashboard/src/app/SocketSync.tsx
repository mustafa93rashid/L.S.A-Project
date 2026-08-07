import { useEffect } from 'react'
import { toast } from 'sonner'
import { useSessionStore } from '@/stores/session.store'
import { useNotificationStore } from '@/stores/notification.store'
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket'
import type { NotificationEventPayload } from '@/features/notifications/types'

/**
 * Owns the Socket.IO connection's entire lifecycle, driven purely by
 * session state — mounted once in AppProviders, renders nothing (a
 * side-effect-only component). Connects only once authenticated; on sign-out
 * (or if the session is ever cleared for any reason — expiry, a 401, a
 * manual logout) it tears the connection down and wipes the notification
 * store, so nothing from one session leaks into the next.
 */
export function SocketSync() {
  const status = useSessionStore((state) => state.status)
  const addNotification = useNotificationStore((state) => state.addNotification)
  const setConnectionStatus = useNotificationStore((state) => state.setConnectionStatus)
  const resetNotifications = useNotificationStore((state) => state.reset)

  useEffect(() => {
    if (status !== 'authenticated') {
      disconnectSocket()
      resetNotifications()
      return
    }

    const socket = getSocket()

    const handleConnect = () => setConnectionStatus('connected')
    const handleDisconnect = () => setConnectionStatus('disconnected')
    const handleConnectError = () => setConnectionStatus('disconnected')
    const handleReconnectAttempt = () => setConnectionStatus('connecting')

    const handleNotification = (payload: NotificationEventPayload) => {
      if (!payload?.success || !payload.data) return

      const isNew = addNotification(payload.data)
      if (isNew) {
        toast.info(payload.data.title, { description: payload.data.message })
      }
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('connect_error', handleConnectError)
    socket.io.on('reconnect_attempt', handleReconnectAttempt)
    socket.on('notification:new', handleNotification)

    setConnectionStatus('connecting')
    connectSocket()

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('connect_error', handleConnectError)
      socket.io.off('reconnect_attempt', handleReconnectAttempt)
      socket.off('notification:new', handleNotification)
    }
  }, [status, addNotification, setConnectionStatus, resetNotifications])

  return null
}
