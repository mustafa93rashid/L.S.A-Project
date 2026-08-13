import { create } from 'zustand'

export type SocketConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'

interface NotificationState {
  connectionStatus: SocketConnectionStatus

  setConnectionStatus: (
    status: SocketConnectionStatus,
  ) => void

  reset: () => void
}

export const useNotificationStore =
  create<NotificationState>((set) => ({
    connectionStatus: 'disconnected',

    setConnectionStatus: (status) =>
      set({
        connectionStatus: status,
      }),

    reset: () =>
      set({
        connectionStatus: 'disconnected',
      }),
  }))