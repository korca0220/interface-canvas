import { useDocStore } from '../model/store'
import { useUiStore } from '../ui/uiStore'

export function MultiSelection() {
  const selection = useDocStore((s) => s.selection)
  const interfaces = useDocStore((s) => s.doc.interfaces)
  const selected = interfaces.filter((n) => selection.nodes.includes(n.id))
  return (
    <div className="editor">
      <div className="panel-heading">
        {selection.nodes.length}개 노드{selection.edges.length ? `, ${selection.edges.length}개 관계` : ''} 선택됨
      </div>
      <ul className="iface-list">
        {selected.map((n) => (
          <li key={n.id}>
            <button className="ghost iface-item" onClick={() => useDocStore.getState().setSelection({ nodes: [n.id], edges: [] })}>
              <span className="dot" style={{ background: n.color ?? '#94a3b8' }} />
              <span className="strong">{n.name}</span>
              <span className="muted">{n.kind}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="row">
        {selected.length > 0 && (
          <button onClick={() => useUiStore.getState().openExport('selection')}>선택 항목 내보내기</button>
        )}
        <button className="danger" onClick={() => useDocStore.getState().deleteItems(selection.nodes, selection.edges)}>
          모두 삭제
        </button>
      </div>
    </div>
  )
}
