import { create } from 'zustand'
import type { AuthUser } from '@/types/auth'

export type SessionStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated'

interface SessionState {
  user: AuthUser | null
  status: SessionStatus
  setUser: (user: AuthUser) => void
  setStatus: (status: SessionStatus) => void
  clearSession: () => void
}

/**
 * Session/auth client state only — no API calls live here. Hydrating this
 * from `GET /auth/me` on boot, and wiring login/logout/refresh, happens in
 * the Authentication & Authorization phase.
 */
export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  status: 'idle',
  setUser: (user) => set({ user, status: 'authenticated' }),
  setStatus: (status) => set({ status }),
  clearSession: () => set({ user: null, status: 'unauthenticated' }),
}))
