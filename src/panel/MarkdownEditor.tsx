import { lazy, Suspense } from 'react'
import { useUiStore } from '../ui/uiStore'

const MarkdownPreview = lazy(() => import('./MarkdownPreview'))

type Props = {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  label?: string
}

export function MarkdownEditor({ value, onChange, placeholder, label = '메모' }: Props) {
  const preview = useUiStore((s) => s.memoPreview)
  const setPreview = useUiStore((s) => s.setMemoPreview)
  return (
    <div className="field-block memo-block">
      <div className="field-label">
        <span>{label}</span>
        <div className="seg">
          <button className={!preview ? 'on' : ''} onClick={() => setPreview(false)}>
            편집
          </button>
          <button className={preview ? 'on' : ''} onClick={() => setPreview(true)} title="Cmd+Shift+P">
            미리보기
          </button>
        </div>
      </div>
      {preview ? (
        <div className="markdown-body" onDoubleClick={() => setPreview(false)} title="더블클릭하면 편집">
          {value.trim() ? (
            <Suspense fallback={<div className="muted">불러오는 중…</div>}>
              <MarkdownPreview source={value} />
            </Suspense>
          ) : (
            <div className="muted">메모가 없습니다. 더블클릭해서 작성하세요.</div>
          )}
        </div>
      ) : (
        <textarea
          className="memo-input"
          value={value}
          placeholder={placeholder ?? '마크다운으로 메모를 작성하세요'}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            // 탭 키로 들여쓰기
            if (e.key === 'Tab' && !e.shiftKey) {
              e.preventDefault()
              const el = e.currentTarget
              const { selectionStart: a, selectionEnd: b } = el
              const next = value.slice(0, a) + '  ' + value.slice(b)
              onChange(next)
              requestAnimationFrame(() => el.setSelectionRange(a + 2, a + 2))
            }
          }}
        />
      )}
    </div>
  )
}
