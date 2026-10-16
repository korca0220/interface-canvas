import { useReactFlow } from '@xyflow/react'
import { useDocStore } from '../model/store'

export function Toolbar() {
  const name = useDocStore((s) => s.doc.name)
  const { screenToFlowPosition, fitView } = useReactFlow()

  const addAtCenter = () => {
    const el = document.querySelector('.canvas')
    const r = el?.getBoundingClientRect()
    const p = r ? screenToFlowPosition({ x: r.left + r.width / 2, y: r.top + r.height / 2 }) : { x: 0, y: 0 }
    useDocStore.getState().addInterface({ position: { x: Math.round(p.x - 100), y: Math.round(p.y - 24) } })
  }

  return (
    <header className="toolbar">
      <span className="doc-name">{name}</span>
      <div className="tb-group">
        <button onClick={addAtCenter} title="새 인터페이스 (N)">+ 인터페이스</button>
        <button onClick={() => fitView({ padding: 0.2, duration: 300 })} title="전체 보기">
          Fit
        </button>
      </div>
    </header>
  )
}
