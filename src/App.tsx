import { useCallback, useEffect, useState } from 'react'
import { BrandMark, Icon } from './components/Icons'
import { Board } from './components/Board'
import { Hero } from './components/Hero'
import { CompareView } from './components/CompareView'
import { ZonesView } from './components/ZonesView'
import { SearchSheet } from './components/SearchSheet'
import { SettingsSheet } from './components/SettingsSheet'
import { InstallSheet } from './components/InstallSheet'
import { useClock } from './hooks/useClock'
import { usePrefersDark } from './hooks/useClock'
import { useInstall } from './hooks/useInstall'
import { sunPosition } from './lib/sun'
import { digital } from './lib/format'
import { zoneSnapshot } from './lib/time'
import { applyUpdate, useSw } from './lib/sw'
import { PrefsProvider, usePrefs, type ViewKey } from './state/prefs'

const VIEWS: { key: ViewKey; label: string; icon: string }[] = [
  { key: 'board', label: 'Board', icon: 'clock' },
  { key: 'compare', label: 'Compare', icon: 'layers' },
  { key: 'zones', label: 'All zones', icon: 'globe' },
]

export function App() {
  return (
    <PrefsProvider>
      <Shell />
    </PrefsProvider>
  )
}

function Shell() {
  const { prefs, dispatch, homeCity } = usePrefs()
  const prefersDark = usePrefersDark()
  const dark = prefs.theme === 'dark' || (prefs.theme === 'auto' && prefersDark)
  const now = useClock('minute')
  const install = useInstall()
  const { updateReady: updateAvailable } = useSw()
  const [sheet, setSheet] = useState<null | 'search' | 'settings' | 'install'>(null)
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    for (const meta of Array.from(document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]'))) {
      meta.setAttribute('content', dark ? '#070a13' : '#f5f6fb')
    }
  }, [dark])

  // The ambient sky: the reference city's own sun, tinted into the background.
  useEffect(() => {
    const root = document.documentElement
    if (!prefs.ambient) {
      root.dataset.phase = 'off'
      root.style.removeProperty('--sky-1')
      root.style.removeProperty('--sky-2')
      root.style.removeProperty('--sky-glow')
      return
    }
    const snap = zoneSnapshot(prefs.homeTz, now)
    const lng = snap.offsetMs / 3_600_000 * 15
    const lat = homeCity?.lat ?? 20
    const altitude = sunPosition(now, lat, homeCity?.lng ?? lng).altitude / (Math.PI / 180)
    const phase = altitude >= 8 ? 'day' : altitude > 0 ? 'golden' : altitude > -6 ? 'twilight' : 'night'
    root.dataset.phase = phase
    const palettes: Record<string, [string, string, string]> = {
      day: dark ? ['#12233f', '#070a13', 'rgba(150,200,255,0.16)'] : ['#d9e8ff', '#f5f6fb', 'rgba(255,215,150,0.5)'],
      golden: dark ? ['#2c1d24', '#070a13', 'rgba(255,168,90,0.28)'] : ['#ffe6cd', '#f6f2ef', 'rgba(255,170,90,0.55)'],
      twilight: dark ? ['#171a3a', '#070a13', 'rgba(140,120,255,0.24)'] : ['#e2e2ff', '#f4f4fb', 'rgba(160,150,255,0.45)'],
      night: dark ? ['#080b18', '#05070f', 'rgba(90,120,220,0.16)'] : ['#dfe3f0', '#eef0f7', 'rgba(120,140,210,0.3)'],
    }
    const [s1, s2, glow] = palettes[phase]
    root.style.setProperty('--sky-1', s1)
    root.style.setProperty('--sky-2', s2)
    root.style.setProperty('--sky-glow', glow)
  }, [prefs.ambient, prefs.homeTz, homeCity?.id, dark, now])

  const openSearch = useCallback(() => setSheet('search'), [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing =
        !!target && (/^(input|textarea|select)$/i.test(target.tagName) || target.isContentEditable)
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSheet((s) => (s === 'search' ? null : 'search'))
        return
      }
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key === '/') {
        event.preventDefault()
        setSheet('search')
      } else if (event.key === '1') dispatch({ type: 'patch', patch: { view: 'board' } })
      else if (event.key === '2') dispatch({ type: 'patch', patch: { view: 'compare' } })
      else if (event.key === '3') dispatch({ type: 'patch', patch: { view: 'zones' } })
      else if (event.key.toLowerCase() === 'i') setSheet('install')
      else if (event.key.toLowerCase() === 't')
        dispatch({ type: 'patch', patch: { theme: dark ? 'light' : 'dark' } })
      else if (event.key === 'ArrowRight' && prefs.view === 'compare')
        dispatch({ type: 'patch', patch: { anchorHour: (prefs.anchorHour + 1) % 24 } })
      else if (event.key === 'ArrowLeft' && prefs.view === 'compare')
        dispatch({ type: 'patch', patch: { anchorHour: (prefs.anchorHour + 23) % 24 } })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dispatch, dark, prefs.view, prefs.anchorHour])

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  const snap = zoneSnapshot(prefs.homeTz, now)
  const top = digital(snap, { hour12: prefs.hour12, seconds: false })

  return (
    <div className="app">
      <div className="sky" />

      <header className="topbar">
        <div className="wrap topbar-in">
          <button className="brand" onClick={() => dispatch({ type: 'patch', patch: { view: 'board' } })} title="Laveeda — board">
            <BrandMark />
            <span className="brand-name">
              Laveeda <em>world clock</em>
            </span>
          </button>

          <div className="topnav">
            {VIEWS.map((v) => (
              <button
                key={v.key}
                aria-current={prefs.view === v.key}
                onClick={() => dispatch({ type: 'patch', patch: { view: v.key } })}
              >
                <Icon name={v.icon} size={15} />
                {v.label}
              </button>
            ))}
          </div>

          <div className="topbar-right">
            {!online && (
              <span className="chip" title="Nothing to load — the app is served from the local cache">
                <Icon name="offline" size={14} /> offline
              </span>
            )}
            {updateAvailable && (
              <button className="btn tiny primary" onClick={() => void applyUpdate()}>
                <Icon name="refresh" /> Update
              </button>
            )}
            <button className="homeclock" onClick={openSearch} title="Search cities (⌘K)">
              <span className="homeclock-time">
                {top.hours}:{top.minutes}
              </span>
              <span className="homeclock-meta">{homeCity?.name ?? prefs.homeTz.split('/').pop()}</span>
            </button>
            <button className="iconbtn" onClick={openSearch} title="Search cities" aria-label="Search cities">
              <Icon name="search" />
            </button>
            <button
              className="iconbtn"
              onClick={() => dispatch({ type: 'patch', patch: { theme: dark ? 'light' : 'dark' } })}
              title={dark ? 'Switch to light (T)' : 'Switch to dark (T)'}
              aria-label="Toggle theme"
            >
              <Icon name={dark ? 'sun' : 'moon'} />
            </button>
            <button className="iconbtn" onClick={() => setSheet('settings')} title="Settings" aria-label="Settings">
              <Icon name="gear" />
            </button>
            {!install.standalone && !install.canInstall && (
              <button className="iconbtn" onClick={() => setSheet('install')} title="Install on this device" aria-label="Install">
                <Icon name="install" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="main wrap">
        {!install.standalone && !prefs.seenInstallHint && (
          <div className="rail" style={{ marginBottom: 16 }}>
            <span className="rail-ico">
              <Icon name="install" />
            </span>
            <div>
              <b>Install Laveeda on this device</b>
              <p>
                It becomes a normal app icon, opens full screen, and keeps ticking with no network —
                nothing about your board leaves this device.
              </p>
            </div>
            <div className="actions">
              {install.canInstall ? (
                <button
                  className="btn primary"
                  onClick={async () => {
                    const result = await install.promptInstall()
                    if (result !== 'unavailable') dispatch({ type: 'patch', patch: { seenInstallHint: true } })
                  }}
                >
                  <Icon name="download" /> Install
                </button>
              ) : (
                <button className="btn" onClick={() => setSheet('install')}>
                  How to install
                </button>
              )}
              <button className="btn ghost" onClick={() => dispatch({ type: 'patch', patch: { seenInstallHint: true } })}>
                Not now
              </button>
            </div>
          </div>
        )}

        {prefs.view === 'board' && (
          <>
            <Hero onSearch={openSearch} />
            <Board onSearch={openSearch} />
          </>
        )}
        {prefs.view === 'compare' && <CompareView />}
        {prefs.view === 'zones' && <ZonesView />}

        <div className="footnote">
          <span>
            Laveeda · {VIEWS.length} views · offsets read live from this device’s IANA tz database
          </span>
          <span className="dim">·</span>
          <button className="btn tiny ghost" onClick={() => setSheet('settings')}>
            Settings
          </button>
          <span className="dim">·</span>
          <button className="btn tiny ghost" onClick={() => setSheet('install')}>
            Install
          </button>
          <span className="dim">·</span>
          <span>{online ? 'online' : 'offline'}, works either way</span>
        </div>
      </main>

      <nav className="tabs" aria-label="Views">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            aria-current={prefs.view === v.key}
            onClick={() => dispatch({ type: 'patch', patch: { view: v.key } })}
          >
            <Icon name={v.icon} />
            {v.label}
          </button>
        ))}
      </nav>

      {sheet === 'search' && <SearchSheet onClose={() => setSheet(null)} />}
      {sheet === 'settings' && (
        <SettingsSheet
          onClose={() => setSheet(null)}
          onInstall={() => setSheet('install')}
          updateAvailable={updateAvailable}
          onReload={() => void applyUpdate()}
        />
      )}
      {sheet === 'install' && <InstallSheet onClose={() => setSheet(null)} />}
    </div>
  )
}
