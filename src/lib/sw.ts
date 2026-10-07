/**
 * A 40-line bridge between the service worker (registered in main.tsx) and the
 * React tree, so the app can offer "update available" instead of silently
 * serving a stale shell forever.
 */

import { useSyncExternalStore } from 'react'

export type SwState = {
  updateReady: boolean
  offlineReady: boolean
  controlled: boolean
}

let state: SwState = {
  updateReady: false,
  offlineReady: false,
  controlled:
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    Boolean(navigator.serviceWorker.controller),
}

const listeners = new Set<() => void>()
let updateSW: ((reloadPage?: boolean) => Promise<void>) | null = null

function set(patch: Partial<SwState>) {
  state = { ...state, ...patch }
  for (const listener of listeners) listener()
}

export function bindUpdateSW(fn: (reloadPage?: boolean) => Promise<void>): void {
  updateSW = fn
}

export function setUpdateReady(value: boolean): void {
  set({ updateReady: value })
}

export function setOfflineReady(value: boolean): void {
  set({ offlineReady: value })
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => void listeners.delete(listener)
}

export function useSw(): SwState {
  return useSyncExternalStore(subscribe, () => state, () => state)
}

export async function applyUpdate(): Promise<void> {
  if (updateSW) await updateSW(true)
  else window.location.reload()
}
