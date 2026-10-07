/**
 * Laveeda time engine.
 *
 * Every number here comes from the runtime's own IANA tz database through
 * `Intl`, so offsets, DST rules and abbreviations are exactly as current as the
 * browser's tz data — no lookup tables to keep in sync, no API calls, and it all
 * works offline.
 */

export type ZoneSnapshot = {
  tz: string
  /** 1970-01-01 counted in the zone's own calendar (used for "tomorrow" chips). */
  epochDay: number
  year: number
  /** 1-12 */
  month: number
  /** 1-31 */
  day: number
  /** 0-23 */
  hour: number
  minute: number
  second: number
  /** 0 = Sunday … 6 = Saturday */
  weekday: number
  /** ms to add to UTC to get local wall time in this zone. */
  offsetMs: number
  /** True when the zone is currently ahead of its own minimum offset. */
  dst: boolean
  abbrev: string
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MINUTE = 60_000
const HOUR = 3_600_000
export const DAY = 86_400_000

const partsFmtCache = new Map<string, Intl.DateTimeFormat>()
const nameFmtCache = new Map<string, Intl.DateTimeFormat>()
/** tz → last computed offset, valid for the minute bucket it was computed in. */
const offsetCache = new Map<string, { bucket: number; offsetMs: number }>()
const stdOffsetCache = new Map<string, { year: number; offsetMs: number }>()
const abbrevCache = new Map<string, { bucket: number; value: string }>()
const snapshotCache = new Map<string, { key: string; value: ZoneSnapshot }>()

function partsFormatter(tz: string): Intl.DateTimeFormat {
  let fmt = partsFmtCache.get(tz)
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      hourCycle: 'h23',
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    partsFmtCache.set(tz, fmt)
  }
  return fmt
}

function nameFormatter(tz: string, style: 'short' | 'shortOffset'): Intl.DateTimeFormat {
  const key = `${tz}|${style}`
  let fmt = nameFmtCache.get(key)
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: '2-digit',
      timeZoneName: style,
    })
    nameFmtCache.set(key, fmt)
  }
  return fmt
}

function readParts(tz: string, at: number) {
  const parts = partsFormatter(tz).formatToParts(at)
  let year = 1970
  let month = 1
  let day = 1
  let hour = 0
  let minute = 0
  let second = 0
  let weekday = 0
  for (const p of parts) {
    switch (p.type) {
      case 'year':
        year = +p.value
        break
      case 'month':
        month = +p.value
        break
      case 'day':
        day = +p.value
        break
      case 'hour':
        hour = +p.value === 24 ? 0 : +p.value
        break
      case 'minute':
        minute = +p.value
        break
      case 'second':
        second = +p.value
        break
      case 'weekday':
        weekday = Math.max(0, WEEKDAYS.indexOf(p.value.slice(0, 3)))
        break
      default:
        break
    }
  }
  return { year, month, day, hour, minute, second, weekday }
}

/** Offset (ms) of `tz` at instant `at`. Memoised per minute bucket. */
export function zoneOffsetMs(tz: string, at: number): number {
  const bucket = Math.floor(at / MINUTE)
  const hit = offsetCache.get(tz)
  if (hit && hit.bucket === bucket) return hit.offsetMs

  const p = readParts(tz, at)
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  const offsetMs = asUtc - Math.floor(at / 1000) * 1000
  if (offsetCache.size > 2048) offsetCache.clear()
  offsetCache.set(tz, { bucket, offsetMs })
  return offsetMs
}

/**
 * The zone's smallest annual offset — its "standard time". Two zones in the
 * same hour band differ in whether they ever spring forward, and this is what
 * lets us say "DST now" honestly.
 */
export function standardOffsetMs(tz: string, at: number): number {
  const year = readParts(tz, at).year
  const hit = stdOffsetCache.get(tz)
  if (hit && hit.year === year) return hit.offsetMs
  const jan = zoneOffsetMs(tz, Date.UTC(year, 0, 15, 12))
  const jul = zoneOffsetMs(tz, Date.UTC(year, 6, 15, 12))
  const value = Math.min(jan, jul)
  stdOffsetCache.set(tz, { year, offsetMs: value })
  return value
}

export function zoneSnapshot(tz: string, at: number): ZoneSnapshot {
  const bucket = Math.floor(at / 1000)
  const key = `${tz}:${bucket}`
  const cached = snapshotCache.get(tz)
  if (cached && cached.key === key) return cached.value

  const p = readParts(tz, at)
  const offsetMs = zoneOffsetMs(tz, at)
  const abbrev = zoneAbbrev(tz, at)
  const value: ZoneSnapshot = {
    tz,
    epochDay: Math.round(Date.UTC(p.year, p.month - 1, p.day) / DAY),
    year: p.year,
    month: p.month,
    day: p.day,
    hour: p.hour,
    minute: p.minute,
    second: p.second,
    weekday: p.weekday,
    offsetMs,
    dst: offsetMs > standardOffsetMs(tz, at),
    abbrev,
  }
  if (snapshotCache.size > 1024) snapshotCache.clear()
  snapshotCache.set(tz, { key, value })
  return value
}

