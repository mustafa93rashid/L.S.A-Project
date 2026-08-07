import { useEffect, useState } from 'react'

/** Delays reflecting `value` until it's stopped changing for `delayMs` —
 * used by SearchInput so every keystroke doesn't fire a new query. */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timeout)
  }, [value, delayMs])

  return debounced
}
