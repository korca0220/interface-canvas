import { useCallback } from 'react'
import { useReactFlow } from '@xyflow/react'
import { useDocStore } from '../model/store'
import { useUiStore } from '../ui/uiStore'

/** 노드를 선택하고 화면 중앙으로 이동한 뒤 잠시 강조한다. */
export function useFocusNode() {
  const { setCenter, getInternalNode, getZoom } = useReactFlow()
  return useCallback(
    (id: string) => {
      const store = useDocStore.getState()
      const iface = store.doc.interfaces.find((n) => n.id === id)
      if (!iface) return
      store.setSelection({ nodes: [id], edges: [] })
      const internal = getInternalNode(id)
      const w = internal?.measured.width ?? 200
      const h = internal?.measured.height ?? 100
      setCenter(iface.position.x + w / 2, iface.position.y + h / 2, { zoom: Math.max(getZoom(), 0.9), duration: 350 })
      const ui = useUiStore.getState()
      ui.setHighlight(id)
      window.setTimeout(() => {
        if (useUiStore.getState().highlightId === id) useUiStore.getState().setHighlight(null)
      }, 2500)
    },
    [setCenter, getInternalNode, getZoom],
  )
}
