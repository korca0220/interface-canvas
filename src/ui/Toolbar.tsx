import { useReactFlow } from '@xyflow/react'
import { canvasToPng } from '../export/png'
import { downloadBlob } from '../io/file'
import { useDocStore } from '../model/store'
import { isDirty, loadExample, newDocument, openFile, saveFile, saveFileAs, useFileStore } from '../io/file'
import { useUiStore } from './uiStore'
import { useAddAtCenter } from './useAddAtCenter'
import { Menu } from './Menu'

export function Toolbar() {
  const doc = useDocStore((s) => s.doc)
  const canUndo = useDocStore((s) => s.past.length > 0)
  const canRedo = useDocStore((s) => s.future.length > 0)
  const file = useFileStore()
  const panelOpen = useUiStore((s) => s.panelOpen)
  const { fitView, getNodes } = useReactFlow()
  const addAtCenter = useAddAtCenter()
  const dirty = isDirty(doc, file)
  const hasSelection = useDocStore((s) => s.selection.nodes.length > 0)

  const exportPng = async () => {
    try {
      const url = await canvasToPng(getNodes())
      const blob = await (await fetch(url)).blob()
      downloadBlob(`${(doc.name.trim() || 'canvas').replace(/[\\/:*?"<>|\s]+/g, '_')}.png`, blob)
    } catch (e) {
      useUiStore.getState().showToast(`PNG 내보내기 실패: ${(e as Error).message}`, 'error')
    }
  }

  return (
    <header className="toolbar">
      <Menu
        label="파일"
        items={[
          { label: '새 문서', onClick: newDocument },
          { label: '열기…', shortcut: '⌘O', onClick: () => void openFile() },
          { label: '저장', shortcut: '⌘S', onClick: () => void saveFile() },
          { label: '다른 이름으로 저장…', shortcut: '⇧⌘S', onClick: () => void saveFileAs() },
          'sep',
          { label: '예시 문서 불러오기', onClick: loadExample },
        ]}
      />
      <span className="doc-name" title={file.fileName ?? '파일로 저장되지 않음 (브라우저에 자동 저장 중)'}>
        {doc.name || 'Untitled'}
        <span className="file-name">
          {file.fileName ?? '저장 안 된 문서'}
          {dirty && file.fileName ? ' •' : ''}
        </span>
      </span>

      <div className="tb-sep" />
      <div className="tb-group">
        <button className="ghost" onClick={() => useDocStore.getState().undo()} disabled={!canUndo} title="실행 취소 (⌘Z)">
          ↶
        </button>
        <button className="ghost" onClick={() => useDocStore.getState().redo()} disabled={!canRedo} title="다시 실행 (⇧⌘Z)">
          ↷
        </button>
      </div>
      <div className="tb-sep" />
      <div className="tb-group">
        <button onClick={addAtCenter} title="새 인터페이스 (N, 또는 빈 곳 더블클릭)">
          + 인터페이스
        </button>
        <button className="ghost" onClick={() => fitView({ padding: 0.2, duration: 300 })} title="전체 보기 (F)">
          전체 보기
        </button>
      </div>

      <div className="tb-spacer" />

      <div className="tb-group">
        <Menu
          className="menu-right"
          label="내보내기"
          items={[
            { label: 'Dart / Mermaid…', shortcut: '⌘E', onClick: () => useUiStore.getState().openExport(hasSelection ? 'selection' : 'all') },
            { label: 'PNG 이미지', onClick: () => void exportPng() },
          ]}
        />
        <button className="ghost" onClick={() => useUiStore.getState().togglePanel()} title="패널 토글 (⌘\)">
          {panelOpen ? '패널 숨기기' : '패널 보기'}
        </button>
      </div>
    </header>
  )
}
