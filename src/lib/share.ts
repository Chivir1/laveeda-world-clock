/** Sharing: everything the app shows is addressable, so a link is the export. */

export function appUrl(params: Record<string, string | number | undefined>): string {
  if (typeof location === 'undefined') return '/'
  const q = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue
    q.set(key, String(value))
  }
  const search = q.toString()
  return `${location.origin}${location.pathname}${search ? `?${search}` : ''}`
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const el = document.createElement('textarea')
    el.value = text
    el.setAttribute('readonly', '')
    el.style.position = 'fixed'
    el.style.opacity = '0'
    document.body.appendChild(el)
    el.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(el)
    return ok
  } catch {
    return false
  }
}

export type ShareResult = 'shared' | 'copied' | 'failed'

export async function shareOrCopy(payload: { title: string; text: string; url: string }): Promise<ShareResult> {
  const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> }
  if (typeof nav.share === 'function') {
    try {
      await nav.share({ title: payload.title, text: payload.text, url: payload.url })
      return 'shared'
    } catch {
      /* dismissed or blocked — fall back to copying */
    }
  }
  return (await copyToClipboard(`${payload.text}\n${payload.url}`)) ? 'copied' : 'failed'
}

/** Cheap perceptible feedback that works without a toast system. */
export function flashElement(el: HTMLElement | null, className = 'flash'): void {
  if (!el) return
  el.classList.add(className)
  window.setTimeout(() => el.classList.remove(className), 900)
}
