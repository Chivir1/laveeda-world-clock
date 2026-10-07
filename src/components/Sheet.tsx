import { useEffect, useRef, type ReactNode } from 'react'
import { useScrollLock } from '../hooks/useClock'
import { Icon, type IconName } from './Icons'

export function Sheet({
  title,
  icon = 'layers',
  onClose,
  children,
  footer,
  labelledBy,
}: {
  title: string
  icon?: IconName | string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  labelledBy?: string
}) {
  const panel = useRef<HTMLDivElement>(null)
  useScrollLock(true)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    // Focus the panel so keyboard users land inside the dialog.
    panel.current?.focus({ preventScroll: true })
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      <div className="scrim" onClick={onClose} aria-hidden="true" />
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={labelledBy ? undefined : title}
        aria-labelledby={labelledBy}
        tabIndex={-1}
        ref={panel}
      >
        <div className="grabber" />
        <div className="sheet-head">
          <Icon name={icon} size={17} />
          <h2 id={labelledBy}>{title}</h2>
          <span style={{ marginLeft: 'auto' }} />
          <button className="iconbtn sm" onClick={onClose} title="Close" aria-label="Close">
            <Icon name="close" />
          </button>
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </>
  )
}
