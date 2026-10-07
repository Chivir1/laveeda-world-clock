import { useState } from 'react'
import { CITIES, cityById } from '../data/cities'
import { deviceZone } from '../lib/geo'
import { listZones } from '../lib/time'
import { IANA_ZONES } from '../data/zones'
import { usePrefs } from '../state/prefs'
import { Icon } from './Icons'
import { Sheet } from './Sheet'

export function SettingsSheet({
  onClose,
  onInstall,
  updateAvailable,
  onReload,
}: {
  onClose: () => void
  onInstall: () => void
  updateAvailable: boolean
  onReload: () => void
}) {
  const { prefs, dispatch } = usePrefs()
  const [confirming, setConfirming] = useState(false)
  const device = deviceZone()
  const zoneCount = listZones(IANA_ZONES).length

  return (
    <Sheet title="Settings" icon="gear" onClose={onClose} labelledBy="settings-title">
      <div className="setgroup">
        <h3>Time</h3>
        <div className="setrow">
          <span>Hour format</span>
          <div className="seg" role="group" aria-label="Hour format">
            <button aria-pressed={!prefs.hour12} onClick={() => dispatch({ type: 'patch', patch: { hour12: false } })}>
              24-hour
            </button>
            <button aria-pressed={prefs.hour12} onClick={() => dispatch({ type: 'patch', patch: { hour12: true } })}>
              12-hour
            </button>
          </div>
        </div>
        <label className="setrow">
          <span>Show seconds</span>
          <span className="switch">
            <input
              type="checkbox"
              checked={prefs.seconds}
              onChange={(e) => dispatch({ type: 'patch', patch: { seconds: e.target.checked } })}
            />
            <span className="track" />
          </span>
        </label>
        <div className="setrow">
          <span>Board order</span>
          <select
            className="input"
            style={{ width: 160 }}
            value={prefs.sort}
            onChange={(e) => dispatch({ type: 'patch', patch: { sort: e.target.value as typeof prefs.sort } })}
          >
            <option value="manual">Pinned order</option>
            <option value="hour">By local hour</option>
            <option value="offset">By UTC offset</option>
            <option value="name">Alphabetical</option>
          </select>
        </div>
      </div>

      <div className="setgroup">
        <h3>Reference</h3>
        <div className="setrow">
          <span>Home city</span>
          <select
            className="input"
            style={{ width: 200 }}
            value={prefs.homeCityId ?? ''}
            onChange={(e) => {
              const city = cityById(e.target.value)
              dispatch({ type: 'setHome', cityId: city?.id ?? null, tz: city?.tz })
            }}
          >
            <option value="">None — device zone only</option>
            {CITIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}, {c.country}
              </option>
            ))}
          </select>
        </div>
        <div className="setrow">
          <span>Device zone</span>
          <span className="chip mono">{device}</span>
        </div>
        <label className="setrow">
          <span>Sky follows the sun</span>
          <span className="switch">
            <input
              type="checkbox"
              checked={prefs.ambient}
              onChange={(e) => dispatch({ type: 'patch', patch: { ambient: e.target.checked } })}
            />
            <span className="track" />
          </span>
        </label>
      </div>

      <div className="setgroup">
        <h3>App</h3>
        <div className="setrow">
          <span>Theme</span>
          <div className="seg" role="group" aria-label="Theme">
            {(['auto', 'light', 'dark'] as const).map((key) => (
              <button key={key} aria-pressed={prefs.theme === key} onClick={() => dispatch({ type: 'patch', patch: { theme: key } })}>
                {key}
              </button>
            ))}
          </div>
        </div>
        <div className="setrow">
          <span>Install on this device</span>
          <button className="btn tiny" onClick={onInstall}>
            <Icon name="install" /> How to install
          </button>
        </div>
        {updateAvailable && (
          <div className="setrow">
            <span>Offline copy</span>
            <button className="btn tiny primary" onClick={onReload}>
              <Icon name="refresh" /> Update now
            </button>
          </div>
        )}
        <div className="setrow">
          <span>Reset the board</span>
          {confirming ? (
            <span style={{ display: 'flex', gap: 6 }}>
              <button
                className="btn tiny"
                onClick={() => {
                  dispatch({ type: 'reset' })
                  setConfirming(false)
                }}
              >
                Yes, reset
              </button>
              <button className="btn tiny ghost" onClick={() => setConfirming(false)}>
                Keep
              </button>
            </span>
          ) : (
            <button className="btn tiny ghost" onClick={() => setConfirming(true)}>
              Clear pins and labels
            </button>
          )}
        </div>
        <p className="dim" style={{ fontSize: 11.5, margin: '4px 0 0' }}>
          {CITIES.length} cities, {zoneCount} IANA zones, every offset read from this device’s own
          tz database. No account, no server, nothing sent anywhere.
        </p>
      </div>
    </Sheet>
  )
}
