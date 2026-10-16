import { memo } from 'react'
import { BaseEdge, EdgeLabelRenderer, getStraightPath, useInternalNode, type EdgeProps } from '@xyflow/react'
import type { RelationType } from '../model/types'
import { floatingEndpoints, type Rect } from './geometry'
import type { RelationFlowEdge } from './types'

type Style = { dashed: boolean; marker: 'triangle' | 'arrow'; stereotype?: string }

export const RELATION_STYLE: Record<RelationType, Style> = {
  implements: { dashed: true, marker: 'triangle' },
  extends: { dashed: false, marker: 'triangle' },
  depends: { dashed: true, marker: 'arrow' },
  uses: { dashed: false, marker: 'arrow' },
  creates: { dashed: true, marker: 'arrow', stereotype: '«create»' },
}

function rectOf(node: ReturnType<typeof useInternalNode>): Rect | null {
  if (!node) return null
  const w = node.measured.width
  const h = node.measured.height
  if (!w || !h) return null
  const p = node.internals.positionAbsolute
  return { x: p.x, y: p.y, width: w, height: h }
}

function RelationEdgeImpl({ id, source, target, data, selected }: EdgeProps<RelationFlowEdge>) {
  const a = rectOf(useInternalNode(source))
  const b = rectOf(useInternalNode(target))
  if (!a || !b || !data) return null
  const rel = data.relation
  const style = RELATION_STYLE[rel.type]
  const { source: s, target: t } = floatingEndpoints(a, b, data.offset)
  const [path, labelX, labelY] = getStraightPath({ sourceX: s.x, sourceY: s.y, targetX: t.x, targetY: t.y })
  const marker = `url(#ic-${style.marker}${selected ? '-sel' : ''})`
  const label = [style.stereotype, rel.label].filter(Boolean).join(' ')

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={marker}
        interactionWidth={16}
        className={`ic-edge ${style.dashed ? 'dashed' : ''} ${selected ? 'selected' : ''}`}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            className={`ic-edge-label nodrag nopan ${selected ? 'selected' : ''}`}
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export const RelationEdge = memo(RelationEdgeImpl)

/** 엣지가 참조하는 SVG 마커 정의. 캔버스에 한 번만 렌더한다. */
export function EdgeMarkers() {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden>
      <defs>
        {(['', '-sel'] as const).map((suffix) => (
          <g key={suffix}>
            <marker
              id={`ic-triangle${suffix}`}
              viewBox="0 0 20 20"
              refX="19"
              refY="10"
              markerWidth="16"
              markerHeight="16"
              markerUnits="userSpaceOnUse"
              orient="auto-start-reverse"
            >
              <path d="M1,1 L19,10 L1,19 Z" className={`ic-marker-hollow${suffix}`} />
            </marker>
            <marker
              id={`ic-arrow${suffix}`}
              viewBox="0 0 20 20"
              refX="18"
              refY="10"
              markerWidth="14"
              markerHeight="14"
              markerUnits="userSpaceOnUse"
              orient="auto-start-reverse"
            >
              <path d="M2,2 L18,10 L2,18" className={`ic-marker-open${suffix}`} />
            </marker>
          </g>
        ))}
      </defs>
    </svg>
  )
}
