import { describe, expect, it } from 'vitest'
import { daySun, skyState, sunPosition } from '../src/lib/sun'

const DAY = 86_400_000
const rad = Math.PI / 180
const DEG = 1 / rad

/** Solar noon for a place on a given UTC day, good enough for a test. */
function noonAt(lng: number, dayStart: number): number {
  return dayStart + DAY / 2 - (lng / 15) * 3_600_000
}

describe('sun position', () => {
  it('reaches the expected maximum elevation in London at midsummer', () => {
    // 90° − (51.51° − 23.44°) ≈ 61.9°
    const dayStart = Date.UTC(2026, 5, 21)
    const alt = sunPosition(noonAt(-0.128, dayStart), 51.507, -0.128).altitude * DEG
    expect(alt).toBeGreaterThan(60.5)
    expect(alt).toBeLessThan(63.5)
  })

  it('puts the sun almost overhead on the equator at the equinox', () => {
    const dayStart = Date.UTC(2026, 2, 20)
    const alt = sunPosition(noonAt(-78.467, dayStart), -0.181, -78.467).altitude * DEG
    expect(alt).toBeGreaterThan(65)
  })

  it('keeps the sun below the horizon at local midnight in mid-latitude winter', () => {
    const dayStart = Date.UTC(2026, 11, 21)
    const midnight = noonAt(-52.712, dayStart) + DAY / 2
    const alt = sunPosition(midnight, 47.561, -52.712).altitude * DEG
    expect(alt).toBeLessThan(-10)
  })

  it('gives azimuth in compass degrees, south at solar noon in the north', () => {
    const dayStart = Date.UTC(2026, 5, 21)
    const pos = sunPosition(noonAt(-0.128, dayStart), 51.507, -0.128)
    const compass = (pos.azimuth / rad + 360) % 360
    expect(compass).toBeGreaterThan(170)
    expect(compass).toBeLessThan(190)
  })
})

describe('daylight solver', () => {
  it('gives near twelve hours of daylight on the equator all year', () => {
    // Quito, UTC−5 with no DST: its local midnight is 05:00 UTC.
    for (const month of [0, 3, 6, 9]) {
      const start = Date.UTC(2026, month, 20, 5)
      const sun = daySun(start, -0.181, -78.467)
      expect(sun.sunrise).not.toBeNull()
      const hours = (sun.sunrise! - start) / 3_600_000
      expect(hours).toBeGreaterThan(5.7)
      expect(hours).toBeLessThan(6.4)
      const length = (sun.sunset! - sun.sunrise!) / 3_600_000
      expect(length).toBeGreaterThan(11.7)
      expect(length).toBeLessThan(12.4)
    }
  })

  it('flips the seasons between hemispheres', () => {
    const juneStart = Date.UTC(2026, 5, 21, 11) // Sydney local midnight = 21:00Z prev day
    const decemberStart = Date.UTC(2026, 11, 21, 13)
    const sydneyJune = daySun(juneStart, -33.865, 151.209)
    const sydneyDecember = daySun(decemberStart, -33.865, 151.209)
    const juneLength = (sydneyJune.sunset! - sydneyJune.sunrise!) / 3_600_000
    const decemberLength = (sydneyDecember.sunset! - sydneyDecember.sunrise!) / 3_600_000
    expect(decemberLength).toBeGreaterThan(juneLength + 2)
  })

  it('reports midnight sun and polar night instead of a fake sunrise', () => {
    const summer = daySun(Date.UTC(2026, 5, 21), 78.224, 15.668) // Longyearbyen
    expect(summer.sunrise).toBeNull()
    expect(summer.sunset).toBeNull()
    expect(summer.polar).toBe('day')

    const winter = daySun(Date.UTC(2026, 0, 15), 78.224, 15.668)
    expect(winter.sunrise).toBeNull()
    expect(winter.polar).toBe('night')
  })

  it('has civil twilight before sunrise and after sunset', () => {
    const start = Date.UTC(2026, 2, 20) // London on the equinox is on UTC
    const sun = daySun(start, 51.507, -0.128)
    // Roughly 06:00 sunrise, 18:10 sunset in early spring Britain.
    expect((sun.sunrise! - start) / 3_600_000).toBeGreaterThan(5.6)
    expect((sun.sunrise! - start) / 3_600_000).toBeLessThan(6.6)
    expect(sun.dawn).not.toBeNull()
    expect(sun.dusk).not.toBeNull()
    expect(sun.dawn!).toBeLessThan(sun.sunrise!)
    expect(sun.dusk!).toBeGreaterThan(sun.sunset!)
  })

  it('labels the sky honestly', () => {
    expect(skyState((89 * Math.PI) / 180).dark).toBe(false)
    expect(skyState((-45 * Math.PI) / 180).dark).toBe(true)
    expect(skyState(0).label).toBe('Golden hour')
    expect(skyState(-1 * rad).label).toBe('Blue hour')
    expect(skyState(30 * rad).label).toBe('Daylight')
  })
})
