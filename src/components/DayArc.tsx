import { memo } from 'react'
import type { CityState } from '../lib/cityState'

/** Linear picture of one day: night, the sun's run, night again. */

function hhmm(hoursFloat: number | null): string {
  if (hoursFloat === null || !Number.isFinite(hoursFloat)) return '—'
  const h = Math.floor(hoursFloat + 1e-6)
  const m = Math.floor((hoursFloat - h) * 60 + 1e-6)
  return `${String(((h % 24) + 24) % 24).padStart(2, '0')}:${String(Math.min(59, Math.max(0, m))).padStart(2, '0')}`
}

const pct = (hoursFloat: number | null): number => {
  if (hoursFloat === null || !Number.isFinite(hoursFloat)) return 0
  return Math.max(0, Math.min(100, (hoursFloat / 24) * 100))
}

export const DayArc = memo(function DayArc({
  state,
  compact = false,
}: {
  state: CityState
  compact?: boolean
}) {
  const { day, snap, sky, sun } = state
  const nowH = snap.hour + snap.minute / 60 + snap.second / 3600
  const polar = day.sunriseH === null && day.sunsetH === null

  if (polar) {
    const label = sun.polar === 'day' ? 'Midnight sun' : 'Polar night'
    const detail =
      sun.polar === 'day'
        ? `the sun never sets today · now ${state.altitudeDeg.toFixed(0)}° up`
        : `the sun stays ${Math.abs(state.altitudeDeg).toFixed(0)}° below all day`
    return (
      <div className="arc" title={`${label} — ${detail}`}>
        <div className="arc-polar">
          {label} · {detail}
        </div>
      </div>
    )
  }

  const rise = day.sunriseH ?? 6
  const set = day.sunsetH ?? 18
  const dawn = day.dawnH ?? Math.max(0, rise - 0.5)
  const dusk = day.duskH ?? Math.min(24, set + 0.5)
  const nightMorning = pct(dawn)
  const nightEvening = 100 - pct(dusk)
  const dayLength = day.lengthMin ?? 0

  return (
    <div
      className="arc"
      style={compact ? { height: 26 } : undefined}
      title={`${sky.label} · ${dayLength} min of daylight`}
    >
      <div className="arc-night" style={{ width: `${nightMorning}%` }} />
      <div className="arc-night" style={{ left: `${100 - nightEvening}%`, width: `${nightEvening}%`, right: 'auto' }} />
      <div
        className={sky.dark ? 'arc-sun arc-moon' : 'arc-sun'}
        style={{ left: `${pct(nowH)}%` }}
      />
      {!compact && (
        <div className="arc-labels">
          <span>
            ↑ {hhmm(day.sunriseH)}
          </span>
          <span>{Math.floor(dayLength / 60)}h {dayLength % 60}m daylight</span>
          <span>
            ↓ {hhmm(day.sunsetH)}
          </span>
        </div>
      )}
    </div>
  )
})

export { hhmm as hoursToClock }
