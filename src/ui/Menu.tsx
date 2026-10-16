import { useEffect, useRef, useState } from 'react'

export type MenuItem = { label: string; shortcut?: string; onClick: () => void; disabled?: boolean } | 'sep'

export function Menu({ label, items, className = '' }: { label: React.ReactNode; items: MenuItem[]; className?: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('mousedown', close)
    window.addEventListener('keydown', esc)
    return () => {
      window.removeEventListener('mousedown', close)
      window.removeEventListener('keydown', esc)
    }
  }, [open])

  return (
    <div className={`menu ${className}`} ref={ref}>
      <button className={`ghost ${open ? 'active' : ''}`} onClick={() => setOpen((o) => !o)}>
        {label}
      </button>
      {open && (
        <div className="menu-pop">
          {items.map((it, i) =>
            it === 'sep' ? (
              <div key={i} className="menu-sep" />
            ) : (
              <button
                key={i}
                className="menu-item"
                disabled={it.disabled}
                onClick={() => {
                  setOpen(false)
                  it.onClick()
                }}
              >
                <span>{it.label}</span>
                {it.shortcut && <span className="menu-shortcut">{it.shortcut}</span>}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  )
}
