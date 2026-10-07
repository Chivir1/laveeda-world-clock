import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { clockValue, subscribeClock, type ClockChannel } from '../lib/clock'

/** Re-render with the heartbeat of your choice. */
export function useClock(channel: ClockChannel = 'second'): number {
  const subscribe = useCallback((cb: () => void) => subscribeClock(channel, cb), [channel])
  return useSyncExternalStore(subscribe, () => clockValue(channel), () => clockValue(channel))
}

export function useMediaQuery(query: string): boolean {
  const read = () => {
    try {
      return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia(query).matches
        : false
    } catch {
      return false
    }
  }
  const [matches, setMatches] = useState(read)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia(query)
    const onChange = () => setMatches(read())
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])
  return matches
}

export function usePrefersDark(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)')
}

/** Lock body scrolling while an overlay is open, without layout jump. */
export function useScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked || typeof document === 'undefined') return
    const { overflow, paddingRight } = document.body.style
    const gap = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    if (gap > 0) document.body.style.paddingRight = `${gap}px`
    return () => {
      document.body.style.overflow = overflow
      document.body.style.paddingRight = paddingRight
    }
  }, [locked])
}

export function useEvent<T extends (...args: never[]) => unknown>(handler: T): T {
  const ref = useRef(handler)
  useEffect(() => {
    ref.current = handler
  })
  return useCallback(((...args: Parameters<T>) => ref.current(...args)) as T, [])
}
