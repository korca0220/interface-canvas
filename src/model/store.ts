import { create } from 'zustand'
import { createInterface, emptyDoc, uniqueName } from './doc'
import { newId } from './id'
import type { Doc, InterfaceNode, Relation, RelationType } from './types'

const HISTORY_LIMIT = 200
/** 같은 coalesce 키로 이 시간 안에 연속 커밋되면 히스토리 한 칸으로 합친다 (타이핑 등). */
const COALESCE_MS = 1000

export type Selection = { nodes: string[]; edges: string[] }

type CommitOptions = { coalesce?: string }

export type DocState = {
  doc: Doc
  selection: Selection
  past: Doc[]
  future: Doc[]
  /** 내부용: 마지막 coalesce 키와 시각 */
  lastCoalesce: { key: string; at: number } | null
  /** 내부용: 드래그 같은 제스처가 시작될 때의 문서 */
  gestureBase: Doc | null

  commit: (recipe: (doc: Doc) => Doc, opts?: CommitOptions) => void
  /** 히스토리에 남기지 않는 변경 (제스처 도중의 위치 이동) */
  setTransient: (recipe: (doc: Doc) => Doc) => void
  beginGesture: () => void
  endGesture: () => void
  undo: () => void
  redo: () => void
  loadDoc: (doc: Doc) => void

  setSelection: (sel: Partial<Selection>) => void
  addInterface: (partial?: Partial<InterfaceNode>) => string
  updateInterface: (id: string, patch: Partial<Omit<InterfaceNode, 'id'>>, opts?: CommitOptions) => void
  moveInterfaces: (positions: Record<string, { x: number; y: number }>) => void
  deleteItems: (nodeIds: string[], edgeIds: string[]) => void
  addRelation: (from: string, to: string, type?: RelationType) => string | null
  updateRelation: (id: string, patch: Partial<Omit<Relation, 'id'>>, opts?: CommitOptions) => void
  updateDocMeta: (patch: Partial<Pick<Doc, 'name' | 'memo'>>, opts?: CommitOptions) => void
}

function pruneSelection(sel: Selection, doc: Doc): Selection {
  const nodeIds = new Set(doc.interfaces.map((n) => n.id))
  const edgeIds = new Set(doc.relations.map((r) => r.id))
  return { nodes: sel.nodes.filter((id) => nodeIds.has(id)), edges: sel.edges.filter((id) => edgeIds.has(id)) }
}

function pushPast(past: Doc[], doc: Doc): Doc[] {
  const next = [...past, doc]
  return next.length > HISTORY_LIMIT ? next.slice(next.length - HISTORY_LIMIT) : next
}

/** 관계 생성 시 기본 종류 추정: FooImpl → Foo 같은 이름 패턴이면 implements/extends. */
export function guessRelationType(from: InterfaceNode, to: InterfaceNode): RelationType {
  const nameMatch = from.name !== to.name && from.name.startsWith(to.name)
  if (nameMatch && (to.kind === 'interface' || to.kind === 'abstract')) {
    return to.kind === 'interface' ? 'implements' : 'extends'
  }
  if (to.kind === 'model' || to.kind === 'enum') return 'uses'
  return 'depends'
}

