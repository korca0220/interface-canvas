import { getNodesBounds, type Node } from '@xyflow/react'
import { toPng } from 'html-to-image'

/** 캔버스의 모든 노드를 감싸는 영역을 PNG로 렌더한다 (줌/팬 상태와 무관). */
export async function canvasToPng(nodes: Node[], padding = 48): Promise<string> {
  const viewport = document.querySelector<HTMLElement>('.react-flow__viewport')
  if (!viewport) throw new Error('캔버스를 찾을 수 없습니다.')
  if (!nodes.length) throw new Error('내보낼 노드가 없습니다.')
  const b = getNodesBounds(nodes)
  const width = Math.ceil(b.width + padding * 2)
  const height = Math.ceil(b.height + padding * 2)
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--canvas-bg').trim() || '#ffffff'
  return toPng(viewport, {
    backgroundColor: bg,
    width,
    height,
    pixelRatio: 2,
    style: {
      width: `${width}px`,
      height: `${height}px`,
      transform: `translate(${padding - b.x}px, ${padding - b.y}px) scale(1)`,
    },
    filter: (el) => !(el instanceof HTMLElement && el.classList.contains('react-flow__handle')),
  })
}
