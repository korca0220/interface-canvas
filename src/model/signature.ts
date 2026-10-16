import type { Field, Method, Param } from './types'

// ---------------------------------------------------------------------------
// 포맷터: 모델 → Dart 스타일 한 줄 시그니처
// ---------------------------------------------------------------------------

export function formatFieldType(f: Field): string {
  return `${f.type}${f.nullable ? '?' : ''}`
}

export function formatField(f: Field): string {
  if (!f.type) return f.name // enum 값
  return `${formatFieldType(f)} ${f.name}`
}

export function formatParam(p: Param): string {
  const req = p.named && p.required ? 'required ' : ''
  const def = p.defaultValue ? ` = ${p.defaultValue}` : ''
  return `${req}${p.type} ${p.name}${def}`
}

export function formatParams(params: Param[]): string {
  const positional = params.filter((p) => !p.named && p.required !== false)
  const optional = params.filter((p) => !p.named && p.required === false)
  const named = params.filter((p) => p.named)
  const parts = positional.map(formatParam)
  if (optional.length) parts.push(`[${optional.map(formatParam).join(', ')}]`)
  if (named.length) parts.push(`{${named.map(formatParam).join(', ')}}`)
  return parts.join(', ')
}

export function formatMethod(m: Method): string {
  return `${m.returns} ${m.name}(${formatParams(m.params)})`
}
