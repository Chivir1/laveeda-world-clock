/**
 * Preferences: one reducer, one localStorage key, and a URL that stays
 * shareable. Deep links win over stored state so a sent board opens as sent.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import { CITIES, STARTER_CITIES, cityById, type City } from '../data/cities'
import { deviceZone } from '../lib/geo'
import { zoneOffsetMs, zoneSnapshot, isValidZone } from '../lib/time'

export type ViewKey = 'board' | 'compare' | 'zones'
export type ThemeKey = 'auto' | 'light' | 'dark'
export type BoardSort = 'manual' | 'hour' | 'offset' | 'name'

export type Prefs = {
  version: 1
  homeTz: string
  homeCityId: string | null
  pinned: string[]
  hour12: boolean
  seconds: boolean
  theme: ThemeKey
  ambient: boolean
  view: ViewKey
  sort: BoardSort
  workStart: number
  workEnd: number
  workDays: number[]
  anchorHour: number
  anchorMinute: number
  dayShift: number
  compareWithUtc: boolean
  labels: Record<string, string>
  seenInstallHint: boolean
}

const STORAGE_KEY = 'laveeda.prefs.v1'
const CITY_IDS = new Set(CITIES.map((c) => c.id))

export function defaultPrefs(): Prefs {
  const tz = deviceZone()
  // Only claim a home *city* when the catalogue actually has one in the
  // device's zone. Otherwise the reference stays the zone itself, so the hero
  // clock and every “+9h 30m” on the board agree with each other.
  const guess = CITIES.find((c) => c.tz === tz && c.popM > 1)
  const homeCityId = guess?.id ?? null
  const pinned = [...new Set([homeCityId, ...STARTER_CITIES])].filter((id): id is string =>
    Boolean(id && CITY_IDS.has(id)),
  )
  return {
    version: 1,
    homeTz: isValidZone(tz) ? tz : 'UTC',
    homeCityId,
    pinned,
    // 24-hour by default: a world clock is mostly read for gaps between places,
    // and AM/PM doubles the chance of misreading a colleague's morning as their evening.
    hour12: false,
    seconds: true,
    theme: 'auto',
    ambient: true,
    view: 'board',
    sort: 'manual',
    workStart: 9 * 60,
    workEnd: 18 * 60,
    workDays: [1, 2, 3, 4, 5],
    anchorHour: 14,
    anchorMinute: 0,
    dayShift: 0,
    compareWithUtc: false,
    labels: {},
    seenInstallHint: false,
  }
}

function coerceBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}
function coerceNumber(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

/** Merge whatever is on disk over the defaults, dropping anything unusable. */
export function hydrate(raw: unknown): Prefs {
  const base = defaultPrefs()
  if (!raw || typeof raw !== 'object') return base
  const input = raw as Partial<Prefs> & Record<string, unknown>
  const pinned = Array.isArray(input.pinned)
    ? [...new Set(input.pinned.filter((id): id is string => typeof id === 'string' && CITY_IDS.has(id)))]
    : base.pinned
  const workStart = coerceNumber(input.workStart, base.workStart, 0, 23 * 60)
  const workEnd = coerceNumber(input.workEnd, base.workEnd, 0, 24 * 60)
  return {
    ...base,
    homeTz:
      typeof input.homeTz === 'string' && isValidZone(input.homeTz) ? input.homeTz : base.homeTz,
    homeCityId:
      typeof input.homeCityId === 'string' && CITY_IDS.has(input.homeCityId)
        ? input.homeCityId
        : input.homeCityId === null
          ? null
          : base.homeCityId,
    pinned,
    hour12: coerceBoolean(input.hour12, base.hour12),
    seconds: coerceBoolean(input.seconds, base.seconds),
    theme: input.theme === 'light' || input.theme === 'dark' ? input.theme : 'auto',
    ambient: coerceBoolean(input.ambient, base.ambient),
    view: input.view === 'compare' || input.view === 'zones' ? input.view : 'board',
    sort: ['manual', 'hour', 'offset', 'name'].includes(String(input.sort))
      ? (input.sort as BoardSort)
      : base.sort,
    workStart,
    workEnd: Math.max(workStart + 60, workEnd),
    workDays: Array.isArray(input.workDays)
      ? input.workDays.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
      : base.workDays,
    anchorHour: coerceNumber(input.anchorHour, base.anchorHour, 0, 23),
    anchorMinute: coerceNumber(input.anchorMinute, base.anchorMinute, 0, 59),
    dayShift: coerceNumber(input.dayShift, base.dayShift, -365, 365),
    compareWithUtc: coerceBoolean(input.compareWithUtc, base.compareWithUtc),
    labels:
      input.labels && typeof input.labels === 'object'
        ? Object.fromEntries(
            Object.entries(input.labels as Record<string, unknown>)
              .filter(
                ([id, label]) =>
                  CITY_IDS.has(id) && typeof label === 'string' && label.trim().length <= 40,
              )
              .map(([id, label]) => [id, (label as string).trim()]),
          )
        : {},
    seenInstallHint: coerceBoolean(input.seenInstallHint, base.seenInstallHint),
  }
}

