import { CITIES, STARTER_CITIES } from '../data/cities'
import { cityState } from '../lib/cityState'
import { useClock } from '../hooks/useClock'
import { useListDnd } from '../hooks/useListDnd'
import { usePrefs } from '../state/prefs'
import { CityCard } from './CityCard'
import { Icon } from './Icons'

/** The board: your pinned clocks, in the order you put them. */
export function Board({ onSearch }: { onSearch: () => void }) {
  const { prefs, dispatch, pinnedCities } = usePrefs()
  const now = useClock('second')
  const { itemProps, stateFor } = useListDnd(pinnedCities.length, (from, to) =>
    dispatch({ type: 'reorder', from, to }),
  )

  const sorted = prefs.sort === 'hour'
  const suggestions = STARTER_CITIES.filter((id) => !prefs.pinned.includes(id))
    .map((id) => CITIES.find((c) => c.id === id))
    .filter((c): c is (typeof CITIES)[number] => Boolean(c))

  return (
    <section className="sec">
      <div className="toolbar">
        <h2>Your board</h2>
        <span className="count">
          {pinnedCities.length} {pinnedCities.length === 1 ? 'clock' : 'clocks'}
        </span>
        <span className="spacer" />
        <div className="seg" role="group" aria-label="Order of the board">
          {(
            [
              ['manual', 'Pinned'],
              ['hour', 'By hour'],
              ['offset', 'By offset'],
              ['name', 'A–Z'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              aria-pressed={prefs.sort === key}
              onClick={() => dispatch({ type: 'patch', patch: { sort: key } })}
            >
              {label}
            </button>
          ))}
        </div>
        <button className="btn" onClick={onSearch}>
          <Icon name="plus" /> Add city
        </button>
      </div>

      {pinnedCities.length === 0 ? (
        <div className="panel" style={{ padding: 22 }}>
          <h3 style={{ fontSize: 17 }}>Nothing pinned yet</h3>
          <p className="muted" style={{ fontSize: 13.5, maxWidth: '52ch', marginTop: 6 }}>
            A world clock is only useful for the places you actually care about. Start with a
            spread across the planet and take it from there.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
            {suggestions.map((city) => (
              <button key={city.id} className="btn tiny" onClick={() => dispatch({ type: 'pin', cityId: city.id, atEnd: true })}>
                <Icon name="plus" /> {city.name}
              </button>
            ))}
            <button className="btn tiny ghost" onClick={onSearch}>
              Search the catalogue
            </button>
          </div>
        </div>
      ) : (
        <div className="board">
          {pinnedCities.map((city, index) => (
            <CityCard
              key={city.id}
              city={city}
              index={index}
              total={pinnedCities.length}
              dndProps={itemProps(index)}
              dndState={stateFor(index)}
              onMove={(from, to) => dispatch({ type: 'reorder', from, to })}
            />
          ))}
        </div>
      )}

      {sorted && pinnedCities.length > 1 && (
        <p className="footnote">
          <Icon name="info" size={14} />
          Ordered by the local hour on each clock, so the day reads left to right around the
          planet.
        </p>
      )}

      {pinnedCities.length > 3 && (
        <div className="cmp-aside" style={{ marginTop: 18 }}>
          <WorldStrip
            cities={pinnedCities.map((c) => ({
              id: c.id,
              name: c.name,
              activity: cityState(c, now, prefs.homeTz).activity,
              hour: cityState(c, now, prefs.homeTz).snap.hour,
            }))}
          />
        </div>
      )}
    </section>
  )
}

/** A single line that says who is awake — glanceable, no reading required. */
function WorldStrip({ cities }: { cities: { id: string; name: string; activity: string; hour: number }[] }) {
  const ordered = [...cities].sort((a, b) => a.hour - b.hour)
  return (
    <div className="panel" style={{ padding: '10px 12px' }}>
      <div className="legend" style={{ gap: 6 }}>
        <span className="micro" style={{ marginRight: 4 }}>
          The day, in order
        </span>
        {ordered.map((c) => (
          <span
            key={c.id}
            className={`chip${c.activity === 'working' ? ' work' : c.activity === 'asleep' ? ' sleep' : ''}`}
            title={`${c.name} — ${String(c.hour).padStart(2, '0')}:00, ${c.activity}`}
            style={{ fontSize: 11 }}
          >
            {c.name} {String(c.hour).padStart(2, '0')}
          </span>
        ))}
      </div>
    </div>
  )
}
