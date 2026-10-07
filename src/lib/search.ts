/**
 * Tiny synchronous search. The catalogue is a few hundred rows, so a scored
 * substring/subsequence pass beats pulling in a fuzzy-search dependency and is
 * instant on a phone.
 */

import type { City } from '../data/cities'
import { zoneLabel } from './geo'

export function fold(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** 0 = no match. Bigger is better. */
export function scoreQuery(needle: string, haystack: string): number {
  if (!needle) return 1
  const hay = fold(haystack)
  if (!hay) return 0
  if (hay === needle) return 1000
  if (hay.startsWith(needle)) return 700
  const words = hay.split(' ')
  if (words.some((w) => w.startsWith(needle))) return 520
  const at = hay.indexOf(needle)
  if (at >= 0) return at === 0 ? 900 : 400 - Math.min(120, at * 4)
  // subsequence: 'tky' should still find Tokyo
  let i = 0
  let gaps = 0
  let last = -1
  for (const ch of needle) {
    const found = hay.indexOf(ch, last + 1)
    if (found < 0) return 0
    if (last >= 0) gaps += found - last - 1
    last = found
    i++
  }
  if (i !== needle.length) return 0
  return Math.max(40, 180 - gaps * 6)
}

export type CityHit = { city: City; score: number }

export function searchCities(query: string, cities: readonly City[], limit = 60): CityHit[] {
  const needle = fold(query)
  if (!needle) {
    return cities
      .slice()
      .sort((a, b) => b.popM - a.popM)
      .slice(0, limit)
      .map((city) => ({ city, score: city.popM }))
  }
  const terms = needle.split(' ')
  const hits: CityHit[] = []
  for (const city of cities) {
    const name = scoreQuery(terms.join(' '), city.name)
    const country = scoreQuery(terms.join(' '), city.country)
    const admin = city.admin ? scoreQuery(terms.join(' '), city.admin) : 0
    const cc = city.cc.toLowerCase() === terms.join('') ? 640 : 0
    const zone = scoreQuery(terms.join(' '), zoneLabel(city.tz).plain)
    const multi = terms.length > 1 ? terms.reduce((acc, t) => acc + Math.max(scoreQuery(t, city.name), scoreQuery(t, city.country)), 0) : 0
    const best = Math.max(name, country * 0.55, admin * 0.5, cc, zone * 0.8, multi * 0.9)
    if (best <= 40 && !(name > 0 && country > 0)) continue
    hits.push({ city, score: best + Math.min(60, city.popM) })
  }
  return hits.sort((a, b) => b.score - a.score || b.city.popM - a.city.popM).slice(0, limit)
}

export function searchStrings(query: string, items: readonly string[], limit = 40): string[] {
  const needle = fold(query)
  return items
    .map((value) => ({ value, score: needle ? scoreQuery(needle, value) : 1 }))
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score || a.value.localeCompare(b.value))
    .slice(0, limit)
    .map((hit) => hit.value)
}
