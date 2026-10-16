import { useCallback, useRef } from 'react'
import { useDocStore } from '../model/store'
import { useUiStore } from '../ui/uiStore'
import { DocOverview } from './DocOverview'
import { NodeEditor } from './NodeEditor'
import { RelationEditor } from './RelationEditor'
import { MultiSelection } from './MultiSelection'

export function Panel() {
  const selection = useDocStore((s) => s.selection)
  const width = useUiStore((s) => s.panelWidth)
  const open = useUiStore((s) => s.panelOpen)
  const dragging = useRef(false)

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    dragging.current = true
    const startX = e.clientX
    const startW = useUiStore.getState().panelWidth
    document.body.classList.add('resizing')
    const move = (ev: PointerEvent) => useUiStore.getState().setPanelWidth(startW + (startX - ev.clientX))
    const up = () => {
      dragging.current = false
      document.body.classList.remove('resizing')
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }, [])

  if (!open) return null

  let content: React.ReactNode
  const { nodes, edges } = selection
  if (nodes.length === 1 && edges.length === 0) content = <NodeEditor key={nodes[0]} id={nodes[0]} />
  else if (nodes.length === 0 && edges.length === 1) content = <RelationEditor key={edges[0]} id={edges[0]} />
  else if (nodes.length + edges.length > 1) content = <MultiSelection />
  else content = <DocOverview />

  return (
    <aside className="panel" style={{ width }}>
      <div className="panel-resizer" onPointerDown={onPointerDown} onDoubleClick={() => useUiStore.getState().setPanelWidth(360)} />
      <div className="panel-scroll">{content}</div>
    </aside>
  )
}
