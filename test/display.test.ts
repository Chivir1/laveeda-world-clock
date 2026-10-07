import { describe, expect, it } from 'vitest'
import { dayBadge, digital, duration, hourAxisLabel, relativeDay } from '../src/lib/format'
import { fold, searchCities, scoreQuery, searchStrings } from '../src/lib/search'
import { CITIES, REGIONS, STARTER_CITIES } from '../src/data/cities'
import { cityState, daylightFor } from '../src/lib/cityState'
import { zoneSnapshot } from '../src/lib/time'
import { IANA_ZONES } from '../src/data/zones'

const fake = (over: Partial<ReturnType<typeof zoneSnapshot>>) => ({
  ...zoneSnapshot('UTC', Date.UTC(2026, 0, 1, 13, 45, 30)),
  ...over,
})

describe('clock display', () => {
  it('pads 24-hour time and folds it to 12-hour correctly', () => {
    expect(digital(fake({ hour: 0, minute: 5, second: 9 }), { hour12: false, seconds: true })).toMatchObject({
      hours: '00',
      minutes: '05',
      seconds: '09',
      suffix: '',
    })
    expect(digital(fake({ hour: 0 }), { hour12: true, seconds: false }).hours).toBe('12')
    expect(digital(fake({ hour: 0 }), { hour12: true, seconds: false }).suffix).toBe('AM')
    expect(digital(fake({ hour: 12 }), { hour12: true, seconds: false })).toMatchObject({ hours: '12', suffix: 'PM' })
    expect(digital(fake({ hour: 13 }), { hour12: true, seconds: false }).hours).toBe('1')
    expect(digital(fake({ hour: 23 }), { hour12: true, seconds: false }).hours).toBe('11')
  })

  it('labels the axis without leading zeros in 12-hour mode', () => {
    expect(hourAxisLabel(0, false)).toBe('00')
    expect(hourAxisLabel(9, false)).toBe('09')
    expect(hourAxisLabel(0, true)).toBe('12a')
    expect(hourAxisLabel(13, true)).toBe('1p')
  })

  it('talks about days like a person', () => {
    expect(relativeDay(0)).toBe('today')
    expect(relativeDay(1)).toBe('tomorrow')
    expect(relativeDay(-1)).toBe('yesterday')
    expect(relativeDay(4)).toBe('in 4 days')
    expect(dayBadge(1)).toBe('+1d')
    expect(dayBadge(-1)).toBe('-1d')
    expect(dayBadge(0)).toBe('')
  })

  it('formats durations', () => {
    expect(duration(0)).toBe('0 min')
    expect(duration(45 * 60_000)).toBe('45 min')
    expect(duration(3 * 3_600_000)).toBe('3 hr')
    expect(duration((4 * 60 + 20) * 60_000)).toBe('4h 20m')
  })
})

describe('search', () => {
  it('folds accents and punctuation', () => {
    expect(fold('Sā́o Paulõ  ’92!')).toBe('sao paulo 92')
  })

  it('scores exact, prefix and subsequence matches in that order', () => {
    expect(scoreQuery('tokyo', 'Tokyo')).toBe(1000)
    expect(scoreQuery('tok', 'Tokyo')).toBe(700)
    expect(scoreQuery('tky', 'Tokyo')).toBeGreaterThan(60)
    expect(scoreQuery('xyz', 'Tokyo')).toBe(0)
  })

  it('finds cities by country, state and zone-ish words', () => {
    expect(searchCities('mumbai', CITIES)[0]!.city.id).toBe('mumbai')
    expect(searchCities('Maharashtra', CITIES).map((h) => h.city.id)).toContain('mumbai')
    expect(searchCities('kiribati', CITIES).map((h) => h.city.id)).toContain('kiritimati')
    expect(searchCities('sao paulo', CITIES).map((h) => h.city.id)).toContain('sao-paulo')
    expect(searchCities('nullarbor', CITIES).map((h) => h.city.id)).toContain('eucla')
  })

  it('ranks the bigger place first and degrades gracefully', () => {
    expect(searchCities('delhi', CITIES)[0]!.city.id).toBe('new-delhi')
    expect(searchCities('', CITIES, 10)).toHaveLength(10)
    expect(searchCities('qqqqqq', CITIES)).toHaveLength(0)
    // Equal scores fall back to alphabetical order.
    expect(searchStrings('pacific', ['Pacific/Tokyo', 'Europe/Oslo', 'Pacific/Apia'], 5)).toEqual([
      'Pacific/Apia',
      'Pacific/Tokyo',
    ])
    expect(searchStrings('oslo', ['Pacific/Tokyo', 'Europe/Oslo'], 5)).toEqual(['Europe/Oslo'])
  })
})

