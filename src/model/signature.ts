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

// ---------------------------------------------------------------------------
// 파서: Dart 스타일 한 줄 텍스트 → 모델
// ---------------------------------------------------------------------------

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string }

const ok = <T>(value: T): ParseResult<T> => ({ ok: true, value })
const fail = <T>(error: string): ParseResult<T> => ({ ok: false, error })

const IDENT = /^[A-Za-z_$][\w$]*$/
const OPEN: Record<string, string> = { '(': ')', '<': '>', '[': ']', '{': '}' }
const CLOSE: Record<string, string> = { ')': '(', '>': '<', ']': '[', '}': '{' }

/** 괄호 짝이 맞는지 확인한다. */
function balanced(s: string): boolean {
  const stack: string[] = []
  for (const ch of s) {
    if (OPEN[ch]) stack.push(ch)
    else if (CLOSE[ch]) {
      if (stack.pop() !== CLOSE[ch]) return false
    }
  }
  return stack.length === 0
}

/** 괄호 깊이 0인 위치에서 sep으로 나눈다. */
function splitTopLevel(s: string, sep: string): string[] {
  const parts: string[] = []
  let depth = 0
  let cur = ''
  for (const ch of s) {
    if (OPEN[ch]) depth++
    else if (CLOSE[ch]) depth--
    if (ch === sep && depth === 0) {
      parts.push(cur)
      cur = ''
    } else cur += ch
  }
  parts.push(cur)
  return parts
}

/** 괄호 깊이 0인 첫 번째 ch의 위치 */
function indexTopLevel(s: string, ch: string): number {
  let depth = 0
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (c === ch && depth === 0) return i
    if (OPEN[c]) depth++
    else if (CLOSE[c]) depth--
  }
  return -1
}

