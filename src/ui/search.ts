import type { InterfaceNode } from '../model/types'

export type SearchHit = { node: InterfaceNode; score: number; match?: string }

/**
 * 인터페이스 이름 검색. 점수: 정확히 일치 > 접두사 > 단어 시작(CamelCase) > 부분 문자열 > 약어(subsequence).
 * 이름이 안 맞으면 필드/메서드 이름도 낮은 점수로 찾는다.
 */
export function searchInterfaces(nodes: InterfaceNode[], query: string): SearchHit[] {
  const q = query.trim().toLowerCase()
  if (!q) return [...nodes].sort((a, b) => a.name.localeCompare(b.name)).map((node) => ({ node, score: 0 }))
  const hits: SearchHit[] = []
  for (const node of nodes) {
    const s = nameScore(node.name, q)
    if (s > 0) {
      hits.push({ node, score: s })
      continue
    }
    const member = [...node.fields.map((f) => f.name), ...node.methods.map((m) => m.name)].find((n) =>
      n.toLowerCase().includes(q),
    )
    if (member) hits.push({ node, score: 1, match: member })
  }
  return hits.sort((a, b) => b.score - a.score || a.node.name.localeCompare(b.node.name))
}

function nameScore(name: string, q: string): number {
  const n = name.toLowerCase()
  if (n === q) return 100
  if (n.startsWith(q)) return 80
  // CamelCase 단어 시작: "repo" → AuthRepository
  const words = name.split(/(?=[A-Z])/).map((w) => w.toLowerCase())
  for (let i = 1; i < words.length; i++) if (words.slice(i).join('').startsWith(q)) return 60
  if (n.includes(q)) return 40
  // 약어: "arimpl" → AuthRepositoryImpl
  let j = 0
  for (const ch of n) if (ch === q[j]) j++
  return j === q.length ? 20 : 0
}
