import { useCallback } from 'react'
import { useDocStore } from '../model/store'
import { formatField, formatMethod, parseField, parseMethod } from '../model/signature'
import { KINDS, NODE_COLORS, type Field, type InterfaceKind, type Method } from '../model/types'
import { MarkdownEditor } from './MarkdownEditor'
import { MemberEditor } from './MemberEditor'
import { RelationList } from './RelationList'
import { toDart } from '../export/dart'
import { copyText } from '../export/ExportDialog'

const KIND_HELP: Record<InterfaceKind, string> = {
  interface: 'abstract interface class',
  abstract: 'abstract class',
  class: 'class (구현체)',
  enum: 'enum',
  model: '데이터 클래스 (final 필드 + 생성자)',
}

export function NodeEditor({ id }: { id: string }) {
  const iface = useDocStore((s) => s.doc.interfaces.find((n) => n.id === id))
  const update = useDocStore((s) => s.updateInterface)
  const isEnum = iface?.kind === 'enum'

  const parseFieldLine = useCallback((l: string) => parseField(l, { enumValue: isEnum }), [isEnum])
  const commitFields = useCallback((fields: Field[]) => update(id, { fields }, { coalesce: `fields:${id}` }), [id, update])
  const commitMethods = useCallback(
    (methods: Method[]) => update(id, { methods }, { coalesce: `methods:${id}` }),
    [id, update],
  )

  if (!iface) return null

  return (
    <div className="editor">
      <div className="editor-title">
        <input
          className="name-input"
          value={iface.name}
          spellCheck={false}
          placeholder="이름"
          onChange={(e) => update(id, { name: e.target.value.replace(/\s/g, '') }, { coalesce: `name:${id}` })}
        />
      </div>

      <div className="row">
        <select
          value={iface.kind}
          onChange={(e) => update(id, { kind: e.target.value as InterfaceKind })}
          title={KIND_HELP[iface.kind]}
        >
          {KINDS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <div className="swatches">
          {NODE_COLORS.map((c) => (
            <button
              key={c}
              className={`swatch ${iface.color === c ? 'on' : ''}`}
              style={{ background: c }}
              onClick={() => update(id, { color: c })}
              title={c}
              aria-label={`색상 ${c}`}
            />
          ))}
        </div>
      </div>
      <div className="kind-help">{KIND_HELP[iface.kind]}</div>

      <MemberEditor
        label={isEnum ? '값' : '필드'}
        lines={iface.fields.map(formatField)}
        parse={parseFieldLine}
        onCommit={commitFields}
        placeholder={isEnum ? 'loading\nsuccess\nfailure' : 'String id\nString? nickname'}
      />
      {!isEnum && (
        <MemberEditor
          label="메서드"
          lines={iface.methods.map(formatMethod)}
          parse={parseMethod}
          onCommit={commitMethods}
          placeholder={'Future<User> login(String id, {required String password})\nvoid dispose()'}
        />
      )}

      <MarkdownEditor value={iface.memo} onChange={(memo) => update(id, { memo }, { coalesce: `memo:${id}` })} />

      <RelationList nodeId={id} />

      <div className="row">
        <button onClick={() => void copyText(toDart(useDocStore.getState().doc, [id]), 'Dart 코드가')}>Dart 코드 복사</button>
        <button className="danger" onClick={() => useDocStore.getState().deleteItems([id], [])}>
          삭제
        </button>
      </div>
    </div>
  )
}
