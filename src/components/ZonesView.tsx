import { useMemo, useState } from 'react'
import type { City } from '../data/cities'
import { CITIES_BY_ZONE } from '../data/cities'
import { IANA_ZONES } from '../data/zones'
import { flagshipCityForZone, zoneLabel } from '../lib/geo'
import { hourAxisLabel } from '../lib/format'
import { searchStrings } from '../lib/search'
import { listZones, nextTransition, offsetLabel, observesDst, standardOffsetMs, zoneOffsetMs, zoneSnapshot } from '../lib/time'
import { useClock } from '../hooks/useClock'
import { usePrefs } from '../state/prefs'
import { Icon } from './Icons'

/**
 * Every time zone the device knows about, grouped by the offset it is holding
 * right now. This is the "all time zones" ledger: 400+ IANA zones, each with a
 * live reading, its abbreviation, and whether it ever moves its clocks.
 */

type ZoneMeta = {
  tz: string
  minutes: number
  place: string
  region: string
  abbrev: string
  dst: boolean
  moves: boolean
  cities: City[]
  mine: City[]
}

type Filter = 'all' | 'board' | 'fractional' | 'static' | 'far'

export function ZonesView() {
  const { prefs, dispatch } = usePrefs()
  const now = useClock('minute')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [collapsed, setCollapsed] = useState<Set<number>>(() => new Set())
  const [open, setOpen] = useState<string | null>(null)

  const zones = useMemo(() => listZones(IANA_ZONES), [])
  const meta = useMemo<ZoneMeta[]>(() => {
    const rows: ZoneMeta[] = []
    for (const tz of zones) {
      let minutes: number
      let abbrev = ''
      try {
        minutes = Math.round(zoneOffsetMs(tz, now) / 60_000)
        abbrev = zoneSnapshot(tz, now).abbrev
      } catch {
        continue
      }
      const label = zoneLabel(tz)
      const cities = CITIES_BY_ZONE[tz] ?? []
      rows.push({
        tz,
        minutes,
        place: label.place,
        region: label.region,
        abbrev,
        dst: zoneSnapshot(tz, now).dst,
        moves: observesDst(tz, now),
        cities,
        mine: cities.filter((c) => prefs.pinned.includes(c.id)),
      })
    }
    return rows.sort((a, b) => a.minutes - b.minutes || a.place.localeCompare(b.place))
  }, [zones, now, prefs.pinned])

  const filtered = useMemo(() => {
    const q = query.trim()
    const matched = q ? new Set(searchStrings(q, meta.map((m) => `${m.tz}`), 500)) : null
    return meta.filter((m) => {
      if (matched && !matched.has(m.tz)) {
        const label = `${m.place} ${m.region} ${m.cities.map((c) => c.name + ' ' + c.country).join(' ')}`.toLowerCase()
        if (!label.includes(q.toLowerCase())) return false
      }
      switch (filter) {
        case 'board':
          return m.mine.length > 0
        case 'fractional':
          return m.minutes % 60 !== 0
        case 'static':
          return !m.moves
        case 'far':
          return m.minutes >= 13 * 60 || m.minutes <= -11 * 60
        default:
          return true
      }
    })
  }, [meta, query, filter])

  const groups = useMemo(() => {
    const map = new Map<number, ZoneMeta[]>()
    for (const m of filtered) {
      const list = map.get(m.minutes)
      if (list) list.push(m)
      else map.set(m.minutes, [m])
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0])
  }, [filtered])

  const histogram = useMemo(() => {
    const counts = new Map<number, number>()
    for (const m of meta) counts.set(m.minutes, (counts.get(m.minutes) ?? 0) + 1)
    const keys = [...counts.keys()].sort((a, b) => a - b)
    const max = Math.max(1, ...counts.values())
    return { keys, counts, max }
  }, [meta])

  const farthest = useMemo(() => {
    if (!meta.length) return null
    const east = meta[meta.length - 1]
    const west = meta[0]
    return { east, west }
  }, [meta])

  const shown = filtered.length
  const snap = zoneSnapshot('UTC', now)
  const utcTime = `${hourAxisLabel(snap.hour, false)}:${String(snap.minute).padStart(2, '0')}`

  return (
    <section className="sec">
      <div className="toolbar">
        <h2>All time zones</h2>
        <span className="count">
          {shown} of {meta.length}
        </span>
        <span className="spacer" />
        <span className="chip mono">UTC {utcTime}</span>
        <button
          className="btn tiny ghost"
          onClick={() => setCollapsed(collapsed.size ? new Set() : new Set(groups.map(([k]) => k)))}
        >
          {collapsed.size ? 'Expand all' : 'Collapse all'}
        </button>
      </div>

      <div className="panel" style={{ padding: 12, marginBottom: 12 }}>
        <div className="zhist" role="group" aria-label="Number of zones per UTC offset">
          {histogram.keys.map((minutes) => {
            const count = histogram.counts.get(minutes) ?? 0
            const active = filter === 'all' && false
            return (
              <button
                key={minutes}
                className={`zbar${active ? ' on' : ''}`}
                style={{ height: `${20 + (count / histogram.max) * 80}%` }}
                title={`${offsetLabel(minutes * 60_000)} — ${count} zones`}
                onClick={() => setQuery(offsetLabel(minutes * 60_000, 'UTC'))}
              >
                <span>
                  {Math.abs(minutes) % 300 === 0
                    ? minutes === 0
                      ? '0'
                      : `${minutes > 0 ? '+' : '−'}${Math.abs(minutes / 60)}`
                    : ''}
                </span>
              </button>
            )
          })}
        </div>
        <div className="filters">
          <label className="search-in" style={{ flex: 1, padding: 0, minWidth: 200 }}>
            <Icon name="search" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by zone, city or country — “Eucla”, “+5:45”, “Pacific”"
              aria-label="Filter time zones"
            />
            {query && (
              <button className="iconbtn sm" onClick={() => setQuery('')} title="Clear filter">
                <Icon name="close" size={15} />
              </button>
            )}
          </label>
          <div className="seg" role="group" aria-label="Zone filters">
            {(
              [
                ['all', 'All'],
                ['board', 'On my board'],
                ['fractional', 'Half-hour'],
                ['static', 'Never changes'],
                ['far', '±12 and beyond'],
              ] as const
            ).map(([key, label]) => (
              <button key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>
                {label}
              </button>
            ))}
          </div>
        </div>
        {farthest && (
          <p className="dim" style={{ fontSize: 12, margin: '8px 0 0' }}>
            Earliest clock on Earth: <b style={{ color: 'var(--text)' }}>{farthest.west.place}</b> ({offsetLabel(farthest.west.minutes * 60_000)}) ·
            latest: <b style={{ color: 'var(--text)' }}>{farthest.east.place}</b> ({offsetLabel(farthest.east.minutes * 60_000)}).{' '}
            That is a {farthest.east.minutes - farthest.west.minutes >= 24 * 60 ? '26' : '24'}-hour spread, which is why “same day” needs a date line.
          </p>
        )}
      </div>

      <div className="ztable">
        {groups.length === 0 && (
          <div style={{ padding: 20 }} className="muted">
            No zone matches that. Try a city name, a country, or an offset like UTC+5:45.
          </div>
        )}
        {groups.map(([minutes, list]) => {
          const isCollapsed = collapsed.has(minutes)
          const sample = list[0]
          const sampleSnap = zoneSnapshot(sample.tz, now)
          return (
            <div className="zgroup" key={minutes}>
              <button
                className="zgroup-head"
                onClick={() =>
                  setCollapsed((prev) => {
                    const next = new Set(prev)
                    if (next.has(minutes)) next.delete(minutes)
                    else next.add(minutes)
                    return next
                  })
                }
                aria-expanded={!isCollapsed}
              >
                <Icon name={isCollapsed ? 'right' : 'down'} size={14} />
                <span className="off">{offsetLabel(minutes * 60_000)}</span>
                <span className="n">
                  {list.length} {list.length === 1 ? 'zone' : 'zones'}
                  {list.some((z) => z.dst) ? ' · summer time in effect' : ''}
                </span>
                <span className="clock">
                  {hourAxisLabel(sampleSnap.hour, prefs.hour12)}:{String(sampleSnap.minute).padStart(2, '0')}
                  {prefs.hour12 ? ` ${sampleSnap.hour >= 12 ? 'PM' : 'AM'}` : ''}
                </span>
              </button>
              {!isCollapsed &&
                list.map((z) => (
                  <ZoneRow
                    key={z.tz}
                    meta={z}
                    now={now}
                    open={open === z.tz}
                    onToggle={() => setOpen(open === z.tz ? null : z.tz)}
                    onPin={(cityId) => dispatch({ type: 'pin', cityId, atEnd: true })}
                    onHome={() => dispatch({ type: 'setHome', cityId: z.cities[0]?.id ?? null, tz: z.tz })}
                  />
                ))}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function ZoneRow({
  meta,
  now,
  open,
  onToggle,
  onPin,
  onHome,
}: {
  meta: ZoneMeta
  now: number
  open: boolean
  onToggle: () => void
  onPin: (cityId: string) => void
  onHome: () => void
}) {
  const snap = zoneSnapshot(meta.tz, now)
  const flagship = meta.cities[0] ?? flagshipCityForZone(meta.tz)
  const next = open ? nextTransition(meta.tz, now) : null
  const standard = open ? standardOffsetMs(meta.tz, now) : 0
  const primary = flagship?.name ?? meta.place

  return (
    <>
      <button className={`zrow${meta.mine.length ? ' is-mine' : ''}`} onClick={onToggle} aria-expanded={open}>
        <span className="place">
          <b>
            {primary}
            {meta.cities.length > 1 ? <span className="dim" style={{ fontWeight: 400 }}> +{meta.cities.length - 1} more</span> : null}
          </b>
          <span>{meta.tz}</span>
        </span>
        <span className="time">
          {hourAxisLabel(snap.hour, false)}:{String(snap.minute).padStart(2, '0')}
          <small>{snap.abbrev}</small>
        </span>
        <span className="badge">
          {meta.mine.length > 0 && <span className="chip acc">{meta.mine.length} pinned</span>}
          {snap.dst && <span className="chip warn">DST</span>}
          {!meta.moves && <span className="chip">fixed</span>}
          <Icon name={open ? 'up' : 'down'} size={14} />
        </span>
      </button>
      {open && (
        <div className="zexp">
          <dl className="detail">
            <div>
              <dt>Offset now</dt>
              <dd className="mono">{offsetLabel(snap.offsetMs)}</dd>
            </div>
            <div>
              <dt>Standard</dt>
              <dd className="mono">{offsetLabel(standard)}</dd>
            </div>
            <div>
              <dt>Abbreviation</dt>
              <dd className="mono">{snap.abbrev}</dd>
            </div>
            <div>
              <dt>Clocks change</dt>
              <dd>{meta.moves ? (next ? `${next.gains ? 'forward' : 'back'} ${new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short', timeZone: meta.tz }).format(next.at)} local` : 'not in the next 14 months') : 'never'}</dd>
            </div>
            <div className="wide">
              <dt>Places in the catalogue</dt>
              <dd>
                {meta.cities.length ? (
                  <span className="citypick">
                    {meta.cities.map((c) => (
                      <button key={c.id} className="btn tiny" onClick={() => onPin(c.id)} title="Pin to your board">
                        <Icon name="plus" /> {c.name}
                        <span className="dim">{c.country}</span>
                      </button>
                    ))}
                  </span>
                ) : (
                  <span className="dim">
                    No city in the catalogue uses this zone — it is usually a research station, an
                    island, or a fixed-offset band.
                  </span>
                )}
              </dd>
            </div>
            <div className="wide actions">
              <button className="btn tiny" onClick={onHome}>
                <Icon name="location" /> Measure everything from {meta.place}
              </button>
              {flagship && (
                <button
                  className="btn tiny"
                  onClick={() => onPin(flagship.id)}
                >
                  <Icon name="plus" /> Pin {flagship.name}
                </button>
              )}
            </div>
          </dl>
        </div>
      )}
    </>
  )
}
