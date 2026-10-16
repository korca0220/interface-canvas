import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  useReactFlow,
  ViewportPortal,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type OnDelete,
} from '@xyflow/react'
import { useDocStore } from '../model/store'
import { useUiStore } from '../ui/uiStore'
import { useFileStore } from '../io/file'
import { InterfaceNodeView } from './InterfaceNodeView'
import { EdgeMarkers, RelationEdge } from './RelationEdge'
import { ZoomCssVar } from './lod'
import type { IfaceFlowNode, RelationFlowEdge } from './types'

const nodeTypes = { iface: InterfaceNodeView }
const edgeTypes = { relation: RelationEdge }
const PARALLEL_GAP = 14

type Size = { width: number; height: number }

export function Canvas() {
  const doc = useDocStore((s) => s.doc)
  const selection = useDocStore((s) => s.selection)
  const highlightId = useUiStore((s) => s.highlightId)
  const colorMode = useUiStore((s) => s.colorMode)
  const epoch = useFileStore((s) => s.epoch)
  const { screenToFlowPosition, fitView } = useReactFlow()
  // React Flow가 측정한 노드 크기. 문서 모델에는 넣지 않는 화면 전용 상태.
  const [measured, setMeasured] = useState<Record<string, Size>>({})

  // 다른 문서를 열면 측정값을 비우고 화면을 맞춘다
  useEffect(() => {
    if (epoch === 0) return
    setMeasured({})
    const t = window.setTimeout(() => void fitView({ padding: 0.2, duration: 200 }), 80)
    return () => window.clearTimeout(t)
  }, [epoch, fitView])

  // 문서 모델 → React Flow 노드 (파생)
  const nodes = useMemo<IfaceFlowNode[]>(() => {
    const selected = new Set(selection.nodes)
    return doc.interfaces.map((iface) => ({
      id: iface.id,
      type: 'iface',
      position: iface.position,
      data: { iface, highlighted: iface.id === highlightId },
      selected: selected.has(iface.id),
      measured: measured[iface.id],
    }))
  }, [doc.interfaces, selection.nodes, measured, highlightId])

  // 문서 모델 → React Flow 엣지 (파생). 같은 두 노드 사이의 관계는 평행하게 벌린다.
  const edges = useMemo<RelationFlowEdge[]>(() => {
    const selected = new Set(selection.edges)
    const groups = new Map<string, string[]>()
    for (const r of doc.relations) {
      const key = [r.from, r.to].sort().join('|')
      groups.set(key, [...(groups.get(key) ?? []), r.id])
    }
    return doc.relations.map((relation) => {
      const key = [relation.from, relation.to].sort().join('|')
      const group = groups.get(key)!
      const idx = group.indexOf(relation.id)
      // 방향과 무관하게 같은 쪽으로 벌어지도록 정렬 기준(from < to)을 반영한다.
      const sign = relation.from < relation.to ? 1 : -1
      const offset = (idx - (group.length - 1) / 2) * PARALLEL_GAP * sign
      return {
        id: relation.id,
        type: 'relation',
        source: relation.from,
        target: relation.to,
        data: { relation, offset },
        selected: selected.has(relation.id),
      }
    })
  }, [doc.relations, selection.edges])

  const onNodesChange = useCallback((changes: NodeChange<IfaceFlowNode>[]) => {
    const store = useDocStore.getState()
    const positions: Record<string, { x: number; y: number }> = {}
    const sizes: Record<string, Size> = {}
    let selNodes: Set<string> | null = null
    for (const c of changes) {
      if (c.type === 'position' && c.position) positions[c.id] = c.position
      else if (c.type === 'dimensions' && c.dimensions) sizes[c.id] = c.dimensions
      else if (c.type === 'select') {
        selNodes ??= new Set(store.selection.nodes)
        if (c.selected) selNodes.add(c.id)
        else selNodes.delete(c.id)
      }
      // 'remove'는 onDelete에서 한 번에 처리한다.
    }
    if (Object.keys(positions).length) store.moveInterfaces(positions)
    if (Object.keys(sizes).length) setMeasured((m) => ({ ...m, ...sizes }))
    if (selNodes) store.setSelection({ nodes: [...selNodes] })
  }, [])

  const onEdgesChange = useCallback((changes: EdgeChange<RelationFlowEdge>[]) => {
    const store = useDocStore.getState()
    let selEdges: Set<string> | null = null
    for (const c of changes) {
      if (c.type === 'select') {
        selEdges ??= new Set(store.selection.edges)
        if (c.selected) selEdges.add(c.id)
        else selEdges.delete(c.id)
      }
    }
    if (selEdges) store.setSelection({ edges: [...selEdges] })
  }, [])

  const onDelete: OnDelete<IfaceFlowNode, RelationFlowEdge> = useCallback(({ nodes, edges }) => {
    useDocStore.getState().deleteItems(
      nodes.map((n) => n.id),
      edges.map((e) => e.id),
    )
  }, [])

  const onConnect = useCallback((c: Connection) => {
    useDocStore.getState().addRelation(c.source, c.target)
  }, [])

  const onDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!(e.target as Element).classList.contains('react-flow__pane')) return
      const p = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      useDocStore.getState().addInterface({ position: { x: Math.round(p.x - 100), y: Math.round(p.y - 24) } })
    },
    [screenToFlowPosition],
  )

  const beginGesture = useCallback(() => useDocStore.getState().beginGesture(), [])
  const endGesture = useCallback(() => useDocStore.getState().endGesture(), [])

  return (
    <div className="canvas" onDoubleClick={onDoubleClick}>
      <ReactFlow<IfaceFlowNode, RelationFlowEdge>
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onDelete={onDelete}
        onConnect={onConnect}
        isValidConnection={(c) => c.source !== c.target}
        onNodeDragStart={beginGesture}
        onNodeDragStop={endGesture}
        onSelectionDragStart={beginGesture}
        onSelectionDragStop={endGesture}
        deleteKeyCode={['Delete', 'Backspace']}
        multiSelectionKeyCode={['Meta', 'Shift']}
        selectionKeyCode="Shift"
        zoomOnDoubleClick={false}
        minZoom={0.15}
        maxZoom={2.5}
        colorMode={colorMode}
        connectionRadius={30}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <ViewportPortal>
          <EdgeMarkers />
        </ViewportPortal>
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <MiniMap pannable zoomable nodeColor={(n) => (n.data as IfaceFlowNode['data']).iface.color ?? '#94a3b8'} />
        <Controls />
        <ZoomCssVar />
      </ReactFlow>
    </div>
  )
}
