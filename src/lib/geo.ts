/**
 * Geography helpers: what zone is this device in, which city is closest to a
 * GPS fix, and how to say an IANA zone id like a human.
 */

import { CITIES, CITIES_BY_ZONE, type City } from '../data/cities'

export function deviceZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

export function deviceLocale(): string {
  try {
    return navigator.language || 'en-GB'
  } catch {
    return 'en-GB'
  }
}

export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371
  const dLat = ((bLat - aLat) * Math.PI) / 180
  const dLng = ((bLng - aLng) * Math.PI) / 180
  const lat1 = (aLat * Math.PI) / 180
  const lat2 = (bLat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function nearestCity(lat: number, lng: number): { city: City; km: number } | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  let best: City | null = null
  let bestKm = Infinity
  for (const c of CITIES) {
    const km = haversineKm(lat, lng, c.lat, c.lng)
    if (km < bestKm) {
      bestKm = km
      best = c
    }
  }
  return best ? { city: best, km: Math.round(bestKm) } : null
}

/** The largest place the runtime says lives in this zone. */
export function flagshipCityForZone(tz: string): City | undefined {
  const list = CITIES_BY_ZONE[tz]
  if (list?.length) return list[0]
  return CITIES.find((c) => c.tz === tz)
}

const REGION_PREFIX: Record<string, string> = {
  Africa: 'Africa',
  America: 'Americas',
  Antarctica: 'Antarctica',
  Arctic: 'Arctic',
  Asia: 'Asia',
  Atlantic: 'Atlantic',
  Australia: 'Australia',
  Europe: 'Europe',
  Indian: 'Indian Ocean',
  Pacific: 'Pacific',
  US: 'United States',
  Etc: '',
}

export type ZoneLabel = { place: string; region: string; plain: string }

/**
 * `Asia/Ulaanbaatar` → { place: 'Ulaanbaatar', region: 'Asia' }. Special-cases
 * the `Etc/GMT±n` ids, whose sign is deliberately inverted by POSIX.
 */
export function zoneLabel(tz: string): ZoneLabel {
  if (tz === 'UTC' || tz === 'GMT' || tz === 'Zulu') return { place: 'UTC', region: 'Reference', plain: 'UTC' }
  const etc = /^Etc\/GMT([+-])(\d{1,2})$/.exec(tz)
  if (etc) {
    const sign = etc[1] === '+' ? '−' : '+'
    return {
      place: `UTC${sign}${etc[2]}`,
      region: 'Fixed offset',
      plain: `UTC${sign}${etc[2]}`,
    }
  }
  const cut = tz.lastIndexOf('/')
  if (cut < 0) return { place: tz, region: '', plain: tz }
  const head = tz.slice(0, cut)
  const tail = tz.slice(cut + 1).replace(/_/g, ' ')
  const place = tail.replace(/\s+/g, ' ')
  const region = REGION_PREFIX[head] ?? head
  return { place, region, plain: region ? `${place}, ${region}` : place }
}

export function zoneRegion(tz: string): string {
  return zoneLabel(tz).region
}

/** Two-letter country code → nothing fancy, just used for grouping in search. */
export function cityRegionLabel(city: City): string {
  return city.admin ? `${city.admin}, ${city.country}` : city.country
}

export const ALL_ZONE_IDS: string[] = (() => {
  const seen = new Set<string>()
  for (const c of CITIES) seen.add(c.tz)
  return [...seen]
})()