export const useDocStore = create<DocState>()((set, get) => ({
  doc: emptyDoc(),
  selection: { nodes: [], edges: [] },
  past: [],
  future: [],
  lastCoalesce: null,
  gestureBase: null,

  commit: (recipe, opts) => {
    const { doc, past, lastCoalesce, selection } = get()
    const next = recipe(doc)
    if (next === doc) return
    const now = Date.now()
    const merge = !!opts?.coalesce && lastCoalesce?.key === opts.coalesce && now - lastCoalesce.at < COALESCE_MS
    set({
      doc: next,
      past: merge ? past : pushPast(past, doc),
      future: [],
      lastCoalesce: opts?.coalesce ? { key: opts.coalesce, at: now } : null,
      selection: pruneSelection(selection, next),
    })
  },

  setTransient: (recipe) => {
    const { doc } = get()
    const next = recipe(doc)
    if (next !== doc) set({ doc: next })
  },

  beginGesture: () => {
    if (!get().gestureBase) set({ gestureBase: get().doc })
  },

  endGesture: () => {
    const { gestureBase, doc, past } = get()
    if (!gestureBase) return
    if (gestureBase === doc) {
      set({ gestureBase: null })
      return
    }
    set({ gestureBase: null, past: pushPast(past, gestureBase), future: [], lastCoalesce: null })
  },

  undo: () => {
    const { past, future, doc, selection } = get()
    const prev = past[past.length - 1]
    if (!prev) return
    set({
      doc: prev,
      past: past.slice(0, -1),
      future: [doc, ...future],
      lastCoalesce: null,
      selection: pruneSelection(selection, prev),
    })
  },

  redo: () => {
    const { past, future, doc, selection } = get()
    const next = future[0]
    if (!next) return
    set({
      doc: next,
      past: pushPast(past, doc),
      future: future.slice(1),
      lastCoalesce: null,
      selection: pruneSelection(selection, next),
    })
  },

  loadDoc: (doc) =>
    set({ doc, past: [], future: [], lastCoalesce: null, gestureBase: null, selection: { nodes: [], edges: [] } }),

  setSelection: (sel) => {
    const cur = get().selection
    const next = { nodes: sel.nodes ?? cur.nodes, edges: sel.edges ?? cur.edges }
    if (sameIds(cur.nodes, next.nodes) && sameIds(cur.edges, next.edges)) return
    set({ selection: next })
  },

  addInterface: (partial) => {
    const doc = get().doc
    const node = createInterface({ ...partial, name: uniqueName(doc, partial?.name ?? 'NewInterface') })
    get().commit((d) => ({ ...d, interfaces: [...d.interfaces, node] }))
    set({ selection: { nodes: [node.id], edges: [] } })
    return node.id
  },

  updateInterface: (id, patch, opts) =>
    get().commit(
      (d) => ({ ...d, interfaces: d.interfaces.map((n) => (n.id === id ? { ...n, ...patch } : n)) }),
      opts,
    ),

  moveInterfaces: (positions) =>
    get().setTransient((d) => ({
      ...d,
      interfaces: d.interfaces.map((n) => (positions[n.id] ? { ...n, position: positions[n.id] } : n)),
    })),

  deleteItems: (nodeIds, edgeIds) => {
    if (!nodeIds.length && !edgeIds.length) return
    const nodes = new Set(nodeIds)
    const edges = new Set(edgeIds)
    get().commit((d) => ({
      ...d,
      interfaces: d.interfaces.filter((n) => !nodes.has(n.id)),
      relations: d.relations.filter((r) => !edges.has(r.id) && !nodes.has(r.from) && !nodes.has(r.to)),
    }))
  },

  addRelation: (from, to, type) => {
    const doc = get().doc
    if (from === to) return null
    const a = doc.interfaces.find((n) => n.id === from)
    const b = doc.interfaces.find((n) => n.id === to)
    if (!a || !b) return null
    const relType = type ?? guessRelationType(a, b)
    if (doc.relations.some((r) => r.from === from && r.to === to && r.type === relType)) return null
    const rel: Relation = { id: newId('r'), from, to, type: relType }
    get().commit((d) => ({ ...d, relations: [...d.relations, rel] }))
    set({ selection: { nodes: [], edges: [rel.id] } })
    return rel.id
  },

  updateRelation: (id, patch, opts) =>
    get().commit((d) => ({ ...d, relations: d.relations.map((r) => (r.id === id ? { ...r, ...patch } : r)) }), opts),

  updateDocMeta: (patch, opts) => get().commit((d) => ({ ...d, ...patch }), opts),
}))

function sameIds(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id, i) => id === b[i])
}
