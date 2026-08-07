import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

interface OpenCreateState {
  openCreate?: boolean
}

/**
 * Lets a navigation carry "and open your create dialog/drawer" as router
 * state, e.g. `navigate('/partners', { state: { openCreate: true } })` —
 * exactly what the command palette's "Create X" actions do (see
 * features/command-palette/registry.ts). `onOpen` is called once per
 * arrival with that state set, then the state entry is cleared via a
 * `replace` navigation so browser back/forward never re-triggers it.
 *
 * Only Users still uses this convention — every other module's Create
 * action now navigates straight to a dedicated `/new` route instead (see
 * the Create flow migration).
 */
export function useOpenCreateOnArrival(onOpen: () => void): void {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const state = location.state as OpenCreateState | null
    if (!state?.openCreate) return

    onOpen()
    navigate(location.pathname, { replace: true, state: null })
    // Only re-run when the router state itself changes — onOpen/navigate
    // are stable-enough callbacks from the caller's perspective and
    // re-running this on their identity would risk a loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state])
}