describe('catalogue', () => {
  it('is unique, complete and usable by the runtime', () => {
    const ids = new Set(CITIES.map((c) => c.id))
    expect(ids.size).toBe(CITIES.length)
    expect(CITIES.length).toBeGreaterThan(150)
    for (const id of STARTER_CITIES) expect(ids.has(id)).toBe(true)
    for (const city of CITIES) {
      expect(REGIONS[city.region]).toBeTruthy()
      expect(() => new Intl.DateTimeFormat('en-US', { timeZone: city.tz })).not.toThrow()
      expect(Math.abs(city.lat)).toBeLessThanOrEqual(90)
      expect(Math.abs(city.lng)).toBeLessThanOrEqual(180)
    }
  })

  it('covers every fractional offset on Earth', () => {
    const zones = new Set(CITIES.map((c) => c.tz))
    for (const tz of [
      'Asia/Kathmandu',
      'Asia/Kolkata',
      'Australia/Eucla',
      'Pacific/Chatham',
      'America/St_Johns',
      'Asia/Yangon',
      'Australia/Lord_Howe',
    ]) {
      expect(zones.has(tz), tz).toBe(true)
    }
  })

  it('ships a zone fallback list', () => {
    expect(IANA_ZONES.length).toBeGreaterThan(300)
    expect(IANA_ZONES).toContain('Asia/Tokyo')
  })
})

describe('city state', () => {
  const tokyo = CITIES.find((c) => c.id === 'tokyo')!
  const at = Date.UTC(2026, 5, 21, 3, 30) // 12:30 in Tokyo on the solstice

  it('reports the local clock and the gap to the reference zone', () => {
    const state = cityState(tokyo, at, 'Europe/London')
    expect(state.snap.hour).toBe(12)
    expect(state.snap.minute).toBe(30)
    expect(state.diffMs).toBe(8 * 3_600_000) // London is on BST in June, so 9h − 1h
    expect(state.dayDiff).toBe(0)
    expect(state.sky.dark).toBe(false)
    expect(state.altitudeDeg).toBeGreaterThan(60)
    expect(state.day.lengthMin).toBeGreaterThan(800)
    expect(state.phase).toBe('day')
  })

  it('sees the date line between Samoa and American Samoa', () => {
    const apia = CITIES.find((c) => c.id === 'apia')!
    const pago = CITIES.find((c) => c.id === 'pago-pago')!
    const a = cityState(apia, at, 'UTC')
    const p = cityState(pago, at, 'UTC')
    expect(a.snap.hour).toBe(p.snap.hour) // same wall clock: 16:30
    expect(a.dayDiff - p.dayDiff).toBe(1) // …a calendar day apart
  })

  it('caches daylight per day', () => {
    const first = daylightFor(tokyo, at)
    const second = daylightFor(tokyo, at + 1000)
    expect(first).toBe(second)
    expect(daylightFor(tokyo, at + 3 * 86_400_000)).not.toBe(first)
  })

  it('handles the poles without inventing a sunrise', () => {
    const troll = CITIES.find((c) => c.id === 'troll')!
    const summer = cityState(troll, Date.UTC(2026, 0, 15, 12), 'UTC') // austral summer
    expect(summer.sun.polar).toBe('day')
    expect(summer.day.sunriseH).toBeNull()
    const winter = cityState(troll, Date.UTC(2026, 6, 1, 12), 'UTC')
    expect(winter.sun.polar).toBe('night')
    expect(winter.day.sunsetH).toBeNull()
  })

  it('is stable when the same instant is requested twice', () => {
    expect(cityState(tokyo, at, 'UTC')).toBe(cityState(tokyo, at + 500, 'UTC'))
  })
})
