/**
 * Sun, without a weather API.
 *
 * Low-precision solar position (the classic NOAA/SunCalc formulation) plus a
 * sampling solver for sunrise and sunset. Sampling instead of an analytic
 * solve costs a few hundred trig calls and gets us polar day and polar night
 * for free — the solver just finds no crossing and says so.
 */

const RAD = Math.PI / 180
const DAY_MS = 86_400_000
const J1970 = 2440588
const J2000 = 2451545
const OBLIQUITY = RAD * 23.4397
/** Sunrise/sunset depression: 0.833° of refraction + solar semi-diameter. */
const HORIZON = RAD * -0.833

const sin = Math.sin
const cos = Math.cos
const tan = Math.tan
const asin = Math.asin
const atan2 = Math.atan2

function toDays(ms: number): number {
  return ms / DAY_MS - 0.5 + J1970 - J2000
}

function solarMeanAnomaly(d: number): number {
  return RAD * (357.5291 + 0.98560028 * d)
}

function eclipticLongitude(M: number): number {
  const C = RAD * (1.9148 * sin(M) + 0.02 * sin(2 * M) + 0.0003 * sin(3 * M))
  const P = RAD * 102.9372
  return M + C + P + Math.PI // +180°: the Sun's longitude is opposite the Earth's anomaly
}

export type SunPosition = {
  /** Radians above (positive) or below (negative) the true horizon. */
  altitude: number
  /** Radians clockwise from due north. */
  azimuth: number
  declination: number
}

export function sunPosition(ms: number, lat: number, lng: number): SunPosition {
  const d = toDays(ms)
  const lw = -lng * RAD
  const phi = lat * RAD
  const M = solarMeanAnomaly(d)
  const L = eclipticLongitude(M)
  const dec = asin(sin(L) * sin(OBLIQUITY))
  const ra = atan2(sin(L) * cos(OBLIQUITY), cos(L))
  const H = RAD * (280.16 + 360.9856235 * d) - lw - ra
  const altitude = asin(sin(phi) * sin(dec) + cos(phi) * cos(dec) * cos(H))
  const azimuthFromSouth = atan2(sin(H), cos(H) * sin(phi) - tan(dec) * cos(phi))
  return { altitude, azimuth: azimuthFromSouth + Math.PI, declination: dec }
}

export function solarAltitude(ms: number, lat: number, lng: number): number {
  return sunPosition(ms, lat, lng).altitude
}

export type Daylight = {
  sunrise: number | null
  sunset: number | null
  solarNoon: number
  /** Civil twilight (sun 6° down) — the "blue hour" bookends. */
  dawn: number | null
  dusk: number | null
  polar: 'day' | 'night' | null
}

function crossing(
  dayStart: number,
  lat: number,
  lng: number,
  target: number,
  rising: boolean,
): number | null {
  // Walk the day in 12-minute steps, then bisect the bracket we landed in.
  const step = 12 * 60_000
  let prev = solarAltitude(dayStart, lat, lng) - target
  for (let t = step; t <= DAY_MS; t += step) {
    const cur = solarAltitude(dayStart + t, lat, lng) - target
    const crossed = rising ? prev < 0 && cur >= 0 : prev >= 0 && cur < 0
    if (crossed) {
      let lo = dayStart + t - step
      let hi = dayStart + t
      while (hi - lo > 1000) {
        const mid = (lo + hi) / 2
        const v = solarAltitude(mid, lat, lng) - target
        const goRight = rising ? v < 0 : v >= 0
        if (goRight) lo = mid
        else hi = mid
      }
      return Math.round(hi)
    }
    prev = cur
  }
  return null
}

/**
 * Sun events for the local day that starts at `dayStart` (a UTC instant equal
 * to that place's calendar midnight). Times come back as UTC instants.
 */
export function daySun(dayStart: number, lat: number, lng: number): Daylight {
  const noonGuess = dayStart + DAY_MS / 2
  // Solar noon: the altitude maximum, located by the same sampling trick.
  let solarNoon = noonGuess
  let best = -Infinity
  for (let t = -6 * 3600_000; t <= 6 * 3600_000; t += 5 * 60_000) {
    const alt = solarAltitude(noonGuess + t, lat, lng)
    if (alt > best) {
      best = alt
      solarNoon = noonGuess + t
    }
  }
  const sunrise = crossing(dayStart, lat, lng, HORIZON, true)
  const sunset = crossing(dayStart, lat, lng, HORIZON, false)
  const civil = RAD * -6
  const dawn = crossing(dayStart, lat, lng, civil, true)
  const dusk = crossing(dayStart, lat, lng, civil, false)
  let polar: Daylight['polar'] = null
  if (best > HORIZON && sunrise === null && sunset === null) polar = 'day'
  else if (best <= HORIZON && sunrise === null && sunset === null) polar = 'night'
  return { sunrise, sunset, solarNoon, dawn, dusk, polar }
}

/** Coarse sky state used to tint the background: drives the ambient gradient. */
export type Phase = 'night' | 'twilight' | 'golden' | 'day'

export function sunPhase(alt: number): Phase {
  const deg = alt / RAD
  if (deg >= 8) return 'day'
  if (deg > 0) return 'golden'
  if (deg > -6) return 'twilight'
  return 'night'
}

/** Human label + sun height in degrees. */
export function skyState(alt: number): { label: string; degrees: number; dark: boolean } {
  const degrees = alt / RAD
  let label: string
  if (degrees >= 55) label = 'High sun'
  else if (degrees >= 25) label = 'Daylight'
  else if (degrees >= 8) label = 'Low sun'
  else if (degrees >= 0) label = 'Golden hour'
  else if (degrees > -6) label = 'Blue hour'
  else if (degrees > -18) label = 'Twilight'
  else label = 'Night'
  return { label, degrees, dark: degrees < -0.833 }
}
