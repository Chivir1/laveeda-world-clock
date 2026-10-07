import { memo } from 'react'
import type { CityState } from '../lib/cityState'

/**
 * A 24-hour dial, not a 12-hour one. For a world clock the useful signal is
 * "is that place awake", so the ring is a whole day: night around the bottom,
 * the sun's own arc above it, and a hand pointing at their moment.
 */

const CX = 50
const R_RING = 41
const R_DAY = 34
const TICK_COUNT = 24

function polar(hour: number, radius: number): [number, number] {
  const a = (hour / 24) * Math.PI * 2 - Math.PI / 2
  return [CX + radius * Math.cos(a), CX + radius * Math.sin(a)]
}

function arc(from: number, to: number, radius: number): string {
  const span = (to - from + 24) % 24
  const [x1, y1] = polar(from, radius)
  const [x2, y2] = polar(to, radius)
  const large = span > 12 ? 1 : 0
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radius} ${radius} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`
}

export const Dial = memo(function Dial({
  state,
  size = 62,
  labels = false,
}: {
  state: CityState
  size?: number
  labels?: boolean
}) {
  const { snap, day, sky } = state
  const nowHour = snap.hour + snap.minute / 60 + snap.second / 3600
  const rise = day.sunriseH ?? (day.start ? 6 : 6)
  const set = day.sunsetH ?? 18
  const polarDay = day.sunriseH === null && day.sunsetH === null && day.start > 0

  const [hx, hy] = polar(nowHour, R_RING - 5)
  const [tx, ty] = polar(nowHour, R_DAY + 3)

  // Evenly spaced dots beat 24 <line> elements: one stroked circle, one dash
  // pattern. Circumference / 24 keeps the ticks on the hour.
  const circ = 2 * Math.PI * R_RING
  const dash = circ / TICK_COUNT

  return (
    <div className="dial" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" role="img" aria-label={`${state.city.name}: ${sky.label}, ${String(snap.hour).padStart(2, '0')}:${String(snap.minute).padStart(2, '0')} local`}>
        <circle cx={CX} cy={CX} r={R_RING - 2} className="face" />
        <circle cx={CX} cy={CX} r={R_RING} className="ring" />
        <circle
          cx={CX}
          cy={CX}
          r={R_RING}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeDasharray={`0.9 ${dash - 0.9}`}
          strokeDashoffset={circ / 4 + dash / 2}
          strokeLinecap="round"
          style={{ color: 'var(--line-2)' }}
        />
        {polarDay ? (
          <circle
            cx={CX}
            cy={CX}
            r={R_DAY}
            fill="none"
            stroke={sky.dark ? 'var(--sleep)' : 'var(--sun)'}
            strokeWidth="4"
            opacity={0.75}
          />
        ) : (
          <>
            <path
              d={arc(set, rise, R_DAY)}
              fill="none"
              stroke="var(--sleep)"
              strokeWidth="4.5"
              strokeLinecap="round"
              opacity={0.55}
            />
            <path
              d={arc(rise, set, R_DAY)}
              fill="none"
              stroke="var(--sun)"
              strokeWidth="4.5"
              strokeLinecap="round"
              opacity={0.9}
            />
          </>
        )}
        {labels &&
          [0, 6, 12, 18].map((h) => {
            const [lx, ly] = polar(h, R_RING + 8)
            return (
              <text
                key={h}
                x={lx}
                y={ly}
                fontSize="7"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="var(--dim)"
                fontFamily="var(--mono)"
              >
                {String(h).padStart(2, '0')}
              </text>
            )
          })}
        <line x1={CX} y1={CX} x2={tx} y2={ty} stroke="var(--text)" strokeWidth="2.6" strokeLinecap="round" opacity={0.9} />
        <line x1={CX} y1={CX} x2={hx} y2={hy} stroke="var(--acc)" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx={hx} cy={hy} r={sky.dark ? 2.4 : 3.1} fill={sky.dark ? 'var(--moon)' : 'var(--sun)'} />
        <circle cx={CX} cy={CX} r={1.9} fill="var(--acc)" />
        {labels && (
          <text
            x={CX}
            y={CX + 15}
            fontSize="7.5"
            textAnchor="middle"
            fill="var(--muted)"
            fontFamily="var(--mono)"
            letterSpacing="0.5"
          >
            {snap.abbrev}
          </text>
        )}
      </svg>
    </div>
  )
})
