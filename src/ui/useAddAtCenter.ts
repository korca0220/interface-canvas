import { useCallback } from 'react'
import { useReactFlow } from '@xyflow/react'
import { useDocStore } from '../model/store'

/** 현재 화면 중앙에 새 인터페이스를 만든다. 겹치지 않게 조금씩 비켜 놓는다. */
export function useAddAtCenter() {
  const { screenToFlowPosition } = useReactFlow()
  return useCallback(() => {
    const r = document.querySelector('.canvas')?.getBoundingClientRect()
    const p = r ? screenToFlowPosition({ x: r.left + r.width / 2, y: r.top + r.height / 2 }) : { x: 0, y: 0 }
    let x = Math.round(p.x - 100)
    let y = Math.round(p.y - 24)
    const taken = useDocStore.getState().doc.interfaces.map((n) => n.position)
    while (taken.some((q) => Math.abs(q.x - x) < 10 && Math.abs(q.y - y) < 10)) {
      x += 30
      y += 30
    }
    return useDocStore.getState().addInterface({ position: { x, y } })
  }, [screenToFlowPosition])
}
