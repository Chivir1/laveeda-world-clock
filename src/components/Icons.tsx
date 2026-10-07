import type { ReactNode } from 'react'

/**
 * One stroke icon set, inlined: 24-grid paths, no icon font to download and
 * nothing to block first paint on a flaky connection.
 */
const PATHS: Record<string, ReactNode> = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.6-3.6" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M4 12.5l5 5L20 6.5" />,
  pin: (
    <>
      <path d="M12 21v-6" />
      <path d="M8 3h8l-1 6 3 2.5v1.5H6V11.5L9 9 8 3z" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.6 2.6 3.9 5.6 3.9 9s-1.3 6.4-3.9 9c-2.6-2.6-3.9-5.6-3.9-9S9.4 5.6 12 3z" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3.5 2" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" />
    </>
  ),
  moon: <path d="M20 14.2A8.4 8.4 0 019.8 4 8.5 8.5 0 1020 14.2z" />,
  sunrise: (
    <>
      <path d="M12 3.5v4M5.6 9.6L4.2 8.2M18.4 9.6l1.4-1.4M3 17h18M6.5 17a5.5 5.5 0 0111 0" />
      <path d="M8 21h8" />
    </>
  ),
  sunset: (
    <>
      <path d="M12 9.5v-4M5.6 9.6L4.2 8.2M18.4 9.6l1.4-1.4M3 17h18M6.5 17a5.5 5.5 0 0111 0" />
      <path d="M8 21h8" />
    </>
  ),
  share: (
    <>
      <path d="M12 16V4M8.5 7.5L12 4l3.5 3.5" />
      <path d="M5 12v7.5h14V12" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2.5" />
      <path d="M15.5 5.5A2.5 2.5 0 0013 3H6a3 3 0 00-3 3v7a2.5 2.5 0 002.5 2.5" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 14.5a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-2.7 1.1v.2a2 2 0 11-4 0v-.1a1.6 1.6 0 00-2.8-1.1l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00-1.1-2.7h-.2a2 2 0 110-4h.1a1.6 1.6 0 001.1-2.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 002.7-1.1v-.2a2 2 0 114 0v.1a1.6 1.6 0 002.8 1.1l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 001.1 2.7h.2a2 2 0 110 4h-.1a1.6 1.6 0 00-1.4 1z" />
    </>
  ),
  download: (
    <>
      <path d="M12 3.5v11M8 11l4 4 4-4" />
      <path d="M4.5 18.5h15" />
    </>
  ),
  install: (
    <>
      <rect x="6" y="2.5" width="12" height="19" rx="3" />
      <path d="M12 7v7M9.3 11.3L12 14l2.7-2.7" />
    </>
  ),
  location: (
    <>
      <circle cx="12" cy="12" r="7" />
      <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  drag: (
    <>
      <circle cx="9" cy="6" r="1.3" />
      <circle cx="15" cy="6" r="1.3" />
      <circle cx="9" cy="12" r="1.3" />
      <circle cx="15" cy="12" r="1.3" />
      <circle cx="9" cy="18" r="1.3" />
      <circle cx="15" cy="18" r="1.3" />
    </>
  ),
  up: <path d="M6 14.5l6-6 6 6" />,
  down: <path d="M6 9.5l6 6 6-6" />,
  left: <path d="M14.5 6l-6 6 6 6" />,
  right: <path d="M9.5 6l6 6-6 6" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.8v.2" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11a8 8 0 10-2.6 6.3" />
      <path d="M20 4.5V11h-6" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3l9 4.6-9 4.6L3 7.6 12 3z" />
      <path d="M3 12.4L12 17l9-4.6" />
    </>
  ),
  table: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <path d="M3 9.5h18M9 9.5V19.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17M8.5 3v4M15.5 3v4" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 8h10M18 8h2M4 16h4M12 16h8" />
      <circle cx="16" cy="8" r="2" />
      <circle cx="10" cy="16" r="2" />
    </>
  ),
  spark: <path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9L12 3.5z" />,
  apple: (
    <path
      d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.1-2.8.9-3.6.9-.7 0-1.9-.9-3.1-.9-1.6 0-3.1.9-3.9 2.4-1.7 2.9-.4 7.2 1.2 9.6.8 1.2 1.8 2.5 3 2.4 1.2 0 1.6-.8 3.1-.8 1.4 0 1.8.8 3.1.7 1.3 0 2.1-1.2 2.9-2.3.9-1.3 1.3-2.6 1.3-2.7 0 0-2.5-1-2.6-3.7zM14 4.9c.7-.8 1.1-2 1-3.1-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.6 2.9-1.4z"
      strokeWidth="0.8"
    />
  ),
  play: <path d="M8 5.5l11 6.5-11 6.5z" />,
  wifi: (
    <>
      <path d="M4 8.5a12 12 0 0116 0M7 12a7.5 7.5 0 0110 0M10 15.3a3 3 0 014 0" />
      <path d="M12 19v.2" />
    </>
  ),
  offline: (
    <>
      <path d="M3 3l18 18" />
      <path d="M8.5 8.7A7.5 7.5 0 004 12M15.6 12.3A12 12 0 0120 8.5M6 16a7 7 0 013-1.8M12 19.2v.2" />
    </>
  ),
  star: (
    <path d="M12 3.8l2.5 5.2 5.7.8-4.1 4 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4.1-4 5.7-.8L12 3.8z" />
  ),
  external: (
    <>
      <path d="M13.5 4.5H19.5V10.5" />
      <path d="M19 5l-7.5 7.5" />
      <path d="M18 14v4.5A1.5 1.5 0 0116.5 20h-11A1.5 1.5 0 014 18.5v-11A1.5 1.5 0 015.5 6H10" />
    </>
  ),
}

export type IconName = keyof typeof PATHS

export function Icon({
  name,
  size = 18,
  className,
  strokeWidth = 1.7,
}: {
  name: IconName | string
  size?: number
  className?: string
  strokeWidth?: number
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name] ?? PATHS.info}
    </svg>
  )
}

/** The Laveeda mark: a meridian ring with a single moving hand. */
export function BrandMark({ size = 30 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className="brand-mark" aria-hidden="true">
      <circle cx="16" cy="16" r="12.4" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.55" />
      <ellipse cx="16" cy="16" rx="5.6" ry="12.4" fill="none" stroke="currentColor" strokeWidth="1.15" opacity="0.4" />
      <path d="M3.9 12.4h24.2M3.9 19.6h24.2" stroke="currentColor" strokeWidth="1.15" opacity="0.35" />
      <path d="M16 16V8.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 16l4.9 3.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <circle cx="16" cy="16" r="1.7" fill="currentColor" />
    </svg>
  )
}
