import { memo, useState, type CSSProperties } from 'react'
import type { City } from '../data/cities'
import { CITIES_BY_ZONE } from '../data/cities'
import { cityState } from '../lib/cityState'
import { dateLine, dayBadge, digital, duration, relativeDay } from '../lib/format'
import { diffLabel } from '../lib/time'
import { nextTransition, offsetLabel, observesDst } from '../lib/time'
import { appUrl, copyToClipboard, shareOrCopy } from '../lib/share'
import { useClock } from '../hooks/useClock'
import type { DndItemProps, DragState } from '../hooks/useListDnd'
import { usePrefs } from '../state/prefs'
import { Dial } from './Dial'
import { DayArc, hoursToClock } from './DayArc'
import { Icon } from './Icons'

type Props = {
  city: City
  index: number
  total: number
  dndProps: DndItemProps
  dndState: DragState
  onMove: (from: number, to: number) => void
}

export const CityCard = memo(function CityCard({ city, index, total, dndProps, dndState, onMove }: Props) {
  const { prefs, dispatch, homeCity } = usePrefs()
  const now = useClock('second')
  const [open, setOpen] = useState(false)
  const [flash, setFlash] = useState<string | null>(null)

  const state = cityState(city, now, prefs.homeTz)
  const { snap } = state
  const time = digital(snap, { hour12: prefs.hour12, seconds: prefs.seconds })
  const isHome = homeCity?.id === city.id
  const label = prefs.labels[city.id]?.trim() || city.name
  const siblings = (CITIES_BY_ZONE[city.tz] ?? []).filter((c) => c.id !== city.id)
  const localHour = snap.hour + snap.minute / 60 + snap.second / 3600

  const rename = () => {
    try {
      const name = window.prompt('Nickname shown on your board (leave empty to clear)', label)
      if (name === null) return
      dispatch({ type: 'label', cityId: city.id, label: name.slice(0, 40) })
    } catch {
      say('renaming is not available here')
    }
  }

  const say = (message: string) => {
    setFlash(message)
    window.setTimeout(() => setFlash(null), 1800)
  }

  const share = async (mode: 'copy' | 'share') => {
    const url = appUrl({
      city: city.id,
      tz: city.tz,
      view: 'compare',
      t: `${snap.hour}:${String(snap.minute).padStart(2, '0')}`,
    })
    const text = `${label} runs ${time.hours}:${time.minutes}${time.suffix ? ` ${time.suffix}` : ''} right now (${offsetLabel(snap.offsetMs)}, ${snap.abbrev})`
    if (mode === 'copy') say((await copyToClipboard(url)) ? 'link copied' : 'could not copy')
    else {
      const result = await shareOrCopy({ title: `${label} — Laveeda`, text, url })
      say(result === 'copied' ? 'link copied' : result === 'shared' ? 'shared' : 'could not share')
    }
  }

  const className = [
    'card',
    isHome ? 'is-home' : '',
    dndState.dragging ? 'dragging' : '',
    dndState.before ? 'drop-before' : '',
    dndState.after ? 'drop-after' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <article
      className={className}
      style={{ '--edge': state.sky.dark ? 'var(--moon)' : 'var(--sun)' } as CSSProperties}
      {...dndProps}
    >
      <div className="card-tools">
        <button
          className="iconbtn sm"
          title="Earlier on the board"
          disabled={index === 0}
          onClick={() => onMove(index, Math.max(0, index - 1))}
        >
          <Icon name="left" />
        </button>
        <button
          className="iconbtn sm"
          title="Later on the board"
          disabled={index >= total - 1}
          onClick={() => onMove(index, Math.min(total - 1, index + 1))}
        >
          <Icon name="right" />
        </button>
        <button
          className="iconbtn sm"
          title={open ? 'Hide details' : 'Sun, zone and clock changes'}
          aria-pressed={open}
          onClick={() => setOpen((v) => !v)}
        >
          <Icon name="info" />
        </button>
        {!isHome && (
          <button
            className="iconbtn sm"
            title="Set as my home clock"
            onClick={() => dispatch({ type: 'setHome', cityId: city.id, tz: city.tz })}
          >
            <Icon name="location" />
          </button>
        )}
        <button className="iconbtn sm" title="Remove from board" onClick={() => dispatch({ type: 'unpin', cityId: city.id })}>
          <Icon name="close" />
        </button>
      </div>

      <Dial state={state} />

      <div className="card-body">
        <div className="card-top">
          <h3 className="card-city">{label}</h3>
          <span className={`card-diff${state.diffMs === 0 ? ' zero' : ''}`}>
            {isHome ? 'your clock' : diffLabel(state.diffMs)}
          </span>
        </div>

        <div className="card-time">
          <b>
            {time.hours}:{time.minutes}
          </b>
          {prefs.seconds && <span className="sec">:{time.seconds}</span>}
          {time.suffix && <span className="mer">{time.suffix}</span>}
          {state.dayDiff !== 0 && (
            <span className="chip" title={relativeDay(state.dayDiff)}>
              {dayBadge(state.dayDiff)}
            </span>
          )}
        </div>

        <div className="card-sub">
          <span className="date">{dateLine(city.tz, now)}</span>
          <span className="offset">{snap.abbrev}</span>
          <span className="offset">{offsetLabel(snap.offsetMs)}</span>
          {snap.dst && <span className="chip warn">summer time</span>}
        </div>

        {city.note && <p className="card-note">{city.note}</p>}

        <DayArc state={state} compact />

        <div className="card-foot">
          <span className={`chip dot${state.activity === 'working' ? ' work' : state.activity === 'asleep' ? ' sleep' : ''}`}>
            {state.sky.label}
          </span>
          {flash && <span className="chip acc">{flash}</span>}
          <span className="spacer" />
          {!open && (
            <button className="btn tiny ghost" onClick={() => setOpen(true)}>
              Details
            </button>
          )}
        </div>

        {open && (
          <dl className="detail">
            <div>
              <dt>Sunrise</dt>
              <dd className="mono">{hoursToClock(state.day.sunriseH)}</dd>
            </div>
            <div>
              <dt>Sunset</dt>
              <dd className="mono">{hoursToClock(state.day.sunsetH)}</dd>
            </div>
            <div>
              <dt>Daylight</dt>
              <dd className="mono">
                {state.day.lengthMin === null ? 'polar' : duration(state.day.lengthMin * 60_000)}
              </dd>
            </div>
            <div>
              <dt>Sun now</dt>
              <dd className="mono">
                {state.altitudeDeg.toFixed(1)}° / {Math.round(state.azimuthDeg)}°
              </dd>
            </div>
            <div className="wide">
              <dt>Zone</dt>
              <dd className="mono break">{city.tz}</dd>
            </div>
            <div className="wide">
              <dt>Clocks</dt>
              <dd>{clockNote(city.tz, now, snap.dst)}</dd>
            </div>
            <div className="wide">
              <dt>Share the day</dt>
              <dd>
                {siblings.length
                  ? siblings.slice(0, 5).map((c) => c.name).join(', ') + (siblings.length > 5 ? ` +${siblings.length - 5} more` : '')
                  : 'no other city on this board shares this zone'}
              </dd>
            </div>
            <div className="wide actions">
              <button className="btn tiny" onClick={() => dispatch({ type: 'patch', patch: { view: 'compare', anchorHour: Math.round(Math.min(23, Math.max(0, localHour))) } })}>
                <Icon name="layers" /> Compare at this hour
              </button>
              <button className="btn tiny" onClick={() => void share('share')}>
                <Icon name="share" /> Share
              </button>
              <button className="btn tiny" onClick={() => void share('copy')}>
                <Icon name="copy" /> Copy link
              </button>
              <button className="btn tiny" onClick={() => rename()}>
                <Icon name="star" /> Rename
              </button>
            </div>
          </dl>
        )}
      </div>
    </article>
  )
})

function clockNote(tz: string, now: number, isDst: boolean): string {
  if (!observesDst(tz, now)) return 'Never changes — one offset all year.'
  const next = nextTransition(tz, now)
  if (!next) return isDst ? 'On summer time; no further change this year.' : 'On standard time; no further change this year.'
  const when = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: tz,
  }).format(next.at)
  return `${isDst ? 'On summer time' : 'On standard time'} — clocks go ${next.gains ? 'forward' : 'back'} at ${when} local.`
}
