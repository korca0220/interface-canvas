import { useDocStore } from '../model/store'

/** 노드에 연결된 관계 목록. 클릭하면 해당 관계를 선택한다. */
export function RelationList({ nodeId }: { nodeId: string }) {
  const doc = useDocStore((s) => s.doc)
  const rels = doc.relations.filter((r) => r.from === nodeId || r.to === nodeId)
  if (!rels.length) return null
  const nameOf = (id: string) => doc.interfaces.find((n) => n.id === id)?.name ?? '?'
  return (
    <div className="field-block">
      <div className="field-label">
        <span>관계</span>
        <span className="field-hint">{rels.length}개</span>
      </div>
      <ul className="rel-list">
        {rels.map((r) => (
          <li key={r.id}>
            <button className="ghost rel-item" onClick={() => useDocStore.getState().setSelection({ nodes: [], edges: [r.id] })}>
              <span className={r.from === nodeId ? 'strong' : ''}>{nameOf(r.from)}</span>
              <span className="rel-type">{r.type}</span>
              <span className={r.to === nodeId ? 'strong' : ''}>{nameOf(r.to)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
