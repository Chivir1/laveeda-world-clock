/**
 * PWA install plumbing.
 *
 * Android/Chrome/desktop give us `beforeinstallprompt` and we can ask directly.
 * iOS Safari does not, so we detect it and show the Add-to-Home-Screen recipe
 * instead. Both paths end with the same "installed" state, detected via
 * display-mode so the hint disappears once the app lives on the home screen.
 */

import { useCallback, useEffect, useState } from 'react'

type BIPEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export type Platform = 'ios' | 'android' | 'desktop' | 'other'

export type InstallState = {
  canInstall: boolean
  platform: Platform
  installed: boolean
  standalone: boolean
  needsSafariHint: boolean
  promptInstall: () => Promise<'accepted' | 'dismissed' | 'unavailable'>
}

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'other'
  const ua = navigator.userAgent || ''
  const iosSafari =
    /iP(hone|ad|od)/.test(ua) ||
    (navigator.platform === 'MacIntel' && (navigator as unknown as { maxTouchPoints: number }).maxTouchPoints > 1)
  if (iosSafari) return 'ios'
  if (/Android/.test(ua)) return 'android'
  if (/Mobi|Tablet/.test(ua)) return 'other'
  return 'desktop'
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const nav = navigator as unknown as { standalone?: boolean }
  if (nav.standalone) return true
  const ua = navigator.userAgent || ''
  // iOS in home-screen mode reports no browser chrome at all.
  if (/iP(hone|ad|od)/.test(ua) && !/Safari/.test(ua)) return true
  try {
    if (typeof window.matchMedia !== 'function') return false
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: window-controls-overlay)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches
    )
  } catch {
    return false
  }
}

export function useInstall(): InstallState {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null)
  const [installed, setInstalled] = useState(() => isStandalone())
  const [platform] = useState<Platform>(() => detectPlatform())

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault()
      setDeferred(event as BIPEvent)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferred(null)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const promptInstall = useCallback<InstallState['promptInstall']>(async () => {
    if (!deferred) return 'unavailable'
    try {
      await deferred.prompt()
      const choice = await deferred.userChoice
      if (choice.outcome === 'accepted') setDeferred(null)
      return choice.outcome
    } catch {
      return 'unavailable'
    }
  }, [deferred])

  return {
    canInstall: Boolean(deferred),
    platform,
    installed,
    standalone: installed || isStandalone(),
    needsSafariHint: platform === 'ios' && !installed,
    promptInstall,
  }
}