export type PrefsAction =
  | { type: 'patch'; patch: Partial<Prefs> }
  | { type: 'pin'; cityId: string; atEnd?: boolean }
  | { type: 'unpin'; cityId: string }
  | { type: 'reorder'; from: number; to: number }
  | { type: 'setPinned'; cityIds: string[] }
  | { type: 'setHome'; cityId: string | null; tz?: string }
  | { type: 'label'; cityId: string; label: string }
  | { type: 'reset' }

export function reducer(state: Prefs, action: PrefsAction): Prefs {
  switch (action.type) {
    case 'patch':
      return { ...state, ...action.patch }
    case 'pin': {
      if (!CITY_IDS.has(action.cityId) || state.pinned.includes(action.cityId)) return state
      const pinned = action.atEnd
        ? [...state.pinned, action.cityId]
        : [action.cityId, ...state.pinned]
      return { ...state, pinned }
    }
    case 'unpin':
      return { ...state, pinned: state.pinned.filter((id) => id !== action.cityId) }
    case 'reorder': {
      const pinned = [...state.pinned]
      if (action.from < 0 || action.from >= pinned.length) return state
      if (action.to < 0 || action.to >= pinned.length) return state
      const [moved] = pinned.splice(action.from, 1)
      pinned.splice(action.to, 0, moved)
      return { ...state, pinned }
    }
    case 'setPinned': {
      const pinned = [...new Set(action.cityIds.filter((id) => CITY_IDS.has(id)))]
      return { ...state, pinned }
    }
    case 'setHome':
      return {
        ...state,
        homeCityId: action.cityId && CITY_IDS.has(action.cityId) ? action.cityId : null,
        homeTz: action.tz && isValidZone(action.tz) ? action.tz : state.homeTz,
      }
    case 'label': {
      const labels = { ...state.labels }
      if (!action.label.trim()) delete labels[action.cityId]
      else labels[action.cityId] = action.label.trim()
      return { ...state, labels }
    }
    case 'reset': {
      const fresh = defaultPrefs()
      return { ...fresh, theme: state.theme, hour12: state.hour12 }
    }
    default:
      return state
  }
}

function readStored(): Prefs {
  const fallback = defaultPrefs()
  if (typeof localStorage === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    return hydrate(JSON.parse(raw))
  } catch {
    return fallback
  }
}

/** `?view=compare&city=tokyo&t=9` — the whole app is addressable. */
export function readLocation(prefs: Prefs): { patch: Partial<Prefs>; cityId?: string } {
  if (typeof location === 'undefined') return { patch: {} }
  const q = new URLSearchParams(location.search)
  const patch: Partial<Prefs> = {}
  const view = q.get('view')
  if (view === 'board' || view === 'compare' || view === 'zones') patch.view = view
  const tz = q.get('tz')
  if (tz && isValidZone(tz)) patch.homeTz = tz
  const t = q.get('t')
  if (t !== null && /^\d{1,2}(:\d{1,2})?$/.test(t)) {
    const [h, m] = t.split(':')
    patch.anchorHour = coerceNumber(h, prefs.anchorHour, 0, 23)
    patch.anchorMinute = coerceNumber(m ?? '0', 0, 0, 59)
    if (!q.get('view')) patch.view = 'compare'
  }
  const day = q.get('day')
  if (day) patch.dayShift = coerceNumber(day, 0, -365, 365)
  if (q.get('h12') === '1') patch.hour12 = true
  if (q.get('h12') === '0') patch.hour12 = false
  const cityId = q.get('city') ?? undefined
  return { patch, cityId }
}

