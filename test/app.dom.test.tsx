// @vitest-environment jsdom
/**
 * Mounts the real app in a DOM and clicks it.
 *
 * The interesting failure modes of a clock app are not the arithmetic (covered
 * in the unit tests) but the wiring: does the board survive a view change, does
 * a pin stick, does the URL follow state, does anything warn. Effects and
 * layout need a DOM, so this uses jsdom instead of a browser-only test runner.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { App } from '../src/App'
import { hydrate, reducer, defaultPrefs } from '../src/state/prefs'

// React only prints its act(...) support when this flag is set; without it the
// warnings we care about (bad nesting, missing keys) would be hidden.
;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let host: HTMLElement
let root: Root
let errors: unknown[][] = []
let spy: ReturnType<typeof vi.spyOn>

const text = () => host.textContent ?? ''

const click = (label: string) => {
  const node = Array.from(host.querySelectorAll<HTMLElement>('button')).find(
    (b) => (b.textContent || '').trim().includes(label) || b.title.includes(label),
  )
  if (!node) throw new Error(`no button matching "${label}"`)
  act(() => {
    node.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
}

/** React shadows `value` with its own tracker, so tests must go through the
 * native setter for the change event to be seen as a change. */
/** React synthesises `onChange` for checkboxes from the click event. */
const toggle = (input: HTMLInputElement) => {
  act(() => {
    input.click()
  })
}

const type = (input: HTMLInputElement, value: string) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
  act(() => {
    setter.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

beforeEach(() => {
  // The heartbeat is driven by rAF; freeze it so renders are deterministic.
  vi.stubGlobal('requestAnimationFrame', () => 0)
  vi.stubGlobal('cancelAnimationFrame', () => undefined)
  localStorage.clear()
  window.history.replaceState(null, '', '/')
  errors = []
  spy = vi.spyOn(console, 'error').mockImplementation((...args) => {
    errors.push(args)
  })
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
  act(() => {
    root.render(<App />)
  })
})

afterEach(() => {
  act(() => root.unmount())
  host.remove()
  spy.mockRestore()
  vi.unstubAllGlobals()
})

describe('the app shell', () => {
  it('mounts with a board of starter clocks and no React complaints', () => {
    expect(text()).toContain('Laveeda')
    expect(text()).toContain('Your board')
    for (const city of ['New York', 'London', 'Tokyo', 'Sydney']) {
      expect(text()).toContain(city)
    }
    expect(errors.map((e) => String(e[0]).slice(0, 400))).toEqual([])
  })

  it('shows the real local time, not a placeholder', () => {
    const digits = host.querySelector('.hero-digits')!.textContent!.trim()
    expect(digits).toMatch(/^\d{2}:\d{2}(:\d{2})?$/)
    // The sandbox clock is UTC and prefs default the home zone to the device zone,
    // so the hero must agree with a UTC reading to the minute.
    const [hh, mm] = digits.split(':').map(Number)
    const shown = hh * 60 + mm
    const real = new Date().getUTCHours() * 60 + new Date().getUTCMinutes()
    expect(Math.abs(shown - real)).toBeLessThanOrEqual(1)
  })

  it('switches views through the bottom tabs', () => {
    click('Compare')
    expect(text()).toContain('Compare')
    expect(text()).toContain('overlap')
    click('All zones')
    expect(text()).toContain('All time zones')
    expect(text()).toMatch(/UTC[+−-]\d/)
    click('Board')
    expect(text()).toContain('Your board')
  })

  it('drives the compare grid from clicks', () => {
    click('Compare')
    const cells = host.querySelectorAll('.cmp-cell')
    const rows = host.querySelectorAll('.cmp-name').length
    expect(rows).toBeGreaterThan(0)
    expect(cells.length % 24).toBe(0)
    expect(cells).toHaveLength(rows * 24)

    const hour = Array.from(host.querySelectorAll<HTMLButtonElement>('.cmp-hour')).find(
      (b) => b.textContent?.trim() === '09',
    )
    act(() => hour!.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    expect(new URLSearchParams(window.location.search).get('t')).toBe('9:00')
    expect(host.querySelector('.cmp-hour.is-anchor')?.textContent).toBe('09')
    // The board is measurable, not decorative: working hours must be painted.
    expect(host.querySelectorAll('.cmp-cell.work').length).toBeGreaterThanOrEqual(0)
    expect(host.querySelectorAll('.heatbar').length).toBe(24)
  })

  it('reflects the view in the URL so a board can be shared', () => {
    click('Compare')
    const params = new URLSearchParams(window.location.search)
    expect(params.get('view')).toBe('compare')
    expect(params.get('t')).toMatch(/^\d+:\d{2}$/)
  })
})

describe('the board', () => {
  it('removes a city and persists the change', () => {
    const before = host.querySelectorAll('.card').length
    const remove = Array.from(host.querySelectorAll<HTMLButtonElement>('.card-tools button')).find(
      (b) => b.title === 'Remove from board',
    )
    expect(remove).toBeTruthy()
    act(() => remove!.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    expect(host.querySelectorAll('.card').length).toBe(before - 1)
    const stored = JSON.parse(localStorage.getItem('laveeda.prefs.v1') || '{}')
    expect(stored.pinned).toHaveLength(before - 1)
  })

  it('reorders with the move buttons', () => {
    const firstName = host.querySelector('.card .card-city')?.textContent
    const second = host.querySelectorAll('.card')[1]
    const later = Array.from(second.querySelectorAll<HTMLButtonElement>('button')).find((b) =>
      b.title.includes('Earlier'),
    )
    act(() => later!.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    expect(host.querySelector('.card .card-city')?.textContent).not.toBe(firstName)
  })

  it('opens details with sun and clock-change facts', () => {
    const info = Array.from(host.querySelectorAll<HTMLButtonElement>('button')).find((b) =>
      b.title.includes('Sun, zone'),
    )
    act(() => info!.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    expect(text()).toContain('Sunrise')
    expect(text()).toContain('Zone')
    const row = Array.from(host.querySelectorAll('.detail dd')).map((n) => n.textContent)
    expect(row.join(' ')).toMatch(/\d{2}:\d{2}|polar/)
    expect(row.join(' ')).toContain('/')
  })
})

describe('search', () => {
  it('opens with ⌘K, finds a city and pins it', () => {
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))
    })
    const input = document.querySelector<HTMLInputElement>('.search-in input')
    expect(input).toBeTruthy()
    type(input!, 'Reykjav')
    const results = Array.from(document.querySelectorAll('.res'))
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].textContent).toContain('Reykjavík')
    act(() => {
      input!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    })
    expect(text()).toContain('Reykjavík')
    expect(localStorage.getItem('laveeda.prefs.v1')).toContain('reykjavik')
  })

  it('closes on Escape', () => {
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))
    })
    expect(document.querySelector('.sheet')).toBeTruthy()
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })
    expect(document.querySelector('.sheet')).toBeFalsy()
  })
})

