import { io, type Socket } from 'socket.io-client'
import { env } from '@/lib/env'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io(env.socketUrl, {
      withCredentials: true,
      autoConnect: false,

      transports: ['polling', 'websocket'],

      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    })
  }

  return socket
}

export function connectSocket(): void {
  const activeSocket = getSocket()

  if (!activeSocket.connected) {
    activeSocket.connect()
  }
}

export function disconnectSocket(): void {
  if (!socket) return

  socket.removeAllListeners()
  socket.disconnect()
}