/** 'JST', 'GMT+5:30' (when no abbreviation exists), '-' if the runtime has none. */
function zoneAbbrev(tz: string, at: number): string {
  const bucket = Math.floor(at / HOUR)
  const hit = abbrevCache.get(tz)
  if (hit && hit.bucket === bucket) return hit.value
  let value = ''
  try {
    const parts = nameFormatter(tz, 'short').formatToParts(at)
    value = parts.find((p) => p.type === 'timeZoneName')?.value ?? ''
  } catch {
    value = ''
  }
  if (value === 'GMT' || !value) {
    try {
      value =
        nameFormatter(tz, 'shortOffset').formatToParts(at).find((p) => p.type === 'timeZoneName')
          ?.value ?? 'GMT'
    } catch {
      value = 'GMT'
    }
  }
  if (abbrevCache.size > 1024) abbrevCache.clear()
  abbrevCache.set(tz, { bucket, value })
  return value
}

/** Seconds since local midnight in `tz`. */
export function localDaySeconds(tz: string, at: number): number {
  const s = zoneSnapshot(tz, at)
  return s.hour * 3600 + s.minute * 60 + s.second
}

/** 0…1 — how far this zone's calendar day has run. */
export function dayProgress(tz: string, at: number): number {
  return localDaySeconds(tz, at) / 86400
}

/** Signed 'UTC+5:30' style label for an offset. */
export function offsetLabel(ms: number, prefix = 'UTC'): string {
  const totalMinutes = Math.round(ms / MINUTE)
  const sign = totalMinutes < 0 ? '−' : '+'
  const abs = Math.abs(totalMinutes)
  const h = Math.floor(abs / 60)
  const m = abs % 60
  return `${prefix}${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** '-5h 30m', '+2h', 'same' — the gap between two zones. */
export function diffLabel(ms: number): string {
  const total = Math.round(ms / MINUTE)
  if (total === 0) return 'same time'
  const sign = total < 0 ? '−' : '+'
  const abs = Math.abs(total)
  const h = Math.floor(abs / 60)
  const m = abs % 60
  if (!h) return `${sign}${m}m`
  return `${sign}${h}h${m ? ` ${m}m` : ''}`
}

export function offsetMinutes(ms: number): number {
  return Math.round(ms / MINUTE)
}

/** Start of the calendar day (UTC instant) that `tz` is living through at `at`. */
export function localDayStart(tz: string, at: number): number {
  const p = readParts(tz, at)
  const naive = Date.UTC(p.year, p.month - 1, p.day)
  const refined = naive - zoneOffsetMs(tz, naive)
  const twice = naive - zoneOffsetMs(tz, refined)
  return twice
}

/** Turn a wall-clock time in `tz` into a UTC instant (used by the compare ruler). */
export function zonedTimeToUtc(tz: string, year: number, month: number, day: number, hour: number, minute = 0): number {
  const naive = Date.UTC(year, month - 1, day, hour, minute)
  const guess = naive - zoneOffsetMs(tz, naive)
  return naive - zoneOffsetMs(tz, guess)
}

export type Transition = { at: number; from: number; to: number; gains: boolean }

const transitionCache = new Map<string, { day: number; value: Transition | null }>()

/**
 * Next UTC-offset change for a zone, found by walking the calendar and then
 * bisecting inside the day that flips. Offsets only move at whole minutes, so
 * a minute-resolution bisection is exact for civil timekeeping.
 */
export function nextTransition(tz: string, from: number, horizonDays = 430): Transition | null {
  const today = Math.floor(from / DAY)
  const hit = transitionCache.get(tz)
  if (hit && hit.day === today) return hit.value

  const start = from - (from % MINUTE)
  let prev = zoneOffsetMs(tz, start)
  let found: Transition | null = null
  for (let d = 1; d <= horizonDays && !found; d++) {
    const probe = start + d * DAY
    const cur = zoneOffsetMs(tz, probe)
    if (cur !== prev) {
      let lo = probe - DAY
      let hi = probe
      while (hi - lo > MINUTE) {
        const mid = Math.floor((lo + hi) / 2 / MINUTE) * MINUTE
        if (zoneOffsetMs(tz, mid) === prev) lo = mid
        else hi = mid
      }
      found = { at: hi, from: prev, to: cur, gains: cur > prev }
    }
    prev = cur
  }
  if (transitionCache.size > 1024) transitionCache.clear()
  transitionCache.set(tz, { day: today, value: found })
  return found
}

/** Does this zone ever change its clocks? */
export function observesDst(tz: string, at: number): boolean {
  const year = readParts(tz, at).year
  const jan = zoneOffsetMs(tz, Date.UTC(year, 2, 15, 12))
  const mid = zoneOffsetMs(tz, Date.UTC(year, 5, 15, 12))
  const oct = zoneOffsetMs(tz, Date.UTC(year, 9, 15, 12))
  const dec = zoneOffsetMs(tz, Date.UTC(year, 11, 15, 12))
  return new Set([jan, mid, oct, dec]).size > 1
}

/** Every IANA zone this runtime knows about (with a small bundled fallback). */
export function listZones(fallback: readonly string[]): string[] {
  const fn = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf
  if (typeof fn === 'function') {
    try {
      const zones = fn('timeZone')
      if (zones.length > 50) return zones
    } catch {
      /* fall through to the bundled list */
    }
  }
  return [...fallback]
}

export function isValidZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

export function weekdayName(i: number): string {
  return WEEKDAYS[i] ?? 'Mon'
}
