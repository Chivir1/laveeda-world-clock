import { useMemo } from 'react'
import type { City } from '../data/cities'
import { activityAtHour, inWorkingHours } from '../lib/cityState'
import { hourAxisLabel, dateLine, dayBadge, digital } from '../lib/format'
import { DAY, localDayStart, zonedTimeToUtc, zoneSnapshot } from '../lib/time'
import { describeOverlap, findWindows, overlapScore } from '../lib/overlap'
import { useClock } from '../hooks/useClock'
import { usePrefs } from '../state/prefs'
import { Icon } from './Icons'

const DAY_NAMES = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

type Cell = {
  hour: number
  minute: number
  weekday: number
  dayDiff: number
  state: 'work' | 'evening' | 'sleep'
}

type Row = {
  city: City
  label: string
  cells: Cell[]
  midnightColumn: number | null
}

/**
 * The 24-hour grid: one reference day across the top, one city per row, and
 * each cell is that city's own local hour. This is the view that answers the
 * only question a world clock is really for — "when can we all be awake at the
 * same time".
 */
export function CompareView() {
  const { prefs, dispatch, pinnedCities, homeCity } = usePrefs()
  const now = useClock('minute')
  const refTz = prefs.compareWithUtc ? 'UTC' : prefs.homeTz

  const cities = useMemo(() => {
    const list =
      homeCity && !pinnedCities.some((c) => c.id === homeCity.id)
        ? [homeCity, ...pinnedCities]
        : pinnedCities
    return list.slice(0, 18)
  }, [homeCity, pinnedCities])

  const dayStart = useMemo(
    () => localDayStart(refTz, now + prefs.dayShift * DAY),
    [refTz, now, prefs.dayShift],
  )

  const grid = useMemo(() => {
    const ref = zoneSnapshot(refTz, dayStart)
    const instants: number[] = []
    for (let h = 0; h < 24; h++) {
      instants.push(zonedTimeToUtc(refTz, ref.year, ref.month, ref.day, h))
    }
    const rows: Row[] = cities.map((city) => {
      const label = prefs.labels[city.id]?.trim() || city.name
      const cells: Cell[] = instants.map((instant) => {
        const snap = zoneSnapshot(city.tz, instant)
        const working = inWorkingHours(snap, prefs.workStart, prefs.workEnd, prefs.workDays)
        return {
          hour: snap.hour,
          minute: snap.minute,
          weekday: snap.weekday,
          dayDiff: snap.epochDay - ref.epochDay,
          state: working ? 'work' : activityAtHour(snap.hour, snap.weekday),
        }
      })
      const midnightColumn = cells.findIndex((c) => c.hour === 0)
      return { city, label, cells, midnightColumn }
    })

    const allWork: number[] = []
    for (let h = 0; h < 24; h++) {
      allWork.push(rows.reduce((n, r) => n + (r.cells[h].state === 'work' ? 1 : 0), 0))
    }
    const peak = Math.max(0, ...allWork)

    const best = findWindows(allWork, rows.length, 4)
    const recommended = new Set<number>()
    for (const window of best) {
      if (window.quality === 'thin') continue
      for (let h = window.start; h < window.end; h++) recommended.add(h)
    }

    return { rows, allWork, peak, best, recommended, ref }
  }, [cities, refTz, dayStart, prefs.workStart, prefs.workEnd, prefs.workDays, prefs.labels])

  const anchor = prefs.anchorHour
  const anchorInstant = useMemo(() => {
    const ref = zoneSnapshot(refTz, dayStart)
    return zonedTimeToUtc(refTz, ref.year, ref.month, ref.day, anchor, prefs.anchorMinute)
  }, [refTz, dayStart, anchor, prefs.anchorMinute])

  const setAnchor = (hour: number, minute = prefs.anchorMinute) =>
    dispatch({ type: 'patch', patch: { anchorHour: Math.max(0, Math.min(23, hour)), anchorMinute: Math.max(0, Math.min(59, minute)) } })

  const atWorkNow = grid.allWork[anchor] ?? 0
  const style = { hour12: prefs.hour12, seconds: false }

  if (cities.length === 0) {
    return (
      <section className="sec">
        <div className="panel" style={{ padding: 22 }}>
          <h2 style={{ fontSize: 17 }}>Nothing to compare yet</h2>
          <p className="muted" style={{ fontSize: 13.5, marginTop: 6, maxWidth: '58ch' }}>
            Pin a few cities and this becomes the scheduling grid: every place on one set of hours,
            with working time highlighted and the overlap called out.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="sec">
      <div className="toolbar">
        <h2>Compare</h2>
        <span className="count">
          {cities.length} × 24 h
        </span>
        <span className="spacer" />
        <div className="seg" role="group" aria-label="Reference day">
          <button onClick={() => dispatch({ type: 'patch', patch: { dayShift: prefs.dayShift - 1 } })} title="Previous day">
            <Icon name="left" />
          </button>
          <button
            onClick={() => dispatch({ type: 'patch', patch: { dayShift: 0 } })}
            aria-pressed={prefs.dayShift === 0}
          >
            {prefs.dayShift === 0 ? 'Today' : prefs.dayShift === 1 ? 'Tomorrow' : `${prefs.dayShift > 0 ? '+' : ''}${prefs.dayShift} days`}
          </button>
          <button onClick={() => dispatch({ type: 'patch', patch: { dayShift: prefs.dayShift + 1 } })} title="Next day">
            <Icon name="right" />
          </button>
        </div>
        <div className="seg" role="group" aria-label="Reference clock">
          <button aria-pressed={!prefs.compareWithUtc} onClick={() => dispatch({ type: 'patch', patch: { compareWithUtc: false } })}>
            {homeCity ? homeCity.name : 'My clock'}
          </button>
          <button aria-pressed={prefs.compareWithUtc} onClick={() => dispatch({ type: 'patch', patch: { compareWithUtc: true } })}>
            UTC
          </button>
        </div>
      </div>

      <div className="cmp-layout">
        <div className="cmp">
          <div className="cmp-scroll">
            <div className="cmp-grid" role="table" aria-label="Local hours for each city across one reference day">
              <div className="cmp-corner">
                <Icon name="calendar" size={14} />
                <span>{dateLine(refTz, dayStart + 12 * 3_600_000, 'long')}</span>
              </div>
              {Array.from({ length: 24 }, (_, h) => (
                <button
                  key={h}
                  className={`cmp-hour${h === anchor ? ' is-anchor' : ''}${h === 0 ? ' is-midnight' : ''}`}
                  onClick={() => setAnchor(h)}
                  title={`Scan ${hourAxisLabel(h, prefs.hour12)}00 in ${refTz}`}
                >
                  {hourAxisLabel(h, prefs.hour12)}
                </button>
              ))}

              {grid.rows.map((row) => {
                const anchorCell = row.cells[anchor] ?? row.cells[0]
                return (
                  <RowFragment key={row.city.id}>
                    <div className="cmp-name">
                      <b>{row.label}</b>
                      <span>
                        {String(anchorCell.hour).padStart(2, '0')}:{String(anchorCell.minute).padStart(2, '0')}
                        {anchorCell.dayDiff !== 0 && <em style={{ color: 'var(--sun)', fontStyle: 'normal' }}> {dayBadge(anchorCell.dayDiff)}</em>}
                      </span>
                    </div>
                    {row.cells.map((cell, h) => (
                      <button
                        key={h}
                        className={`cmp-cell ${cell.state}${h === anchor ? ' is-anchor' : ''}${cell.hour === 0 ? ' is-midnight' : ''}${cell.dayDiff === 0 ? ' today' : ''}`}
                        onClick={() => setAnchor(h)}
                        title={`${row.label}: ${String(cell.hour).padStart(2, '0')}:${String(cell.minute).padStart(2, '0')} ${DAY_FULL[cell.weekday]}${cell.dayDiff ? ` (${dayBadge(cell.dayDiff)})` : ''}`}
                        aria-label={`${row.label} at ${hourAxisLabel(h, false)}00 reference time`}
                      >
                        {hourAxisLabel(cell.hour, prefs.hour12)}
                      </button>
                    ))}
                  </RowFragment>
                )
              })}
            </div>

            <div className="cmp-heat">
              <div className="lead">
                <Icon name="spark" size={14} /> overlap
              </div>
              {grid.allWork.map((count, h) => (
                <div
                  key={h}
                  className={`heatbar${grid.recommended.has(h) ? ' best' : ''}`}
                  title={`${count} of ${grid.rows.length} at work — ${overlapScore(count, grid.rows.length)}% overlap`}
                >
                  <i style={{ height: `${overlapScore(count, grid.rows.length)}%` }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="cmp-aside">
          <div className="block">
            <h3>Scanned moment</h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
              <b className="mono" style={{ fontSize: 22, letterSpacing: '-0.03em' }}>
                {hourAxisLabel(anchor, prefs.hour12)}
                {prefs.anchorMinute ? `:${String(prefs.anchorMinute).padStart(2, '0')}` : ':00'}
                {prefs.hour12 ? (anchor >= 12 ? ' pm' : ' am') : ''}
              </b>
              <span className="muted" style={{ fontSize: 12 }}>
                in {prefs.compareWithUtc ? 'UTC' : (homeCity?.name ?? 'your zone')}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button className="iconbtn sm" onClick={() => setAnchor(anchor, Math.max(0, prefs.anchorMinute - 15))} title="15 minutes earlier">
                <Icon name="left" />
              </button>
              <button className="iconbtn sm" onClick={() => setAnchor(anchor, prefs.anchorMinute + 15)} title="15 minutes later">
                <Icon name="right" />
              </button>
              <span className={`chip${atWorkNow === grid.rows.length && atWorkNow > 0 ? ' work' : atWorkNow === 0 ? ' sleep' : ''}`}>
                {describeOverlap(atWorkNow, grid.rows.length)}
              </span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 3 }}>
              {grid.rows.map((row) => {
                const cell = row.cells[anchor] ?? row.cells[0]
                const snap = zoneSnapshot(row.city.tz, anchorInstant)
                const t = digital(snap, style)
                return (
                  <li key={row.city.id} style={{ display: 'flex', gap: 8, alignItems: 'baseline', fontSize: 12.5 }}>
                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {row.label}
                    </span>
                    <span className="mono" style={{ color: cell.state === 'work' ? 'var(--work)' : cell.state === 'sleep' ? 'var(--moon)' : 'var(--muted)' }}>
                      {t.hours}:{t.minutes}
                      {t.suffix ? ` ${t.suffix}` : ''}
                    </span>
                    {cell.dayDiff !== 0 && <span className="chip" style={{ fontSize: 10 }}>{dayBadge(cell.dayDiff)}</span>}
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="block">
            <h3>Windows that work</h3>
            {grid.best.length === 0 ? (
              <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>
                No hour in this day has anyone inside working hours together — the gap between these
                places is real. Try the next day, or widen the hours below.
              </p>
            ) : (
              grid.best.map((w) => (
                <button
                  key={`${w.start}-${w.end}`}
                  className={`window${w.start <= anchor && anchor < w.end ? ' is-active' : ''}`}
                  onClick={() => setAnchor(w.start)}
                >
                  <b>
                    {hourAxisLabel(w.start, prefs.hour12)}:00 → {hourAxisLabel(Math.max(w.start, w.end - 1), prefs.hour12)}:59
                    {prefs.hour12 ? ' ' + (w.start >= 12 ? 'pm' : 'am') : ''}
                  </b>
                  <span>
                    {w.end - w.start} h · {w.shared}/{grid.rows.length} at work ·{' '}
                    {w.quality === 'perfect' ? 'everyone in the office' : w.quality === 'good' ? 'most people awake' : 'a compromise slot'}
                  </span>
                </button>
              ))
            )}
          </div>

          <div className="block">
            <h3>Your working hours</h3>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <TimeSelect value={prefs.workStart} onChange={(v) => dispatch({ type: 'patch', patch: { workStart: v } })} hour12={prefs.hour12} label="from" />
              <span className="dim">→</span>
              <TimeSelect value={prefs.workEnd} onChange={(v) => dispatch({ type: 'patch', patch: { workEnd: v } })} hour12={prefs.hour12} label="to" />
            </div>
            <div className="days" role="group" aria-label="Working days">
              {DAY_NAMES.map((d, i) => (
                <button
                  key={i}
                  title={DAY_FULL[i]}
                  aria-pressed={prefs.workDays.includes(i)}
                  onClick={() => {
                    const workDays = prefs.workDays.includes(i)
                      ? prefs.workDays.filter((x) => x !== i)
                      : [...prefs.workDays, i].sort()
                    dispatch({ type: 'patch', patch: { workDays } })
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
            <div className="legend">
              <span><i className="work" /> working</span>
              <span><i className="evening" /> up, off the clock</span>
              <span><i className="sleep" /> asleep</span>
            </div>
            <p className="dim" style={{ fontSize: 11.5, margin: 0 }}>
              Click any column to scan it. Colours follow each city’s own day, not yours.
            </p>
          </div>
        </aside>
      </div>
    </section>
  )
}

function RowFragment({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

function TimeSelect({
  value,
  onChange,
  hour12,
  label,
}: {
  value: number
  onChange: (minutes: number) => void
  hour12: boolean
  label: string
}) {
  return (
    <label className="field" style={{ flex: 1 }}>
      <span>{label}</span>
      <select
        className="input"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
      >
        {Array.from({ length: 48 }, (_, i) => i * 30).map((minutes) => {
          const h = Math.floor(minutes / 60)
          const m = minutes % 60
          return (
            <option key={minutes} value={minutes}>
              {hour12
                ? `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
                : `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`}
            </option>
          )
        })}
      </select>
    </label>
  )
}
