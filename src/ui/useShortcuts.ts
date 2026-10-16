import { useEffect } from 'react'
import { useReactFlow } from '@xyflow/react'
import { useDocStore } from '../model/store'
import { RELATION_TYPES } from '../model/types'
import { openFile, saveFile, saveFileAs } from '../io/file'
import { useUiStore } from './uiStore'
import { useAddAtCenter } from './useAddAtCenter'

function isEditable(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false
  return t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)
}

/** 전역 단축키. 입력 중일 때는 텍스트 편집 단축키(undo 등)를 브라우저에 맡긴다. */
export function useShortcuts() {
  const { fitView } = useReactFlow()
  const addAtCenter = useAddAtCenter()

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      const editing = isEditable(e.target)
      const key = e.key.toLowerCase()
      const doc = useDocStore.getState()
      const ui = useUiStore.getState()
      // 모달이 열려 있으면 모달이 처리한다
      if (ui.searchOpen || ui.exportScope) return

      if (mod && key === 's') {
        e.preventDefault()
        void (e.shiftKey ? saveFileAs() : saveFile())
        return
      }
      if (mod && key === 'o') {
        e.preventDefault()
        void openFile()
        return
      }
      if (mod && key === 'k') {
        e.preventDefault()
        ui.setSearchOpen(true)
        return
      }
      if (mod && key === 'e') {
        e.preventDefault()
        ui.openExport(doc.selection.nodes.length ? 'selection' : 'all')
        return
      }
      if (mod && e.key === '\\') {
        e.preventDefault()
        ui.togglePanel()
        return
      }
      if (mod && e.shiftKey && key === 'p') {
        e.preventDefault()
        ui.setMemoPreview(!ui.memoPreview)
        return
      }

      if (editing) {
        if (e.key === 'Escape') (e.target as HTMLElement).blur()
        return
      }

      if (mod && key === 'z') {
        e.preventDefault()
        if (e.shiftKey) doc.redo()
        else doc.undo()
        return
      }
      if (mod && key === 'y') {
        e.preventDefault()
        doc.redo()
        return
      }
      if (mod && key === 'a') {
        e.preventDefault()
        doc.selectAll()
        return
      }
      if (mod && key === 'd') {
        e.preventDefault()
        doc.duplicateInterfaces(doc.selection.nodes)
        return
      }
      if (mod || e.altKey) return

      if (e.key === 'Escape') {
        doc.setSelection({ nodes: [], edges: [] })
      } else if (key === 'n') {
        e.preventDefault()
        addAtCenter()
      } else if (key === 'f') {
        void fitView({ padding: 0.2, duration: 300 })
      } else if (/^[1-5]$/.test(e.key) && doc.selection.edges.length === 1 && doc.selection.nodes.length === 0) {
        doc.updateRelation(doc.selection.edges[0], { type: RELATION_TYPES[Number(e.key) - 1] })
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [fitView, addAtCenter])
}
