import { describe, expect, it } from 'vitest'
import {
  DAY,
  diffLabel,
  isValidZone,
  listZones,
  localDayStart,
  nextTransition,
  offsetLabel,
  observesDst,
  standardOffsetMs,
  zonedTimeToUtc,
  zoneOffsetMs,
  zoneSnapshot,
} from '../src/lib/time'
import { IANA_ZONES } from '../src/data/zones'

const JAN = Date.UTC(2026, 0, 15, 12)
const JUL = Date.UTC(2026, 6, 15, 12)

describe('offsets read from the runtime tz database', () => {
  it('handles the half- and quarter-hour zones', () => {
    expect(zoneOffsetMs('Asia/Kolkata', JAN)).toBe(5.5 * 3_600_000)
    expect(zoneOffsetMs('Asia/Kathmandu', JUL)).toBe((5 * 60 + 45) * 60_000)
    expect(zoneOffsetMs('Asia/Tehran', JAN)).toBe((3 * 60 + 30) * 60_000)
    expect(zoneOffsetMs('Asia/Yangon', JAN)).toBe((6 * 60 + 30) * 60_000)
    expect(zoneOffsetMs('Australia/Eucla', JAN)).toBe((8 * 60 + 45) * 60_000)
    expect(zoneOffsetMs('America/St_Johns', JAN)).toBe(-(3 * 60 + 30) * 60_000)
    expect(zoneOffsetMs('America/St_Johns', JUL)).toBe(-(2 * 60 + 30) * 60_000)
  })

  it('puts Kiritimati fourteen hours ahead of UTC', () => {
    expect(zoneOffsetMs('Pacific/Kiritimati', JAN)).toBe(14 * 3_600_000)
  })

  it('respects the inverted sign of the Etc/GMT zones', () => {
    // POSIX writes Etc/GMT+12 as "12 hours behind Greenwich".
    expect(zoneOffsetMs('Etc/GMT+12', JAN)).toBe(-12 * 3_600_000)
    expect(zoneOffsetMs('Etc/GMT-13', JAN)).toBe(13 * 3_600_000)
  })

  it('follows daylight saving where it exists and ignores it where it does not', () => {
    expect(zoneOffsetMs('Europe/London', JAN)).toBe(0)
    expect(zoneOffsetMs('Europe/London', JUL)).toBe(3_600_000)
    expect(zoneOffsetMs('Asia/Dubai', JAN)).toBe(4 * 3_600_000)
    expect(zoneOffsetMs('Asia/Dubai', JUL)).toBe(4 * 3_600_000)
    expect(observesDst('Asia/Dubai', JAN)).toBe(false)
    expect(observesDst('Europe/London', JAN)).toBe(true)
    expect(zoneSnapshot('Europe/London', JAN).dst).toBe(false)
    expect(zoneSnapshot('Europe/London', JUL).dst).toBe(true)
    expect(standardOffsetMs('Europe/London', JUL)).toBe(0)
  })

  it('agrees with Intl on every zone it is given', () => {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Tokyo',
      hour: 'numeric',
      minute: 'numeric',
      hourCycle: 'h23',
    })
    const at = Date.UTC(2026, 10, 3, 0, 30)
    const parts = fmt.formatToParts(at)
    const hour = Number(parts.find((p) => p.type === 'hour')?.value)
    const minute = Number(parts.find((p) => p.type === 'minute')?.value)
    expect(zoneOffsetMs('Asia/Tokyo', at)).toBe((hour - 0) * 3_600_000 + (minute - 30) * 60_000)
  })
})

describe('calendar edges', () => {
  it('gives the instant of local midnight', () => {
    // Tokyo midnight on 2026-03-01 local is 2026-02-28T15:00Z
    expect(localDayStart('Asia/Tokyo', Date.UTC(2026, 2, 1, 3))).toBe(Date.UTC(2026, 1, 28, 15))
    // …and across a DST boundary the day is still 24×60 minutes of wall clock
    const start = localDayStart('Europe/London', Date.UTC(2026, 2, 29, 12))
    expect(start).toBe(Date.UTC(2026, 2, 29, 0))
  })

  it('round-trips a wall clock time back to an instant', () => {
    const instant = zonedTimeToUtc('Asia/Kolkata', 2026, 3, 14, 9, 30)
    // 09:30 in Kolkata (UTC+5:30) is 04:00 UTC
    expect(instant).toBe(Date.UTC(2026, 3 - 1, 14, 4, 0))
    const snap = zoneSnapshot('Asia/Kolkata', instant)
    expect([snap.hour, snap.minute]).toEqual([9, 30])
  })

  it('finds the spring-forward instant to the minute', () => {
    const ny = nextTransition('America/New_York', Date.UTC(2026, 0, 1))
    expect(ny).not.toBeNull()
    // US DST began 02:00 local on 8 March 2026 → 07:00Z
    expect(ny!.at).toBe(Date.UTC(2026, 2, 8, 7, 0))
    expect(ny!.gains).toBe(true)
    expect(ny!.to - ny!.from).toBe(3_600_000)
  })

  it('knows Lord Howe moves its clocks by half an hour', () => {
    const lh = nextTransition('Australia/Lord_Howe', Date.UTC(2026, 2, 1))
    expect(lh).not.toBeNull()
    expect(Math.abs(lh!.to - lh!.from)).toBe(30 * 60_000)
  })

  it('treats a day as a day', () => {
    expect(DAY).toBe(86_400_000)
  })
})

describe('labels', () => {
  it('writes offsets the way people read them', () => {
    expect(offsetLabel(5.5 * 3_600_000)).toBe('UTC+05:30')
    expect(offsetLabel(0)).toBe('UTC+00:00')
    expect(offsetLabel(-((2 * 60 + 30) * 60_000))).toBe('UTC−02:30')
    expect(offsetLabel(14 * 3_600_000, '')).toBe('+14:00')
  })

  it('describes gaps between two clocks', () => {
    expect(diffLabel(0)).toBe('same time')
    expect(diffLabel(9.5 * 3_600_000)).toBe('+9h 30m')
    expect(diffLabel(-45 * 60_000)).toBe('−45m')
  })
})

describe('zone inventory', () => {
  it('lists the zones and validates ids', () => {
    const zones = listZones(IANA_ZONES)
    expect(zones.length).toBeGreaterThan(150)
    expect(zones).toContain('Asia/Tokyo')
    expect(isValidZone('Not/AZone')).toBe(false)
    expect(isValidZone('UTC')).toBe(true)
  })

  it('snapshots are stable and cached', () => {
    const at = Date.UTC(2026, 5, 1, 12)
    expect(zoneSnapshot('Europe/Berlin', at)).toEqual(zoneSnapshot('Europe/Berlin', at))
  })
})