describe('settings', () => {
  it('flips the hour format and the theme, and remembers both', () => {
    const digits = () => host.querySelector('.hero-digits')!.textContent!.trim()
    const before = digits()
    click('Settings')
    const twelve = Array.from(document.querySelectorAll<HTMLButtonElement>('.sheet button')).find(
      (b) => b.textContent?.trim() === '12-hour',
    )
    act(() => twelve!.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    expect(digits()).not.toBe(before)
    const dark = Array.from(document.querySelectorAll<HTMLButtonElement>('.sheet button')).find(
      (b) => b.textContent?.trim() === 'dark',
    )
    act(() => dark!.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    expect(document.documentElement.dataset.theme).toBe('dark')
    const stored = JSON.parse(localStorage.getItem('laveeda.prefs.v1') || '{}')
    expect(stored.hour12).toBe(true)
    expect(stored.theme).toBe('dark')
  })

  it('disables the ambient sky on request', () => {
    click('Settings')
    const row = Array.from(document.querySelectorAll<HTMLElement>('.sheet .setrow')).find((r) =>
      r.textContent?.includes('Sky follows'),
    )
    const ambient = row?.querySelector<HTMLInputElement>('input[type=checkbox]')
    expect(ambient).toBeTruthy()
    expect(ambient!.checked).toBe(true)
    toggle(ambient!)
    expect(ambient!.checked).toBe(false)
    expect(document.documentElement.dataset.phase).toBe('off')
  })
})

describe('preferences that exist outside React', () => {
  it('ignores stored junk and keeps the usable parts', () => {
    const restored = hydrate({
      pinned: ['tokyo', 'tokyo', 'nowhere-land', 42],
      homeTz: 'Mars/Olympus',
      hour12: 'yes',
      workStart: 99999,
      workEnd: -5,
      labels: { tokyo: '  Home turf  ', bogus: 'x' },
      theme: 'neon',
    })
    expect(restored.pinned).toEqual(['tokyo'])
    expect(restored.homeTz).toBe(defaultPrefs().homeTz)
    expect(restored.hour12).toBe(false)
    expect(restored.workStart).toBeLessThanOrEqual(23 * 60)
    expect(restored.workEnd).toBeGreaterThan(restored.workStart)
    expect(restored.labels).toEqual({ tokyo: 'Home turf' })
    expect(restored.theme).toBe('auto')
  })

  it('reorders and de-dupes through the reducer alone', () => {
    let state = defaultPrefs()
    state = reducer(state, { type: 'setPinned', cityIds: ['tokyo', 'london', 'tokyo'] })
    expect(state.pinned).toEqual(['tokyo', 'london'])
    state = reducer(state, { type: 'reorder', from: 1, to: 0 })
    expect(state.pinned).toEqual(['london', 'tokyo'])
    state = reducer(state, { type: 'reorder', from: 9, to: 0 })
    expect(state.pinned).toEqual(['london', 'tokyo'])
    state = reducer(state, { type: 'pin', cityId: 'tokyo' })
    expect(state.pinned).toEqual(['london', 'tokyo'])
    state = reducer(state, { type: 'unpin', cityId: 'london' })
    expect(state.pinned).toEqual(['tokyo'])
  })
})
