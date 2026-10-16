import { useEffect, useMemo, useState } from 'react'
import type { ParseResult } from '../model/signature'

type Props<T> = {
  label: string
  /** 현재 모델 값을 포맷한 줄들 */
  lines: string[]
  parse: (line: string) => ParseResult<T>
  onCommit: (values: T[]) => void
  placeholder: string
}

/**
 * 한 줄에 멤버 하나씩 입력하는 textarea. 모든 줄이 파싱되면 즉시 모델에 반영하고,
 * 파싱 실패 줄이 있으면 반영하지 않고 에러만 보여준다.
 */
export function MemberEditor<T>({ label, lines, parse, onCommit, placeholder }: Props<T>) {
  const canonical = lines.join('\n')
  const [draft, setDraft] = useState(canonical)
  const [focused, setFocused] = useState(false)

  const results = useMemo(
    () =>
      draft
        .split('\n')
        .map((line, i) => ({ line, i, r: line.trim() ? parse(line) : null }))
        .filter((x) => x.r !== null),
    [draft, parse],
  )
  const errors = results.filter((x) => !x.r!.ok)

  // 외부 변경(undo 등)을 반영. 편집 중이거나 에러가 있는 초안은 덮어쓰지 않는다.
  useEffect(() => {
    if (!focused && errors.length === 0) setDraft(canonical)
  }, [canonical])

  const onChange = (text: string) => {
    setDraft(text)
    const parsed = text
      .split('\n')
      .filter((l) => l.trim())
      .map(parse)
    if (parsed.every((r) => r.ok)) {
      onCommit(parsed.map((r) => (r as { ok: true; value: T }).value))
    }
  }

  const onBlur = () => {
    setFocused(false)
    if (errors.length === 0) setDraft(canonical) // 정규화된 형태로 정리
  }

  const rows = Math.min(14, Math.max(2, draft.split('\n').length + 1))

  return (
    <div className="field-block">
      <div className="field-label">
        <span>{label}</span>
        <span className="field-hint">{results.length - errors.length}개</span>
      </div>
      <textarea
        className={`mono member-input ${errors.length ? 'invalid' : ''}`}
        value={draft}
        rows={rows}
        spellCheck={false}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={onBlur}
        onChange={(e) => onChange(e.target.value)}
      />
      {errors.length > 0 && (
        <ul className="parse-errors">
          {errors.map(({ i, r }) => (
            <li key={i}>
              <b>{i + 1}행</b> {(r as { ok: false; error: string }).error}
            </li>
          ))}
          <li className="muted">에러가 고쳐질 때까지 변경 사항은 반영되지 않습니다.</li>
        </ul>
      )}
    </div>
  )
}
