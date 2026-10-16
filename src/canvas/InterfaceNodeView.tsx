import { memo } from 'react'
import { Handle, Position, useConnection, type NodeProps } from '@xyflow/react'
import { formatFieldType, formatParams } from '../model/signature'
import type { IfaceFlowNode } from './types'
import { useLod } from './lod'

const KIND_LABEL: Record<string, string> = {
  interface: 'interface',
  abstract: 'abstract',
  class: 'class',
  enum: 'enum',
  model: 'model',
}

function InterfaceNodeViewImpl({ id, data, selected }: NodeProps<IfaceFlowNode>) {
  const { iface, highlighted } = data
  const lod = useLod()
  const connection = useConnection()
  const isDropTarget = connection.inProgress && connection.fromNode?.id !== id
  const isEnum = iface.kind === 'enum'

  return (
    <div
      className={[
        'ic-node',
        `kind-${iface.kind}`,
        `lod-${lod}`,
        selected ? 'selected' : '',
        highlighted ? 'highlighted' : '',
        isDropTarget ? 'drop-target' : '',
      ].join(' ')}
      style={iface.color ? ({ '--node-color': iface.color } as React.CSSProperties) : undefined}
    >
      <div className="ic-node-header">
        {lod !== 'min' && <span className="ic-kind">«{KIND_LABEL[iface.kind]}»</span>}
        <span className="ic-name">{iface.name || 'Unnamed'}</span>
      </div>

      {lod !== 'min' && iface.fields.length > 0 && (
        <div className="ic-section">
          {iface.fields.map((f, i) => (
            <div className="ic-member" key={i}>
              {isEnum || lod === 'compact' ? (
                <span className="ic-m-name">{f.name}</span>
              ) : (
                <>
                  <span className="ic-m-type">{formatFieldType(f)}</span> <span className="ic-m-name">{f.name}</span>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {lod !== 'min' && iface.methods.length > 0 && (
        <div className="ic-section">
          {iface.methods.map((m, i) => (
            <div className="ic-member" key={i}>
              {lod === 'compact' ? (
                <span className="ic-m-name">{m.name}()</span>
              ) : (
                <>
                  <span className="ic-m-type">{m.returns}</span> <span className="ic-m-name">{m.name}</span>
                  <span className="ic-m-params">({formatParams(m.params)})</span>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {lod === 'full' && iface.fields.length === 0 && iface.methods.length === 0 && (
        <div className="ic-section ic-empty">멤버 없음</div>
      )}

      {/* 연결을 시작하는 작은 핸들 (호버 시 표시) */}
      <Handle type="source" position={Position.Top} id="top" className="ic-handle" />
      <Handle type="source" position={Position.Right} id="right" className="ic-handle" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="ic-handle" />
      <Handle type="source" position={Position.Left} id="left" className="ic-handle" />
      {/* 연결 중에는 노드 전체가 드롭 대상이 된다 */}
      <Handle
        type="target"
        position={Position.Top}
        id="drop"
        isConnectableStart={false}
        className={`ic-drop-handle ${isDropTarget ? 'active' : ''}`}
      />
    </div>
  )
}

export const InterfaceNodeView = memo(InterfaceNodeViewImpl)
