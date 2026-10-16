import { describe, expect, it } from 'vitest'
import { formatField, formatMethod, parseField, parseMethod } from './signature'

function field(line: string, enumValue = false) {
  const r = parseField(line, { enumValue })
  if (!r.ok) throw new Error(r.error)
  return r.value
}
function method(line: string) {
  const r = parseMethod(line)
  if (!r.ok) throw new Error(r.error)
  return r.value
}

describe('parseField', () => {
  it('nullable 타입을 분리한다', () => {
    expect(field('String? nickname')).toEqual({ name: 'nickname', type: 'String', nullable: true })
  })
  it('제네릭과 중첩 타입', () => {
    expect(field('Map<String, List<int>> table')).toEqual({ name: 'table', type: 'Map<String, List<int>>' })
    expect(field('Map< String ,List< int > >? t')).toEqual({ name: 't', type: 'Map<String, List<int>>', nullable: true })
  })
  it('final/late/세미콜론/기본값/getter를 허용한다', () => {
    expect(field('final int count;')).toEqual({ name: 'count', type: 'int' })
    expect(field('late final User user = User()')).toEqual({ name: 'user', type: 'User' })
    expect(field('bool get isLoggedIn')).toEqual({ name: 'isLoggedIn', type: 'bool' })
  })
  it('함수 타입과 레코드 타입', () => {
    expect(field('void Function(String) onTap')).toEqual({ name: 'onTap', type: 'void Function(String)' })
    expect(field('(int, String)? pair')).toEqual({ name: 'pair', type: '(int, String)', nullable: true })
  })
  it('enum 값은 이름만', () => {
    expect(field('loading', true)).toEqual({ name: 'loading', type: '' })
    expect(field('loading,'.replace(',', ''), true).name).toBe('loading')
  })
  it('잘못된 입력은 에러', () => {
    expect(parseField('nickname').ok).toBe(false)
    expect(parseField('List<int nums').ok).toBe(false)
    expect(parseField('String 1abc').ok).toBe(false)
    expect(parseField('   ').ok).toBe(false)
    expect(parseField('a b', { enumValue: true }).ok).toBe(false)
  })
})

describe('parseMethod', () => {
  it('SPEC 예시: named required 매개변수', () => {
    expect(method('Future<User> login(String id, {required String password})')).toEqual({
      name: 'login',
      returns: 'Future<User>',
      isAsync: true,
      params: [
        { name: 'id', type: 'String', required: true },
        { name: 'password', type: 'String', named: true, required: true },
      ],
    })
  })
  it('optional positional과 기본값', () => {
    expect(method('List<Item> page(int index, [int size = 20])').params).toEqual([
      { name: 'index', type: 'int', required: true },
      { name: 'size', type: 'int', required: false, defaultValue: '20' },
    ])
  })
  it('named 기본값과 nullable', () => {
    expect(method('void f({int? limit, bool force = false})').params).toEqual([
      { name: 'limit', type: 'int?', named: true, required: false },
      { name: 'force', type: 'bool', named: true, required: false, defaultValue: 'false' },
    ])
  })
  it('반환 타입 생략 시 void, 매개변수 없음', () => {
    expect(method('dispose()')).toEqual({ name: 'dispose', params: [], returns: 'void' })
  })
  it('async 키워드는 Future/Stream으로 흡수', () => {
    expect(method('User load() async')).toMatchObject({ returns: 'Future<User>', isAsync: true })
    expect(method('void save() async')).toMatchObject({ returns: 'Future<void>', isAsync: true })
    expect(method('int ticks() async*')).toMatchObject({ returns: 'Stream<int>', isAsync: true })
    expect(method('Future<void> run() async')).toMatchObject({ returns: 'Future<void>', isAsync: true })
  })
  it('제네릭 메서드, 함수 타입 매개변수, 중첩 괄호', () => {
    expect(method('T read<T>(String key)')).toMatchObject({ name: 'read<T>', returns: 'T' })
    const m = method('Stream<Map<String, dynamic>> watch(void Function(int, String) cb, {Duration? every})')
    expect(m.returns).toBe('Stream<Map<String, dynamic>>')
    expect(m.params[0]).toEqual({ name: 'cb', type: 'void Function(int, String)', required: true })
    expect(m.params[1]).toEqual({ name: 'every', type: 'Duration?', named: true, required: false })
  })
  it('함수 타입을 반환', () => {
    expect(method('void Function() listen(String topic)')).toMatchObject({ name: 'listen', returns: 'void Function()' })
  })
  it('@override, static, 세미콜론, trailing comma', () => {
    expect(method('@override Future<void> close();')).toMatchObject({ name: 'close', returns: 'Future<void>' })
    expect(method('static Foo create({required int a,})').params).toHaveLength(1)
  })
  it('잘못된 입력은 에러', () => {
    expect(parseMethod('Future<User> login').ok).toBe(false)
    expect(parseMethod('void f(int a, [int b], {int c})').ok).toBe(false)
    expect(parseMethod('void f(int a = 1)').ok).toBe(false)
    expect(parseMethod('void f({required int a = 1})').ok).toBe(false)
    expect(parseMethod('void f(int a, int a)').ok).toBe(false)
    expect(parseMethod('Future<User login()').ok).toBe(false)
    expect(parseMethod('void f(int a,, int b)').ok).toBe(false)
  })
})

describe('format ↔ parse 왕복', () => {
  const methods = [
    'Future<User> login(String id, {required String password})',
    'List<Item> page(int index, [int size = 20])',
    'void f({int? limit, bool force = false})',
    'Stream<User?> authStateChanges()',
    'T read<T>(String key)',
    'void Function(int, String) handler(Map<String, List<int>> m)',
  ]
  it.each(methods)('%s', (line) => {
    expect(formatMethod(method(line))).toBe(line)
  })

  const fields = ['String? nickname', 'Map<String, List<int>> table', 'void Function(String)? onTap', '(int, String) pair']
  it.each(fields)('%s', (line) => {
    expect(formatField(field(line))).toBe(line)
  })
})
