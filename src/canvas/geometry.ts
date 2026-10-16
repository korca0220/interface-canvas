export type Rect = { x: number; y: number; width: number; height: number }
export type Point = { x: number; y: number }

export function center(r: Rect): Point {
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
}

/** r의 중심에서 toward 방향으로 쏜 반직선이 r의 경계와 만나는 점 */
export function borderPoint(r: Rect, toward: Point, offset: Point = { x: 0, y: 0 }): Point {
  const c = center(r)
  const from = { x: c.x + offset.x, y: c.y + offset.y }
  const dx = toward.x - from.x
  const dy = toward.y - from.y
  if (dx === 0 && dy === 0) return from
  const hw = r.width / 2
  const hh = r.height / 2
  const tx = dx === 0 ? Infinity : hw / Math.abs(dx)
  const ty = dy === 0 ? Infinity : hh / Math.abs(dy)
  const t = Math.min(tx, ty)
  return { x: from.x + dx * t, y: from.y + dy * t }
}

/**
 * 두 사각형을 잇는 직선의 양 끝점. offset은 같은 두 노드 사이의 평행 엣지를
 * 수직 방향으로 벌리기 위한 값(px)이다.
 */
export function floatingEndpoints(a: Rect, b: Rect, offset = 0): { source: Point; target: Point } {
  const ca = center(a)
  const cb = center(b)
  const len = Math.hypot(cb.x - ca.x, cb.y - ca.y) || 1
  const nx = (-(cb.y - ca.y) / len) * offset
  const ny = ((cb.x - ca.x) / len) * offset
  const o = { x: nx, y: ny }
  const source = borderPoint(a, { x: cb.x + nx, y: cb.y + ny }, o)
  const target = borderPoint(b, { x: ca.x + nx, y: ca.y + ny }, o)
  return { source, target }
}