type Ctx = {
  prefs: Prefs
  dispatch: (action: PrefsAction) => void
  homeCity: City | null
  pinnedCities: City[]
  labelFor: (city: City) => string
  isPinned: (id: string) => boolean
}

const PrefsContext = createContext<Ctx | null>(null)

function load(): { prefs: Prefs; deepLinkCity?: string } {
  const stored = readStored()
  const { patch, cityId } = readLocation(stored)
  let prefs = { ...stored, ...patch }
  if (cityId && CITY_IDS.has(cityId)) {
    prefs = prefs.pinned.includes(cityId) ? prefs : { ...prefs, pinned: [cityId, ...prefs.pinned] }
  }
  return { prefs, deepLinkCity: cityId }
}

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [{ prefs }, dispatch] = useReducer(
    (state: { prefs: Prefs }, action: PrefsAction) => ({ prefs: reducer(state.prefs, action) }),
    null,
    () => ({ prefs: load().prefs }),
  )

  useEffect(() => {
    if (typeof localStorage === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
    } catch {
      /* private mode / quota — the app still works, it just will not persist */
    }
  }, [prefs])

  useEffect(() => {
    if (typeof history === 'undefined') return
    const q = new URLSearchParams()
    if (prefs.view !== 'board') q.set('view', prefs.view)
    if (prefs.view === 'compare') {
      q.set('t', `${prefs.anchorHour}:${String(prefs.anchorMinute).padStart(2, '0')}`)
      if (prefs.dayShift) q.set('day', String(prefs.dayShift))
    }
    if (prefs.homeTz) q.set('tz', prefs.homeTz)
    const search = q.toString()
    const next = `${location.pathname}${search ? `?${search}` : ''}${location.hash}`
    if (next !== `${location.pathname}${location.search}${location.hash}`) {
      history.replaceState(null, '', next)
    }
  }, [prefs.view, prefs.anchorHour, prefs.anchorMinute, prefs.dayShift, prefs.homeTz])

  const homeCity = useMemo(
    () => (prefs.homeCityId ? (cityById(prefs.homeCityId) ?? null) : null),
    [prefs.homeCityId],
  )

  const pinnedCities = useMemo(() => {
    const list = prefs.pinned
      .map((id) => cityById(id))
      .filter((c): c is City => Boolean(c))
    switch (prefs.sort) {
      case 'hour': {
        const now = Date.now()
        return list.slice().sort((a, b) => localHourRank(a.tz, now) - localHourRank(b.tz, now))
      }
      case 'offset':
        return list
          .slice()
          .sort((a, b) => zoneRank(b.tz) - zoneRank(a.tz) || a.name.localeCompare(b.name))
      case 'name':
        return list.slice().sort((a, b) => a.name.localeCompare(b.name))
      default:
        return list
    }
  }, [prefs.pinned, prefs.sort])

  const labelFor = useCallback(
    (city: City) => prefs.labels[city.id]?.trim() || city.name,
    [prefs.labels],
  )

  const isPinned = useCallback((id: string) => prefs.pinned.includes(id), [prefs.pinned])

  const value = useMemo<Ctx>(
    () => ({ prefs, dispatch, homeCity, pinnedCities, labelFor, isPinned }),
    [prefs, dispatch, homeCity, pinnedCities, labelFor, isPinned],
  )

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>
}

export function usePrefs(): Ctx {
  const ctx = useContext(PrefsContext)
  if (!ctx) throw new Error('usePrefs must be used inside <PrefsProvider>')
  return ctx
}

/** Ordering helpers: the board can be sorted by how the day is rolling along. */
function localHourRank(tz: string, now: number): number {
  try {
    return zoneSnapshot(tz, now).hour
  } catch {
    return 0
  }
}

function zoneRank(tz: string): number {
  try {
    return zoneOffsetMs(tz, Date.now())
  } catch {
    return 0
  }
}
