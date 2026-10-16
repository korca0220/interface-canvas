import { useEffect, useMemo, useRef, useState } from 'react'
import { useDocStore } from '../model/store'
import { useFocusNode } from '../canvas/useFocusNode'
import { useUiStore } from './uiStore'
import { searchInterfaces } from './search'

export function SearchDialog() {
  const open = useUiStore((s) => s.searchOpen)
  if (!open) return null
  return <SearchDialogInner />
}

function SearchDialogInner() {
  const interfaces = useDocStore((s) => s.doc.interfaces)
  const close = () => useUiStore.getState().setSearchOpen(false)
  const focusNode = useFocusNode()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLUListElement>(null)
  const hits = useMemo(() => searchInterfaces(interfaces, query).slice(0, 50), [interfaces, query])

  useEffect(() => setActive(0), [query])
  useEffect(() => {
    listRef.current?.querySelector('.active')?.scrollIntoView({ block: 'nearest' })
  }, [active])

  const choose = (id: string) => {
    close()
    focusNode(id)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || (e.ctrlKey && e.key === 'n')) {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, hits.length - 1))
    } else if (e.key === 'ArrowUp' || (e.ctrlKey && e.key === 'p')) {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (hits[active]) choose(hits[active].node.id)
    } else if (e.key === 'Escape' || ((e.metaKey || e.ctrlKey) && e.key === 'k')) {
      e.preventDefault()
      close()
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="modal search-modal" role="dialog" aria-label="인터페이스 검색">
        <input
          autoFocus
          className="search-input"
          placeholder="인터페이스 이름 검색…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <ul className="search-results" ref={listRef}>
          {hits.length === 0 && <li className="muted search-empty">일치하는 인터페이스가 없습니다.</li>}
          {hits.map((h, i) => (
            <li key={h.node.id}>
              <button
                className={`search-item ${i === active ? 'active' : ''}`}
                onMouseMove={() => setActive(i)}
                onClick={() => choose(h.node.id)}
              >
                <span className="dot" style={{ background: h.node.color ?? '#94a3b8' }} />
                <span className="strong">{h.node.name}</span>
                <span className="muted">{h.node.kind}</span>
                {h.match && <span className="muted mono search-match">· {h.match}</span>}
              </button>
            </li>
          ))}
        </ul>
        <div className="modal-foot muted search-foot">↑↓ 이동 · Enter 열기 · Esc 닫기</div>
      </div>
    </div>
  )
}