/** close 인덱스의 닫는 괄호와 짝이 되는 여는 괄호 위치 (뒤에서부터 탐색) */
function matchingOpen(s: string, close: number): number {
  let depth = 0
  for (let i = close; i >= 0; i--) {
    const c = s[i]
    if (CLOSE[c]) depth++
    else if (OPEN[c]) {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

/** "타입 이름" 형태를 마지막 공백(괄호 밖) 기준으로 나눈다. */
function splitTypeAndName(s: string): { type: string; name: string } | null {
  let depth = 0
  for (let i = s.length - 1; i >= 0; i--) {
    const c = s[i]
    if (CLOSE[c]) depth++
    else if (OPEN[c]) depth--
    else if (/\s/.test(c) && depth === 0) {
      return { type: s.slice(0, i).trim(), name: s.slice(i + 1).trim() }
    }
  }
  return null
}

function normalizeSpaces(s: string): string {
  return s
    .replace(/\s+/g, ' ')
    .replace(/\s*([<>(),[\]{}])\s*/g, '$1')
    .replace(/,/g, ', ')
    .replace(/\bFunction\(/g, 'Function(')
    .replace(/\)(?=[A-Za-z_$])/g, ') ')
    .trim()
}

/** 타입 문자열 정리: 공백 정규화 + 괄호 검사 */
function cleanType(raw: string): ParseResult<string> {
  const t = normalizeSpaces(raw)
  if (!t) return fail('타입이 비어 있습니다')
  if (!balanced(t)) return fail(`괄호 짝이 맞지 않습니다: ${t}`)
  return ok(t)
}

const stripSemicolon = (s: string) => s.trim().replace(/;+\s*$/, '').trim()

/**
 * 필드 한 줄을 파싱한다.
 * 예: `String? nickname`, `final List<User> users`, `int get count`, enum이면 `loading`
 */
export function parseField(line: string, opts: { enumValue?: boolean } = {}): ParseResult<Field> {
  let s = stripSemicolon(line)
  if (!s) return fail('빈 줄입니다')

  if (opts.enumValue) {
    // enum 값: 이름만, 또는 "name(args)" 형태 허용 시 이름만 취함
    const name = s.replace(/\(.*\)$/, '').trim()
    if (!IDENT.test(name)) return fail(`enum 값 이름이 올바르지 않습니다: ${s}`)
    return ok({ name, type: '' })
  }

  s = s.replace(/^(?:(?:static|final|late|const|external|covariant)\s+)+/, '')
  const eq = indexTopLevel(s, '=')
  if (eq >= 0) s = s.slice(0, eq).trim() // 기본값은 필드 모델에 없으므로 버린다

  const parts = splitTypeAndName(s)
  if (!parts) return fail('"타입 이름" 형식이어야 합니다 (예: String? nickname)')
  let { type: rawType } = parts
  const { name } = parts
  // getter: "int get count"
  rawType = rawType.replace(/\s+get$/, '')
  if (!IDENT.test(name)) return fail(`필드 이름이 올바르지 않습니다: ${name}`)

  const t = cleanType(rawType)
  if (!t.ok) return t
  let type = t.value
  let nullable = false
  if (type.endsWith('?') && type !== '?') {
    nullable = true
    type = type.slice(0, -1)
  }
  if (type === 'var') type = 'dynamic'
  const field: Field = { name, type }
  if (nullable) field.nullable = true
  return ok(field)
}

function parseParam(raw: string, mode: 'positional' | 'optional' | 'named'): ParseResult<Param> {
  let s = raw.trim()
  let required = mode === 'positional'
  if (mode === 'named' && /^required\s/.test(s)) {
    required = true
    s = s.replace(/^required\s+/, '')
  }
  s = s.replace(/^(?:(?:final|covariant)\s+)+/, '')

  let defaultValue: string | undefined
  // "=" (현재 문법) 또는 named의 ":" (구 문법)로 기본값 지정
  let eq = indexTopLevel(s, '=')
  if (eq < 0 && mode === 'named') eq = indexTopLevel(s, ':')
  if (eq >= 0) {
    defaultValue = normalizeSpaces(s.slice(eq + 1))
    s = s.slice(0, eq).trim()
    if (!defaultValue) return fail(`기본값이 비어 있습니다: ${raw.trim()}`)
    if (mode === 'positional') return fail(`필수 위치 매개변수에는 기본값을 줄 수 없습니다. [ ]로 감싸세요: ${raw.trim()}`)
  }

  let type: string
  let name: string
  const parts = splitTypeAndName(s)
  if (parts) {
    const t = cleanType(parts.type)
    if (!t.ok) return t
    type = t.value
    name = parts.name
  } else {
    // 타입 없는 매개변수는 dynamic
    type = 'dynamic'
    name = s
  }
  if (!IDENT.test(name)) return fail(`매개변수 이름이 올바르지 않습니다: ${name || raw.trim()}`)
  if (required && mode === 'named' && defaultValue) return fail(`required 매개변수에는 기본값을 줄 수 없습니다: ${name}`)

  const p: Param = { name, type }
  if (mode === 'named') p.named = true
  p.required = required
  if (defaultValue) p.defaultValue = defaultValue
  return ok(p)
}

function parseParamList(inner: string): ParseResult<Param[]> {
  const s = inner.trim()
  if (!s) return ok([])
  const braceAt = indexTopLevel(s, '{')
  const bracketAt = indexTopLevel(s, '[')
  if (braceAt >= 0 && bracketAt >= 0) return fail('[ ]와 { }를 함께 쓸 수 없습니다')

  const groupAt = braceAt >= 0 ? braceAt : bracketAt
  const positionalText = groupAt >= 0 ? s.slice(0, groupAt) : s
  let groupText = ''
  if (groupAt >= 0) {
    const closeCh = braceAt >= 0 ? '}' : ']'
    const rest = s.slice(groupAt).trim()
    if (!rest.endsWith(closeCh)) return fail(`${closeCh}로 끝나야 합니다`)
    groupText = rest.slice(1, -1)
  }

  const params: Param[] = []
  const positional = splitTopLevel(positionalText, ',').map((x) => x.trim())
  // 그룹 앞의 마지막 콤마로 생긴 빈 조각은 허용
  if (groupAt >= 0 && positional[positional.length - 1] === '') positional.pop()
  for (const piece of positional) {
    if (!piece) return fail('빈 매개변수가 있습니다')
    const r = parseParam(piece, 'positional')
    if (!r.ok) return r
    params.push(r.value)
  }
  if (groupAt >= 0) {
    const mode = braceAt >= 0 ? 'named' : 'optional'
    const pieces = splitTopLevel(groupText, ',').map((x) => x.trim())
    if (pieces[pieces.length - 1] === '') pieces.pop() // trailing comma
    for (const piece of pieces) {
      if (!piece) return fail('빈 매개변수가 있습니다')
      const r = parseParam(piece, mode)
      if (!r.ok) return r
      params.push(r.value)
    }
  }
  const names = new Set<string>()
  for (const p of params) {
    if (names.has(p.name)) return fail(`매개변수 이름이 중복됩니다: ${p.name}`)
    names.add(p.name)
  }
  return ok(params)
}

const ASYNC_RETURN = /^(Future|FutureOr|Stream)(<|\?|$)/

/**
 * 메서드 한 줄을 파싱한다.
 * 예: `Future<User> login(String id, {required String password})`
 *     `T read<T>(String key)`, `void dispose()`, `fetch() async` (반환 타입 생략 시 void)
 */
export function parseMethod(line: string): ParseResult<Method> {
  let s = stripSemicolon(line)
  if (!s) return fail('빈 줄입니다')
  s = s.replace(/^(?:@override\s+)?(?:(?:static|external)\s+)*/, '')

  let asyncKeyword: '' | 'async' | 'async*' = ''
  const asyncMatch = s.match(/\)\s*(async\*?)$/)
  if (asyncMatch) {
    asyncKeyword = asyncMatch[1] as 'async' | 'async*'
    s = s.slice(0, s.length - asyncMatch[1].length).trim()
  }
  if (!s.endsWith(')')) return fail('메서드는 "반환타입 이름(매개변수)" 형식이어야 합니다')
  const open = matchingOpen(s, s.length - 1)
  if (open < 0) return fail('괄호 짝이 맞지 않습니다')

  const inner = s.slice(open + 1, -1)
  let head = s.slice(0, open).trim()

  // 이름 (제네릭 타입 매개변수 포함 가능: read<T>)
  let generics = ''
  if (head.endsWith('>')) {
    const lt = matchingOpen(head, head.length - 1)
    if (lt < 0) return fail('제네릭 괄호 짝이 맞지 않습니다')
    generics = normalizeSpaces(head.slice(lt))
    head = head.slice(0, lt).trimEnd()
  }
  const nameMatch = head.match(/([A-Za-z_$][\w$]*)$/)
  if (!nameMatch) return fail('메서드 이름이 없습니다')
  const name = nameMatch[1]
  const retRaw = head.slice(0, head.length - name.length).trim()
  if (retRaw && !/\s$/.test(head.slice(0, head.length - name.length)) && !/[>)?\]]$/.test(retRaw)) {
    return fail('반환 타입과 이름 사이에 공백이 필요합니다')
  }

  let returns = 'void'
  if (retRaw) {
    const t = cleanType(retRaw)
    if (!t.ok) return t
    returns = t.value
  }

  const params = parseParamList(inner)
  if (!params.ok) return params

  // async 키워드는 반환 타입으로 흡수한다: async → Future<T>, async* → Stream<T>
  if (asyncKeyword === 'async' && !/^(Future|FutureOr)\b/.test(returns)) returns = `Future<${returns}>`
  if (asyncKeyword === 'async*' && !/^Stream\b/.test(returns)) returns = `Stream<${returns}>`

  const method: Method = { name: name + generics, params: params.value, returns }
  if (ASYNC_RETURN.test(returns)) method.isAsync = true
  return ok(method)
}
