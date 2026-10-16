import { useEffect, useMemo, useState } from 'react'
import { useDocStore } from '../model/store'
import { useUiStore } from '../ui/uiStore'
import { downloadText } from '../io/file'
import { toDart } from './dart'
import { toMermaid } from './mermaid'

type Format = 'dart' | 'mermaid'
const FORMAT_KEY = 'interface-canvas:exportFormat'

export async function copyText(text: string, what: string) {
  try {
    await navigator.clipboard.writeText(text)
    useUiStore.getState().showToast(`${what} 클립보드에 복사됨`)
  } catch {
    useUiStore.getState().showToast('클립보드 복사에 실패했습니다.', 'error')
  }
}

export function ExportDialog() {
  const scope = useUiStore((s) => s.exportScope)
  const close = useUiStore((s) => s.closeExport)
  const doc = useDocStore((s) => s.doc)
  const selectedIds = useDocStore((s) => s.selection.nodes)
  const [format, setFormat] = useState<Format>(() => (localStorage.getItem(FORMAT_KEY) as Format) || 'dart')
  const [onlySelection, setOnlySelection] = useState(scope === 'selection')

  useEffect(() => setOnlySelection(scope === 'selection' && selectedIds.length > 0), [scope, selectedIds.length])
  useEffect(() => {
    try {
      localStorage.setItem(FORMAT_KEY, format)
    } catch {
      // 무시
    }
  }, [format])

  const ids = onlySelection && selectedIds.length ? selectedIds : undefined
  const code = useMemo(() => (format === 'dart' ? toDart(doc, ids) : toMermaid(doc, ids)), [format, doc, ids])

  useEffect(() => {
    if (!scope) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        void copyText(code, format === 'dart' ? 'Dart 코드가' : 'Mermaid 텍스트가')
        close()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [scope, close, code, format])

  if (!scope) return null
  const ext = format === 'dart' ? 'dart' : 'mmd'
  const fileBase = (doc.name.trim() || 'interfaces').replace(/[\\/:*?"<>|\s]+/g, '_').toLowerCase()

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="modal export-modal" role="dialog" aria-label="내보내기">
        <div className="modal-head">
          <div className="seg">
            <button className={format === 'dart' ? 'on' : ''} onClick={() => setFormat('dart')}>
              Dart
            </button>
            <button className={format === 'mermaid' ? 'on' : ''} onClick={() => setFormat('mermaid')}>
              Mermaid
            </button>
          </div>
          <label className="check">
            <input
              type="checkbox"
              checked={onlySelection && selectedIds.length > 0}
              disabled={!selectedIds.length}
              onChange={(e) => setOnlySelection(e.target.checked)}
            />
            선택한 노드만 ({selectedIds.length})
          </label>
          <div className="tb-spacer" />
          <button className="ghost" onClick={close} aria-label="닫기">
            ✕
          </button>
        </div>
        <pre className="code-view">
          <code>{code}</code>
        </pre>
        <div className="modal-foot">
          <span className="muted">{code.split('\n').length - 1}줄 · ⌘Enter 복사 후 닫기</span>
          <div className="tb-spacer" />
          <button onClick={() => downloadText(`${fileBase}.${ext}`, code)}>파일로 저장</button>
          <button className="primary" onClick={() => void copyText(code, format === 'dart' ? 'Dart 코드가' : 'Mermaid 텍스트가')}>
            클립보드에 복사
          </button>
        </div>
      </div>
    </div>
  )
}
