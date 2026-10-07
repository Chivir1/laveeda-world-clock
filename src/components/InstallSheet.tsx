import { useState } from 'react'
import { copyToClipboard } from '../lib/share'
import { useInstall } from '../hooks/useInstall'
import { Icon } from './Icons'
import { Sheet } from './Sheet'

const PERKS = [
  ['Full screen', 'Opens as its own app, no browser chrome, no address bar.'],
  ['Offline', 'Once loaded, the whole app — clocks, cities, zones — works with no network.'],
  ['Launch shortcuts', 'Jump straight to the compare grid or your board from the icon.'],
] as const

export function InstallSheet({ onClose }: { onClose: () => void }) {
  const install = useInstall()
  const [copied, setCopied] = useState(false)

  const link = async () => {
    if (await copyToClipboard(typeof location === 'undefined' ? '' : location.origin + location.pathname)) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    }
  }

  return (
    <Sheet
      title={install.installed ? 'Installed' : 'Put Laveeda on your phone'}
      icon="install"
      onClose={onClose}
      labelledBy="install-title"
      footer={
        <>
          <button className="btn tiny ghost" onClick={() => void link()}>
            <Icon name="copy" /> {copied ? 'Link copied' : 'Copy the link'}
          </button>
          <span className="spacer" />
          {install.canInstall && (
            <button
              className="btn primary"
              onClick={async () => {
                const result = await install.promptInstall()
                if (result === 'accepted') onClose()
              }}
            >
              <Icon name="download" /> Install now
            </button>
          )}
        </>
      }
    >
      <div className="perks">
        {PERKS.map(([title, body]) => (
          <div key={title} className="perk">
            <b>{title}</b>
            <span>{body}</span>
          </div>
        ))}
      </div>

      {install.installed ? (
        <p className="notice accent" style={{ marginTop: 12 }}>
          <Icon name="check" />
          <span>This is already running as an installed app. Board and settings live on this device.</span>
        </p>
      ) : install.platform === 'ios' ? (
        <div className="steps" style={{ marginTop: 16 }}>
          <p className="muted" style={{ fontSize: 13, margin: 0 }}>
            Safari on iPhone and iPad has no install button — it asks you to add it yourself. Takes
            about fifteen seconds.
          </p>
          <div className="step">
            <b>1</b>
            <span>
              Open this page in <b>Safari</b> (Chrome on iOS cannot install web apps).
            </span>
          </div>
          <div className="step">
            <b>2</b>
            <span>
              Tap the Share button, then add to your Home Screen.
              <span className="how">
                <Icon name="share" /> Share
                <Icon name="right" size={13} />
                Add to Home Screen
              </span>
            </span>
          </div>
          <div className="step">
            <b>3</b>
            <span>
              Name it <b>Laveeda</b> and tap Add. The icon launches full-screen and keeps working
              offline.
            </span>
          </div>
        </div>
      ) : install.platform === 'android' ? (
        <div className="steps" style={{ marginTop: 16 }}>
          <div className="step">
            <b>1</b>
            <span>
              In Chrome, open the ⋮ menu → <b>Add to Home screen</b>. If the browser offers an
              install prompt, tap <b>Install</b> below instead.
            </span>
          </div>
          <div className="step">
            <b>2</b>
            <span>Confirm and the app icon appears with your other apps.</span>
          </div>
        </div>
      ) : (
        <div className="steps" style={{ marginTop: 16 }}>
          <div className="step">
            <b>1</b>
            <span>
              Look for the install icon at the right end of the address bar, or the ⋮ menu →{' '}
              <b>Install Laveeda</b>.
            </span>
          </div>
          <div className="step">
            <b>2</b>
            <span>
              It opens in its own window and can be pinned to the taskbar or dock.{' '}
              <kbd>⌘</kbd>/<kbd>Ctrl</kbd>+<kbd>K</kbd> still searches cities.
            </span>
          </div>
        </div>
      )}

      <p className="dim" style={{ fontSize: 11.5, marginTop: 16 }}>
        Nothing to download from an app store, and no account: your board is stored on this device.
        Installing from any browser that supports web apps works the same way — Android, iOS,
        Windows, macOS, Linux, ChromeOS.
      </p>
    </Sheet>
  )
}
