import { useCallback, useEffect, useRef } from 'react'
import { useBlocker } from 'react-router-dom'

interface UnsavedChangesGuard {
  /** True while an in-app navigation attempt is being held back — render a
   * confirm dialog bound to this. */
  isBlocked: boolean
  /** User chose to discard changes and leave. */
  confirmLeave: () => void
  /** User chose to stay on the page. */
  cancelLeave: () => void
  /** Call synchronously right before a programmatic `navigate()` that must
   * never be intercepted — e.g. routing back to the list after a
   * successful create/update, once the form is technically still "dirty"
   * by react-hook-form's bookkeeping. */
  bypassOnce: () => void
}

/**
 * One shared dirty-form guard for every Create/Edit page (see the Create
 * flow migration — Categories, Equipment, Jobs, Journeys, Partners, Team
 * Members, Services, Projects all use this identically instead of each
 * re-implementing its own discard-confirm).
 *
 * Combines two mechanisms so "unsaved changes" protection holds regardless
 * of how the user tries to leave:
 * - `useBlocker` intercepts in-app navigation (Cancel button, sidebar
 *   links, browser back/forward) — only works with a data router
 *   (createBrowserRouter), which this app uses.
 * - `beforeunload` catches a full page close/refresh/URL bar navigation,
 *   which `useBlocker` cannot see.
 *
 * `isDirty` is read through a ref inside the blocker predicate rather than
 * captured by value, so a same-tick `bypassOnce()` call right before
 * `navigate()` is always honored even if React hasn't re-rendered (and
 * thus re-registered the predicate) yet.
 */
export function useUnsavedChangesGuard(isDirty: boolean): UnsavedChangesGuard {
  const isDirtyRef = useRef(isDirty)
  isDirtyRef.current = isDirty
  const bypassRef = useRef(false)

  const shouldBlock = useCallback(
    ({
      currentLocation,
      nextLocation,
    }: {
      currentLocation: { pathname: string }
      nextLocation: { pathname: string }
    }) =>
      isDirtyRef.current &&
      !bypassRef.current &&
      currentLocation.pathname !== nextLocation.pathname,
    [],
  )

  const blocker = useBlocker(shouldBlock)

  useEffect(() => {
    if (!isDirty) return
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  return {
    isBlocked: blocker.state === 'blocked',
    confirmLeave: () => {
      if (blocker.state === 'blocked') blocker.proceed()
    },
    cancelLeave: () => {
      if (blocker.state === 'blocked') blocker.reset()
    },
    bypassOnce: () => {
      bypassRef.current = true
    },
  }
}
