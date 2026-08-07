import { useEffect, useState } from 'react'

/** Current time, re-rendering once a minute, aligned to the minute
 * boundary — never every second, since nothing built on this displays
 * seconds. Reads the browser's own local clock; no timezone override. */
export function useCurrentTime(): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined

    const msUntilNextMinute = 60_000 - (Date.now() % 60_000)
    const timeout = setTimeout(() => {
      setNow(new Date())
      interval = setInterval(() => setNow(new Date()), 60_000)
    }, msUntilNextMinute)

    return () => {
      clearTimeout(timeout)
      if (interval) clearInterval(interval)
    }
  }, [])

  return now
}
