import type { Doc, InterfaceNode, Method, RelationType } from '../model/types'

/** Mermaid는 제네릭을 ~로 표기한다: Future<User> → Future~User~ */
export function mermaidType(t: string): string {
  return t.replace(/[<>]/g, '~')
}

/** Mermaid 클래스 이름으로 쓸 수 있게 정리 */
export function mermaidName(name: string): string {
  const m = name.match(/^([A-Za-z_][\w]*)(<(.+)>)?$/)
  if (m) return m[3] ? `${m[1]}~${m[3].replace(/[<>]/g, '~')}~` : m[1]
  return name.replace(/[^\w]/g, '_') || '_'
}

const ANNOTATION: Record<InterfaceNode['kind'], string | null> = {
  interface: 'interface',
  abstract: 'abstract',
  class: null,
  enum: 'enumeration',
  model: 'model',
}

const ARROW: Record<RelationType, string> = {
  implements: '..|>',
  extends: '--|>',
  depends: '..>',
  uses: '-->',
  creates: '..>',
}

function methodLine(m: Method): string {
  // 클래스 블록 안에서 { }는 문법 충돌이 나므로 매개변수는 "타입 이름" 목록으로만 표기한다
  const params = m.params.map((p) => `${mermaidType(p.type)} ${p.name}`).join(', ')
  const ret = m.returns && m.returns !== 'void' ? ` ${mermaidType(m.returns)}` : ''
  return `+${m.name.replace(/<.*>$/, '')}(${params})${ret}`
}

export function toMermaid(doc: Doc, ids?: string[]): string {
  const targets = ids ? doc.interfaces.filter((n) => ids.includes(n.id)) : doc.interfaces
  const included = new Set(targets.map((n) => n.id))
  const nameOf = new Map(doc.interfaces.map((n) => [n.id, mermaidName(n.name)]))
  const lines: string[] = []

  if (doc.name.trim()) lines.push('---', `title: ${JSON.stringify(doc.name.trim())}`, '---')
  lines.push('classDiagram')

  for (const n of targets) {
    const name = nameOf.get(n.id)!
    const annotation = ANNOTATION[n.kind]
    const members: string[] = []
    if (annotation) members.push(`<<${annotation}>>`)
    if (n.kind === 'enum') {
      for (const f of n.fields) members.push(f.name)
    } else {
      for (const f of n.fields) members.push(`+${mermaidType(f.type)}${f.nullable ? '?' : ''} ${f.name}`)
      for (const m of n.methods) members.push(methodLine(m))
    }
    if (!members.length) lines.push(`  class ${name}`)
    else lines.push(`  class ${name} {`, ...members.map((m) => `    ${m}`), '  }')
  }

  for (const r of doc.relations) {
    if (!included.has(r.from) || !included.has(r.to)) continue
    const label = [r.type === 'creates' ? '«create»' : '', r.label ?? ''].filter(Boolean).join(' ')
    const labelPart = label ? ` : ${label.replace(/[:\n]/g, ' ')}` : ''
    lines.push(`  ${nameOf.get(r.from)} ${ARROW[r.type]} ${nameOf.get(r.to)}${labelPart}`)
  }

  return lines.join('\n') + '\n'
}
