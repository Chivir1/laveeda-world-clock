import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { bindUpdateSW, setOfflineReady, setUpdateReady } from './lib/sw'
import './styles/base.css'
import './styles/views.css'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Laveeda needs a #root element to mount into')

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

document.getElementById('boot')?.remove()

if (import.meta.env.PROD) {
  void import('virtual:pwa-register').then(({ registerSW }) => {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      setUpdateReady(true)
    },
    onOfflineReady() {
      setOfflineReady(true)
    },
    onRegisteredSW(_url, registration) {
      // A once-an-hour check means a phone that is opened every morning picks
      // up new tz data or app versions without the user doing anything.
      if (registration) {
        window.setInterval(() => {
          void registration.update().catch(() => undefined)
        }, 60 * 60 * 1000)
      }
    },
  })
  bindUpdateSW(updateSW)
  })
}
