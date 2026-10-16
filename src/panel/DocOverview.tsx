import { useState } from 'react'
import { useDocStore } from '../model/store'
import { useFocusNode } from '../canvas/useFocusNode'
import { MarkdownEditor } from './MarkdownEditor'

export function DocOverview() {
  const doc = useDocStore((s) => s.doc)
  const updateMeta = useDocStore((s) => s.updateDocMeta)
  const focusNode = useFocusNode()
  const [filter, setFilter] = useState('')
  const list = [...doc.interfaces]
    .filter((n) => n.name.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="editor">
      <div className="editor-title">
        <input
          className="name-input"
          value={doc.name}
          placeholder="문서 이름"
          onChange={(e) => updateMeta({ name: e.target.value }, { coalesce: 'docname' })}
        />
      </div>
      <div className="kind-help">
        인터페이스 {doc.interfaces.length}개 · 관계 {doc.relations.length}개
      </div>

      <MarkdownEditor
        label="문서 메모"
        value={doc.memo ?? ''}
        onChange={(memo) => updateMeta({ memo }, { coalesce: 'docmemo' })}
        placeholder="문서 전체에 대한 메모 (마크다운)"
      />

      <div className="field-block">
        <div className="field-label">
          <span>인터페이스 목록</span>
          <input className="mini-filter" placeholder="필터" value={filter} onChange={(e) => setFilter(e.target.value)} />
        </div>
        {list.length === 0 ? (
          <div className="muted">
            {doc.interfaces.length === 0 ? '캔버스 빈 곳을 더블클릭해서 인터페이스를 만드세요.' : '일치하는 항목이 없습니다.'}
          </div>
        ) : (
          <ul className="iface-list">
            {list.map((n) => (
              <li key={n.id}>
                <button className="ghost iface-item" onClick={() => focusNode(n.id)}>
                  <span className="dot" style={{ background: n.color ?? '#94a3b8' }} />
                  <span className="strong">{n.name}</span>
                  <span className="muted">{n.kind}</span>
                  <span className="muted count">
                    {n.fields.length}f · {n.methods.length}m
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
