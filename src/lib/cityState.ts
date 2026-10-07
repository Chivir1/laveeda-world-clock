/**
 * Per-city derived state: local time, how far the day has run, where the sun is
 * and whether the place is asleep, working or awake.
 *
 * The sun solver is the only expensive part (a few hundred trig calls per
 * place), so daylight times are memoised per calendar day and the whole
 * snapshot per minute. A board of 40 cities therefore costs nothing on the
 * 1-second ticks.
 */

import type { City } from '../data/cities'
import { daySun, skyState, sunPosition, type Daylight, type Phase, sunPhase } from './sun'
import { DAY, dayProgress, localDayStart, zoneSnapshot, type ZoneSnapshot } from './time'

export type CityState = {
  city: City
  snap: ZoneSnapshot
  /** ms since local midnight in the city. */
  localMs: number
  /** 0…1 through the city's calendar day. */
  progress: number
  /** Calendar-day difference from the reference zone: -1, 0, +1… */
  dayDiff: number
  /** Signed offset difference vs the reference zone. */
  diffMs: number
  sun: Daylight
  altitudeDeg: number
  azimuthDeg: number
  phase: Phase
  sky: { label: string; dark: boolean }
  /** 'asleep' | 'awake' | 'working' — heuristic, based on the local clock. */
  activity: 'asleep' | 'awake' | 'working'
  /** Sun events expressed as hours on this place's own clock, for the dial. */
  day: {
    start: number
    sunriseH: number | null
    sunsetH: number | null
    dawnH: number | null
    duskH: number | null
    /** Minutes of daylight, or null at the poles. */
    lengthMin: number | null
  }
}

const daylightCache = new Map<string, { day: number; value: SunTable }>()
const stateCache = new Map<string, { key: number; value: CityState }>()

export type SunTable = { start: number } & Daylight

/**
 * Sun events for the city's own calendar day. Memoised per day: the solver is
 * exact enough to plan around and cheap enough to run offline, but not on
 * every animation frame.
 */
export function daylightFor(city: City, at: number): SunTable {
  const start = localDayStart(city.tz, at)
  const day = Math.floor(start / DAY)
  const hit = daylightCache.get(city.id)
  if (hit && hit.day === day) return hit.value
  const value: SunTable = { start, ...daySun(start, city.lat, city.lng) }
  if (daylightCache.size > 512) daylightCache.clear()
  daylightCache.set(city.id, { day, value })
  return value
}

/** ms instant → hours on the wall clock of that same local day. */
function asLocalHour(ms: number | null, start: number): number | null {
  return ms === null ? null : (ms - start) / 3_600_000
}

export function cityState(city: City, at: number, refTz: string): CityState {
  const minute = Math.floor(at / 60_000)
  const hit = stateCache.get(city.id)
  if (hit && hit.key === minute) return hit.value

  const snap = zoneSnapshot(city.tz, at)
  const refSnap = zoneSnapshot(refTz, at)
  const diffMs = snap.offsetMs - refSnap.offsetMs
  const localMs = snap.hour * 3_600_000 + snap.minute * 60_000 + snap.second * 1000
  const sun = daylightFor(city, at)
  const sunriseH = asLocalHour(sun.sunrise, sun.start)
  const sunsetH = asLocalHour(sun.sunset, sun.start)
  const pos = sunPosition(at, city.lat, city.lng)
  const sky = skyState(pos.altitude)
  const hourOfDay = snap.hour + snap.minute / 60
  const activity: CityState['activity'] =
    hourOfDay >= 9 && hourOfDay < 18 && snap.weekday >= 1 && snap.weekday <= 5
      ? 'working'
      : sky.dark || hourOfDay < 6 || hourOfDay >= 23
        ? 'asleep'
        : 'awake'

  const value: CityState = {
    city,
    snap,
    localMs,
    progress: dayProgress(city.tz, at),
    dayDiff: snap.epochDay - refSnap.epochDay,
    diffMs,
    sun,
    altitudeDeg: pos.altitude / (Math.PI / 180),
    azimuthDeg: (pos.azimuth / (Math.PI / 180) + 360) % 360,
    phase: sunPhase(pos.altitude),
    sky,
    activity,
    day: {
      start: sun.start,
      sunriseH: sunriseH,
      sunsetH: sunsetH,
      dawnH: asLocalHour(sun.dawn, sun.start),
      duskH: asLocalHour(sun.dusk, sun.start),
      lengthMin:
        sunriseH !== null && sunsetH !== null ? Math.round((sunsetH - sunriseH) * 60) : null,
    },
  }
  if (stateCache.size > 1024) stateCache.clear()
  stateCache.set(city.id, { key: minute, value })
  return value
}

/** Hours of the local day a place is awake-ish — used by the compare heat bar. */
export function activityAtHour(hour: number, weekday: number): 'work' | 'evening' | 'sleep' {
  if (hour >= 9 && hour < 18 && weekday >= 1 && weekday <= 5) return 'work'
  if (hour >= 6 && hour < 23) return 'evening'
  return 'sleep'
}

export function inWorkingHours(snap: ZoneSnapshot, workStart: number, workEnd: number, days: number[]): boolean {
  const minutes = snap.hour * 60 + snap.minute
  return minutes >= workStart && minutes < workEnd && days.includes(snap.weekday)
}
