/**
 * Display formatting. Deliberately locale-driven where a locale exists
 * (`Intl`), and hand-rolled where a clock needs tabular digits that must not
 * jump around between frames.
 */

import { offsetLabel, weekdayName, type ZoneSnapshot } from './time'

export type ClockStyle = { hour12: boolean; seconds: boolean }

const fmtCache = new Map<string, Intl.DateTimeFormat>()

/**
 * Intl takes a locale *list*, not a comma-joined string — passing the latter
 * throws a RangeError. Keep the array and let the runtime negotiate.
 */
function localeList(): string[] | undefined {
  if (typeof navigator === 'undefined') return undefined
  const langs = Array.isArray(navigator.languages) && navigator.languages.length
    ? [...navigator.languages]
    : navigator.language
      ? [navigator.language]
      : []
  return langs.length ? langs : undefined
}

function cachedFormatter(key: string, build: () => Intl.DateTimeFormat): Intl.DateTimeFormat {
  let fmt = fmtCache.get(key)
  if (!fmt) {
    fmt = build()
    fmtCache.set(key, fmt)
  }
  return fmt
}

export type DigitalTime = { hours: string; minutes: string; seconds: string; suffix: string }

export function digital(snap: ZoneSnapshot, style: ClockStyle): DigitalTime {
  const h24 = snap.hour
  const suffix = style.hour12 ? (h24 >= 12 ? 'PM' : 'AM') : ''
  let hours = h24
  if (style.hour12) {
    hours = h24 % 12 === 0 ? 12 : h24 % 12
  }
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
  return {
    hours: style.hour12 ? `${hours}` : pad(hours),
    minutes: pad(snap.minute),
    seconds: pad(snap.second),
    suffix,
  }
}

export function dateLine(tz: string, at: number, variant: 'short' | 'long' | 'weekday' = 'short'): string {
  const loc = localeList()
  const opts: Intl.DateTimeFormatOptions =
    variant === 'long'
      ? { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: tz }
      : variant === 'weekday'
        ? { weekday: 'long', timeZone: tz }
        : { weekday: 'short', day: 'numeric', month: 'short', timeZone: tz }
  return cachedFormatter(`${loc}|${variant}|${tz}`, () => new Intl.DateTimeFormat(loc as never, opts)).format(at)
}

export function monthDay(tz: string, at: number): string {
  const loc = localeList()
  return cachedFormatter(`${loc}|md|${tz}`, () =>
    new Intl.DateTimeFormat(loc as never, { month: 'short', day: 'numeric', timeZone: tz }),
  ).format(at)
}

/** 'today' / 'tomorrow' / 'in 3 days' / '6 days ago' */
export function relativeDay(dayDiff: number): string {
  if (dayDiff === 0) return 'today'
  if (dayDiff === 1) return 'tomorrow'
  if (dayDiff === -1) return 'yesterday'
  return dayDiff > 0 ? `in ${dayDiff} days` : `${-dayDiff} days ago`
}

export function dayBadge(dayDiff: number): string {
  if (dayDiff === 0) return ''
  return dayDiff > 0 ? `+${dayDiff}d` : `${dayDiff}d`
}

export function hourAxisLabel(hour: number, hour12: boolean): string {
  if (!hour12) return `${hour}`.padStart(2, '0')
  const suffix = hour >= 12 ? 'p' : 'a'
  const h = hour % 12 === 0 ? 12 : hour % 12
  return `${h}${suffix}`
}

export function hour24FromLabel(hour: number, hour12: boolean): string {
  if (!hour12) return `${hour}`.padStart(2, '0')
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const h = hour % 12 === 0 ? 12 : hour % 12
  return `${h} ${suffix}`
}

export function weekdayShort(i: number): string {
  return weekdayName(i)
}

/** '4h 20m' for a span of ms (always positive here). */
export function duration(ms: number): string {
  const total = Math.round(Math.abs(ms) / 60_000)
  const h = Math.floor(total / 60)
  const m = total % 60
  if (!h) return `${m} min`
  if (!m) return `${h} hr`
  return `${h}h ${m}m`
}

export function offsetShort(ms: number): string {
  return offsetLabel(ms, '')
}

export function timeRange(label: string, minuteOfDay: number, hour12: boolean): string {
  const h = Math.floor(minuteOfDay / 60)
  const m = minuteOfDay % 60
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
  if (hour12) {
    const suffix = h >= 12 ? 'pm' : 'am'
    const hh = h % 12 === 0 ? 12 : h % 12
    return `${label} ${hh}:${pad(m)}${suffix}`
  }
  return `${label} ${pad(h)}:${pad(m)}`
}
