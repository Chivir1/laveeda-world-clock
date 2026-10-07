import { useState } from 'react'
import { CITIES, cityById } from '../data/cities'
import { nearestCity } from '../lib/geo'
import { cityState } from '../lib/cityState'
import { dateLine, digital, offsetShort } from '../lib/format'
import { offsetLabel, zoneSnapshot } from '../lib/time'
import { useClock } from '../hooks/useClock'
import { usePrefs } from '../state/prefs'
import { DayArc } from './DayArc'
import { Icon } from './Icons'

/**
 * The reference panel. Everything else on the board is measured against this
 * clock, so it gets the biggest type on the page.
 */
function safeSnapshot(tz: string, at: number) {
  try {
    return zoneSnapshot(tz, at)
  } catch {
    return zoneSnapshot('UTC', at)
  }
}

export function Hero({ onSearch }: { onSearch: () => void }) {
  const { prefs, dispatch, homeCity, pinnedCities } = usePrefs()
  const now = useClock('second')
  const [geoState, setGeoState] = useState<
    | { kind: 'idle' }
    | { kind: 'busy' }
    | { kind: 'error'; message: string }
    | { kind: 'found'; cityId: string; km: number }
  >({ kind: 'idle' })

  const refTz = prefs.homeTz
  const state = homeCity ? cityState(homeCity, now, refTz) : null
  const snap = state?.snap ?? safeSnapshot(refTz, now)
  const time = digital(snap, { hour12: prefs.hour12, seconds: prefs.seconds })

  const utc = new Date(now)
  const utcLabel = `${String(utc.getUTCHours()).padStart(2, '0')}:${String(utc.getUTCMinutes()).padStart(2, '0')}:${String(utc.getUTCSeconds()).padStart(2, '0')}`

  const tally = { working: 0, awake: 0, asleep: 0 }
  for (const city of pinnedCities) {
    if (city.id === homeCity?.id) continue
    tally[cityState(city, now, refTz).activity] += 1
  }

  const locate = () => {
    if (!('geolocation' in navigator)) {
      setGeoState({ kind: 'error', message: 'This browser has no geolocation. Pick your city instead.' })
      return
    }
    setGeoState({ kind: 'busy' })
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const hit = nearestCity(pos.coords.latitude, pos.coords.longitude)
        if (!hit) {
          setGeoState({ kind: 'error', message: 'Could not match that position to a city.' })
          return
        }
        setGeoState({ kind: 'found', cityId: hit.city.id, km: hit.km })
        dispatch({ type: 'setHome', cityId: hit.city.id, tz: hit.city.tz })
        dispatch({ type: 'pin', cityId: hit.city.id, atEnd: true })
      },
      (err) => {
        setGeoState({
          kind: 'error',
          message:
            err.code === err.PERMISSION_DENIED
              ? 'Location permission denied — search for your city instead.'
              : 'No fix. Search for your city instead.',
        })
      },
      { timeout: 8000, maximumAge: 600_000, enableHighAccuracy: false },
    )
  }

  const found = geoState.kind === 'found' ? cityById(geoState.cityId) : null

  return (
    <section className="hero">
      <div>
        <div className="hero-top">
          <span className="micro">{homeCity ? 'Your city' : 'Your zone'}</span>
          <div className="hero-place">
            <h1>{homeCity?.name ?? refTz.split('/').pop()?.replace(/_/g, ' ')}</h1>
            {homeCity && <span className="country">{homeCity.country}</span>}
          </div>
          <span className="chip strong" style={{ marginLeft: 'auto' }}>
            {offsetLabel(snap.offsetMs)}
            {state?.snap.dst ? ' · DST' : ''}
          </span>
        </div>

        <div className="hero-time">
          <div className="hero-digits" aria-live="off">
            {time.hours}
            <span className="sep">:</span>
            {time.minutes}
            {prefs.seconds && <span className="sec">:{time.seconds}</span>}
          </div>
          {prefs.hour12 && (
            <div className="hero-meridiem">
              <b>{time.suffix}</b>
              <span>{Number(time.seconds) >= 30 ? 'half past' : 'on the hour'}</span>
            </div>
          )}
        </div>

        <div className="hero-date">
          <span>{homeCity ? dateLine(homeCity.tz, now, 'long') : new Intl.DateTimeFormat(undefined, { dateStyle: 'full', timeZone: refTz }).format(now)}</span>
          <span className="dot dim">·</span>
          <span className="mono">{refTz}</span>
        </div>

        {state && (
          <div style={{ marginTop: 14 }}>
            <DayArc state={state} />
          </div>
        )}

        <div className="hero-actions" style={{ marginTop: 14 }}>
          <button className="btn" onClick={locate} disabled={geoState.kind === 'busy'}>
            <Icon name="location" /> {geoState.kind === 'busy' ? 'Locating…' : 'Use my location'}
          </button>
          <button className="btn" onClick={onSearch}>
            <Icon name="search" /> Add a city
          </button>
          <button
            className="btn ghost"
            onClick={() => dispatch({ type: 'patch', patch: { hour12: !prefs.hour12 } })}
            title="Switch between 24-hour and 12-hour time"
          >
            {prefs.hour12 ? '→ 24h' : '→ 12h'}
          </button>
        </div>

        {found && geoState.kind === 'found' && (
          <p className="notice accent" style={{ marginTop: 12 }} role="status">
            <Icon name="check" />
            <span>
              Nearest city in the catalogue: {found.name} · {geoState.km} km away — set as your
              home clock.
            </span>
          </p>
        )}
        {geoState.kind === 'error' && (
          <p className="notice" style={{ marginTop: 12 }} role="status">
            <Icon name="info" />
            <span>{geoState.message}</span>
          </p>
        )}
      </div>

      <div className="hero-side">
        <div className="statgrid">
          <div className="stat">
            <b className="mono">{utcLabel}</b>
            <span>UTC / GMT</span>
          </div>
          <div className="stat">
            <b className="mono">{offsetShort(snap.offsetMs)}</b>
            <span>your offset</span>
          </div>
          <div className="stat">
            <b className="mono">{pinnedCities.length}</b>
            <span>clocks pinned</span>
          </div>
          <div className="stat">
            <b className="mono">{CITIES.length}</b>
            <span>cities in the box</span>
          </div>
        </div>

        {pinnedCities.length > 0 && (
          <div className="notice">
            <Icon name="spark" />
            <span>
              On your board: {tally.working} at work · {tally.awake} up · {tally.asleep} asleep
              {state
                ? ` — the sun is ${state.altitudeDeg > 0 ? 'up' : 'down'} over ${homeCity?.name ?? 'you'} (${state.altitudeDeg.toFixed(0)}°)`
                : ''}
            </span>
          </div>
        )}

        {!homeCity && (
          <div className="notice">
            <Icon name="info" />
            <span>No city matches your device zone. Pick one and the whole board measures itself against it.</span>
          </div>
        )}
      </div>
    </section>
  )
}
