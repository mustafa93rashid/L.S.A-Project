import { create } from 'zustand'
import type { AppNotification } from '@/features/notifications/types'

export type SocketConnectionStatus = 'disconnected' | 'connecting' | 'connected'

/** Bounds memory for a long-running session — the backend has no history
 * endpoint (nothing to page against), so this list only ever grows from
 * live events; oldest entries are dropped past this count. */
const MAX_NOTIFICATIONS = 50

interface NotificationState {
  notifications: AppNotification[]
  unreadCount: number
  connectionStatus: SocketConnectionStatus
  /** Returns whether the notification was actually new (false = duplicate,
   * already present by `_id` — the socket layer's duplicate-event guard). */
  addNotification: (notification: AppNotification) => boolean
  /** Client-side only — the backend has no mark-as-read endpoint or event,
   * so this never reaches the server and does not persist across reloads.
   * Intentional per the phase requirement: only wire real persistence if
   * the backend actually supports it. */
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  setConnectionStatus: (status: SocketConnectionStatus) => void
  /** Full reset on logout — safe cleanup, no notification data or
   * connection state survives a signed-out session. */
  reset: () => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  connectionStatus: 'disconnected',

  addNotification: (notification) => {
    let wasAdded = false

    set((state) => {
      if (state.notifications.some((existing) => existing._id === notification._id)) {
        return state
      }

      wasAdded = true

      const notifications = [notification, ...state.notifications].slice(
        0,
        MAX_NOTIFICATIONS,
      )

      return {
        notifications,
        unreadCount: state.unreadCount + 1,
      }
    })

    return wasAdded
  },

  markAsRead: (id) =>
    set((state) => {
      const target = state.notifications.find((n) => n._id === id)
      if (!target || target.isRead) return state

      return {
        notifications: state.notifications.map((n) =>
          n._id === id ? { ...n, isRead: true } : n,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }
    }),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),

  setConnectionStatus: (status) => set({ connectionStatus: status }),

  reset: () =>
    set({ notifications: [], unreadCount: 0, connectionStatus: 'disconnected' }),
}))
