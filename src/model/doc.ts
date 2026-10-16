import { newId } from './id'
import { KINDS, RELATION_TYPES, type Doc, type Field, type InterfaceNode, type Method, type Param, type Relation } from './types'

export function emptyDoc(name = 'Untitled'): Doc {
  return { version: 1, name, memo: '', interfaces: [], relations: [] }
}

export function createInterface(partial: Partial<InterfaceNode> = {}): InterfaceNode {
  return {
    id: newId('n'),
    name: 'NewInterface',
    kind: 'interface',
    fields: [],
    methods: [],
    memo: '',
    position: { x: 0, y: 0 },
    ...partial,
  }
}

/** 새 노드 이름이 기존 이름과 겹치지 않도록 숫자를 붙인다. */
export function uniqueName(doc: Doc, base: string): string {
  const names = new Set(doc.interfaces.map((n) => n.name))
  if (!names.has(base)) return base
  let i = 2
  while (names.has(`${base}${i}`)) i++
  return `${base}${i}`
}

export class DocFormatError extends Error {}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback)
const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

/**
 * 파일·localStorage에서 읽은 값을 검증하고 Doc으로 정규화한다.
 * 구조가 완전히 깨졌으면 DocFormatError, 사소한 누락은 기본값으로 채운다.
 */
export function normalizeDoc(raw: unknown): Doc {
  if (!isObj(raw)) throw new DocFormatError('문서가 JSON 객체가 아닙니다.')
  if (raw.version !== 1) throw new DocFormatError(`지원하지 않는 문서 버전입니다: ${String(raw.version)}`)
  if (!Array.isArray(raw.interfaces) || !Array.isArray(raw.relations)) {
    throw new DocFormatError('interfaces 또는 relations 배열이 없습니다.')
  }

  const seen = new Set<string>()
  const interfaces: InterfaceNode[] = []
  for (const n of raw.interfaces) {
    if (!isObj(n) || typeof n.id !== 'string' || seen.has(n.id)) continue
    seen.add(n.id)
    const pos = isObj(n.position) ? n.position : {}
    const node: InterfaceNode = {
      id: n.id,
      name: str(n.name, 'Unnamed'),
      kind: KINDS.includes(n.kind as never) ? (n.kind as InterfaceNode['kind']) : 'interface',
      fields: Array.isArray(n.fields) ? n.fields.filter(isObj).map(normField) : [],
      methods: Array.isArray(n.methods) ? n.methods.filter(isObj).map(normMethod) : [],
      memo: str(n.memo),
      position: { x: num(pos.x), y: num(pos.y) },
    }
    if (typeof n.color === 'string') node.color = n.color
    interfaces.push(node)
  }

  const relIds = new Set<string>()
  const relations: Relation[] = []
  for (const r of raw.relations) {
    if (!isObj(r) || typeof r.id !== 'string' || relIds.has(r.id)) continue
    if (typeof r.from !== 'string' || typeof r.to !== 'string') continue
    // 존재하지 않는 노드를 가리키는 관계는 버린다.
    if (!seen.has(r.from) || !seen.has(r.to) || r.from === r.to) continue
    relIds.add(r.id)
    const rel: Relation = {
      id: r.id,
      from: r.from,
      to: r.to,
      type: RELATION_TYPES.includes(r.type as never) ? (r.type as Relation['type']) : 'depends',
    }
    if (typeof r.label === 'string' && r.label) rel.label = r.label
    relations.push(rel)
  }

  return { version: 1, name: str(raw.name, 'Untitled'), memo: str(raw.memo), interfaces, relations }
}

function normField(f: Record<string, unknown>): Field {
  const out: Field = { name: str(f.name), type: str(f.type) }
  if (f.nullable === true) out.nullable = true
  return out
}

function normParam(p: Record<string, unknown>): Param {
  const out: Param = { name: str(p.name), type: str(p.type) }
  if (p.named === true) out.named = true
  if (typeof p.required === 'boolean') out.required = p.required
  if (typeof p.defaultValue === 'string' && p.defaultValue) out.defaultValue = p.defaultValue
  return out
}

function normMethod(m: Record<string, unknown>): Method {
  const out: Method = {
    name: str(m.name),
    params: Array.isArray(m.params) ? m.params.filter(isObj).map(normParam) : [],
    returns: str(m.returns, 'void'),
  }
  if (m.isAsync === true) out.isAsync = true
  return out
}

export function serializeDoc(doc: Doc): string {
  return JSON.stringify(doc, null, 2) + '\n'
}
