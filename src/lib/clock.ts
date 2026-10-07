/**
 * One heartbeat for the whole app.
 *
 * Three channels tick at the rate their consumers actually need: `smooth`
 * (rAF, throttled) for analog hands, `second` for digits, `minute` for
 * daylight/background work. When the tab is hidden the loop stops and a 1s
 * timer keeps the coarse channels honest, so a phone sitting in a pocket
 * burns nothing.
 */

export type ClockChannel = 'smooth' | 'second' | 'minute'

type ChannelState = { value: number; subs: Set<() => void> }

const channels: Record<ClockChannel, ChannelState> = {
  smooth: { value: 0, subs: new Set() },
  second: { value: 0, subs: new Set() },
  minute: { value: 0, subs: new Set() },
}

let raf = 0
let idleTimer: ReturnType<typeof setInterval> | null = null
let lastSecond = -1
let lastMinute = -1
let lastSmooth = 0

// Seed the channels synchronously: a snapshot value must never be `undefined`
// (or worse, computed on demand) or React's external-store contract breaks.
{
  const seed = Date.now()
  channels.smooth.value = seed
  channels.second.value = Math.floor(seed / 1000) * 1000
  channels.minute.value = Math.floor(seed / 60_000) * 60_000
  lastSecond = Math.floor(seed / 1000)
  lastMinute = Math.floor(seed / 60_000)
}

export function clockValue(channel: ClockChannel): number {
  return channels[channel].value
}

const SMOOTH_INTERVAL = 33 // ms — ~30fps is plenty for a sweeping hand

function publish(name: ClockChannel, value: number) {
  const ch = channels[name]
  if (ch.value === value) return
  ch.value = value
  for (const cb of ch.subs) cb()
}

function stamp() {
  const now = Date.now()
  if (now - lastSmooth >= SMOOTH_INTERVAL) {
    lastSmooth = now
    publish('smooth', now)
  }
  const sec = Math.floor(now / 1000)
  if (sec !== lastSecond) {
    lastSecond = sec
    publish('second', sec * 1000)
    const min = Math.floor(sec / 60)
    if (min !== lastMinute) {
      lastMinute = min
      publish('minute', min * 60_000)
    }
  }
  raf = requestAnimationFrame(stamp)
}

function start() {
  if (!raf) raf = requestAnimationFrame(stamp)
}

function stopRaf() {
  if (raf) cancelAnimationFrame(raf)
  raf = 0
}

function ensureIdleTimer() {
  if (idleTimer || typeof setInterval === 'undefined') return
  idleTimer = setInterval(() => {
    const now = Date.now()
    publish('smooth', now)
    const sec = Math.floor(now / 1000)
    if (sec !== lastSecond) {
      lastSecond = sec
      publish('second', sec * 1000)
      const min = Math.floor(sec / 60)
      if (min !== lastMinute) {
        lastMinute = min
        publish('minute', min * 60_000)
      }
    }
  }, 1000)
}

function dropIdleTimer() {
  if (idleTimer) clearInterval(idleTimer)
  idleTimer = null
}

function anySubscribers(): boolean {
  return channels.smooth.subs.size + channels.second.subs.size + channels.minute.subs.size > 0
}

export function subscribeClock(channel: ClockChannel, cb: () => void): () => void {
  const ch = channels[channel]
  ch.subs.add(cb)
  if (typeof document !== 'undefined') {
    if (document.hidden) ensureIdleTimer()
    else {
      dropIdleTimer()
      start()
    }
  } else {
    start()
  }
  return () => {
    ch.subs.delete(cb)
    if (!anySubscribers()) {
      stopRaf()
      dropIdleTimer()
    }
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopRaf()
      if (anySubscribers()) ensureIdleTimer()
    } else {
      dropIdleTimer()
      if (anySubscribers()) start()
    }
  })
}

export function nowMs(): number {
  return Date.now()
}
