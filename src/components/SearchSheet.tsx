import { useEffect, useMemo, useRef, useState } from 'react'
import { CITIES, CITIES_BY_ZONE, REGIONS, type City } from '../data/cities'
import { digital, offsetShort } from '../lib/format'
import { offsetLabel, zoneSnapshot } from '../lib/time'
import { searchCities } from '../lib/search'
import { useClock } from '../hooks/useClock'
import { usePrefs } from '../state/prefs'
import { Icon } from './Icons'
import { Sheet } from './Sheet'

/**
 * ⌘K search. One box for the whole catalogue: type a city, a country, a zone
 * id or an offset, and act on it without leaving the keyboard.
 */

const ODDITIES = [
  'eucla',
  'chatham-islands',
  'kiritimati',
  'st-johns',
  'kathmandu',
  'troll',
  'pago-pago',
  'lord-howe',
]

export function SearchSheet({ onClose }: { onClose: () => void }) {
  const { dispatch, prefs } = usePrefs()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const now = useClock('second')
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLDivElement>(null)

  useEffect(() => {
    input.current?.focus()
  }, [])

  const results = useMemo(() => {
    const hits = searchCities(query, CITIES, query ? 40 : 10).map((h) => h.city)
    const seen = new Set(hits.map((c) => c.id))
    const rest = (query ? [] : ODDITIES.map((id) => CITIES.find((c) => c.id === id)).filter((c): c is City => Boolean(c)))
    const merged = [...hits, ...rest.filter((c) => !seen.has(c.id))]
    return merged
  }, [query])

  useEffect(() => {
    setActive(0)
  }, [query])

  const pin = (city: City, mode: 'pin' | 'home' | 'compare') => {
    if (mode === 'pin') dispatch({ type: 'pin', cityId: city.id, atEnd: true })
    if (mode === 'home') dispatch({ type: 'setHome', cityId: city.id, tz: city.tz })
    if (mode === 'compare') {
      dispatch({ type: 'pin', cityId: city.id, atEnd: true })
      dispatch({ type: 'patch', patch: { view: 'compare' } })
    }
    onClose()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(results.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const city = results[active]
      if (city) pin(city, e.metaKey || e.ctrlKey ? 'home' : 'pin')
    }
  }

  useEffect(() => {
    const el = list.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)
    el?.scrollIntoView?.({ block: 'nearest' })
  }, [active])

  return (
    <Sheet
      title="Find a city"
      icon="search"
      onClose={onClose}
      labelledBy="search-title"
      footer={
        <>
          <span className="dim" style={{ fontSize: 11.5 }}>
            ↑↓ move · Enter pin · ⌘/Ctrl+Enter sets as home
          </span>
          <span className="spacer" />
          <span className="dim" style={{ fontSize: 11.5 }}>
            {CITIES.length} cities · {Object.keys(CITIES_BY_ZONE).length} zones
          </span>
        </>
      }
    >
      <label className="search-in panel" style={{ marginBottom: 10 }}>
        <Icon name="search" />
        <input
          ref={input}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Tokyo, Lagos, Europe/Oslo, UTC+5:45…"
          aria-label="Search cities"
          autoComplete="off"
          spellCheck={false}
        />
        {query && (
          <button className="iconbtn sm" onClick={() => { setQuery(''); input.current?.focus() }} title="Clear">
            <Icon name="close" size={15} />
          </button>
        )}
      </label>

      {!query && (
        <p className="micro" style={{ margin: '2px 0 8px' }}>
          Odd clocks worth a look
        </p>
      )}

      <div className="results" ref={list}>
        {results.length === 0 && (
          <p className="muted" style={{ padding: '14px 6px', fontSize: 13.5 }}>
            Nothing in the catalogue matches “{query}”. Every IANA zone is still available in{' '}
            <b>All time zones</b>.
          </p>
        )}
        {results.map((city, i) => {
          const snap = zoneSnapshot(city.tz, now)
          const time = digital(snap, { hour12: prefs.hour12, seconds: false })
          const isPinned = prefs.pinned.includes(city.id)
          return (
            <div
              className="res"
              key={city.id}
              data-i={i}
              aria-selected={i === active}
              role="option"
              onClick={(e) => pin(city, e.metaKey || e.ctrlKey ? 'home' : 'pin')}
              onDoubleClick={() => pin(city, 'compare')}
              style={{ cursor: 'pointer' }}
            >
              <span className="thumb">{city.cc}</span>
              <span className="main">
                <b>{city.name}</b>
                <span>
                  {city.admin ? `${city.admin} · ` : ''}
                  {city.country} · {REGIONS[city.region]}
                </span>
              </span>
              <span className="t">
                {time.hours}:{time.minutes}
                {time.suffix ? ` ${time.suffix}` : ''}
              </span>
              <span className="off">
                {offsetShort(snap.offsetMs)}
                {isPinned ? ' · ✓' : ''}
              </span>
            </div>
          )
        })}
      </div>

      {query && (
        <p className="dim" style={{ fontSize: 11.5, marginTop: 10 }}>
          Offsets shown are live ({offsetLabel(zoneSnapshot('UTC', now).offsetMs)} is fixed). Double-click
          to pin and jump straight to the compare grid.
        </p>
      )}
    </Sheet>
  )
}
