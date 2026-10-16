import { useDocStore } from '../model/store'
import { RELATION_TYPES, type RelationType } from '../model/types'
import { RELATION_STYLE } from '../canvas/RelationEdge'

const DESCRIPTION: Record<RelationType, string> = {
  implements: 'A implements B — 인터페이스 구현 (점선 + 빈 삼각형)',
  extends: 'A extends B — 상속 (실선 + 빈 삼각형)',
  depends: 'A가 B에 의존 — 주입받는 의존성 (점선 화살표)',
  uses: 'A가 B를 사용 — 연관/참조 (실선 화살표)',
  creates: 'A가 B를 생성 (점선 화살표 + «create»)',
}

function LinePreview({ type }: { type: RelationType }) {
  const st = RELATION_STYLE[type]
  return (
    <svg width="44" height="12" viewBox="0 0 44 12" className="line-preview">
      <line x1="1" y1="6" x2={st.marker === 'triangle' ? 33 : 40} y2="6" strokeDasharray={st.dashed ? '4 3' : undefined} />
      {st.marker === 'triangle' ? <path d="M33,1 L43,6 L33,11 Z" className="hollow" /> : <path d="M35,1 L42,6 L35,11" fill="none" />}
    </svg>
  )
}

export function RelationEditor({ id }: { id: string }) {
  const rel = useDocStore((s) => s.doc.relations.find((r) => r.id === id))
  const interfaces = useDocStore((s) => s.doc.interfaces)
  const update = useDocStore((s) => s.updateRelation)
  if (!rel) return null
  const from = interfaces.find((n) => n.id === rel.from)
  const to = interfaces.find((n) => n.id === rel.to)
  const select = (nodeId: string) => useDocStore.getState().setSelection({ nodes: [nodeId], edges: [] })

  return (
    <div className="editor">
      <div className="panel-heading">관계</div>
      <div className="rel-ends">
        <button className="ghost strong" onClick={() => select(rel.from)}>
          {from?.name}
        </button>
        <span className="rel-arrow">→</span>
        <button className="ghost strong" onClick={() => select(rel.to)}>
          {to?.name}
        </button>
      </div>

      <div className="field-block">
        <div className="field-label">
          <span>종류</span>
          <span className="field-hint">1–5 키로 변경</span>
        </div>
        <div className="rel-types">
          {RELATION_TYPES.map((t, i) => (
            <label key={t} className={`rel-type-option ${rel.type === t ? 'on' : ''}`}>
              <input type="radio" name="rel-type" checked={rel.type === t} onChange={() => update(id, { type: t })} />
              <span className="kbd">{i + 1}</span>
              <span className="rel-type-name">{t}</span>
              <LinePreview type={t} />
            </label>
          ))}
        </div>
        <div className="kind-help">{DESCRIPTION[rel.type]}</div>
      </div>

      <div className="field-block">
        <div className="field-label">
          <span>라벨</span>
        </div>
        <input
          value={rel.label ?? ''}
          placeholder="선택 사항 (예: throws, 1..*)"
          onChange={(e) => update(id, { label: e.target.value || undefined }, { coalesce: `label:${id}` })}
        />
      </div>

      <div className="row">
        <button onClick={() => update(id, { from: rel.to, to: rel.from })}>⇄ 방향 바꾸기</button>
        <button className="danger" onClick={() => useDocStore.getState().deleteItems([], [id])}>
          삭제
        </button>
      </div>
    </div>
  )
}
