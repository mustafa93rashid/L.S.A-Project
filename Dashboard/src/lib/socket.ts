import { io, type Socket } from 'socket.io-client'
import { env } from '@/lib/env'

let socket: Socket | null = null

/**
 * The single shared Socket.IO connection for the whole app — never call
 * `io(...)` anywhere else. `env.socketUrl` is normally unset, meaning
 * same-origin (see env.ts): the socket handshake's auth cookie is scoped to
 * whichever origin the browser thinks it's talking to, exactly like the
 * REST API, so `withCredentials: true` + same-origin is what actually lets
 * the backend's cookie-based socket auth (added specifically to support
 * this dashboard) receive the httpOnly `accessToken` cookie at all.
 *
 * `autoConnect: false` — connection is driven entirely by session state
 * (see app/SocketSync.tsx), not by module import time, since there's no
 * point holding a socket open before the user is authenticated.
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(env.socketUrl, {
      withCredentials: true,
      autoConnect: false,
      // Polling first, then upgrade — verified live that starting with
      // `websocket` directly can fail to carry the auth cookie through a
      // proxy (the initial HTTP polling handshake is what reliably carries
      // it); this is also plain Socket.IO's own default transport order.
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

/** Full teardown, not just `.disconnect()` — also drops every listener
 * `SocketSync` attached, so a subsequent login doesn't double-register
 * handlers on the same underlying socket instance. */
export function disconnectSocket(): void {
  if (!socket) return
  socket.removeAllListeners()
  socket.disconnect()
}
