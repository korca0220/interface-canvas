import { describe, expect, it } from 'vitest'
import { exampleDoc } from '../model/example'
import { emptyDoc, createInterface } from '../model/doc'
import type { Doc, InterfaceNode, Relation } from '../model/types'
import { lowerCamel, toDart } from './dart'
import { mermaidName, mermaidType, toMermaid } from './mermaid'

function doc(interfaces: InterfaceNode[], relations: Omit<Relation, 'id'>[] = []): Doc {
  return { ...emptyDoc('Test'), interfaces, relations: relations.map((r, i) => ({ ...r, id: `r${i}` })) }
}
const node = (id: string, p: Partial<InterfaceNode>) => createInterface({ id, ...p })

describe('toDart', () => {
  it('interface는 abstract interface class + 추상 getter/메서드', () => {
    const d = doc([
      node('a', {
        name: 'AuthRepository',
        fields: [{ name: 'currentUser', type: 'User', nullable: true }],
        methods: [
          {
            name: 'login',
            returns: 'Future<User>',
            params: [
              { name: 'id', type: 'String', required: true },
              { name: 'password', type: 'String', named: true, required: true },
            ],
          },
        ],
        memo: '인증 저장소\n\n- 토큰 관리',
      }),
    ])
    expect(toDart(d, ['a'])).toBe(
      [
        '/// 인증 저장소',
        '///',
        '/// - 토큰 관리',
        'abstract interface class AuthRepository {',
        '  User? get currentUser;',
        '',
        '  Future<User> login(String id, {required String password});',
        '}',
        '',
      ].join('\n'),
    )
  })

  it('implements/extends 관계를 선언부에 반영한다', () => {
    const d = doc(
      [
        node('base', { name: 'Base', kind: 'abstract' }),
        node('i1', { name: 'A' }),
        node('i2', { name: 'B' }),
        node('c', { name: 'Impl', kind: 'abstract' }),
      ],
      [
        { from: 'c', to: 'base', type: 'extends' },
        { from: 'c', to: 'i1', type: 'implements' },
        { from: 'c', to: 'i2', type: 'implements' },
      ],
    )
    expect(toDart(d, ['c'])).toBe('abstract class Impl extends Base implements A, B {}\n')
  })

  it('다중 extends는 첫 번째만 쓰고 NOTE를 남긴다', () => {
    const d = doc(
      [node('x', { name: 'X', kind: 'abstract' }), node('y', { name: 'Y', kind: 'abstract' }), node('c', { name: 'C', kind: 'abstract' })],
      [
        { from: 'c', to: 'x', type: 'extends' },
        { from: 'c', to: 'y', type: 'extends' },
      ],
    )
    const out = toDart(d, ['c'])
    expect(out).toContain('abstract class C extends X {}')
    expect(out).toContain('// NOTE: Dart는 단일 상속만 지원합니다. 추가 extends: Y')
  })

  it('class 구현체: depends 주입, @override, 누락 멤버 스텁', () => {
    const out = toDart(exampleDoc(), ['n_authrepoimpl'])
    expect(out).toBe(
      [
        '/// `AuthApi`로 서버와 통신하고 토큰은 secure storage에 보관.',
        'class AuthRepositoryImpl implements AuthRepository {',
        '  final AuthApi _authApi;',
        '',
        '  AuthRepositoryImpl(this._authApi);',
        '',
        '  @override',
        '  User? get currentUser => throw UnimplementedError();',
        '',
        '  @override',
        '  Future<User> login(String id, {required String password}) => throw UnimplementedError();',
        '',
        '  @override',
        '  Future<void> logout() => throw UnimplementedError();',
        '',
        '  @override',
        '  Stream<User?> authStateChanges() => throw UnimplementedError();',
        '}',
        '',
      ].join('\n'),
    )
  })

  it('구체 클래스를 extends하면 누락 멤버 스텁을 만들지 않는다', () => {
    const d = doc(
      [
        node('p', { name: 'Parent', kind: 'class', methods: [{ name: 'run', params: [], returns: 'void' }] }),
        node('c', { name: 'Child', kind: 'class' }),
      ],
      [{ from: 'c', to: 'p', type: 'extends' }],
    )
    expect(toDart(d, ['c'])).toBe('class Child extends Parent {}\n')
  })

  it('model은 final 필드와 const 생성자', () => {
    const out = toDart(exampleDoc(), ['n_user'])
    expect(out).toBe(
      [
        '/// 불변 모델. `freezed` 적용 예정.',
        'class User {',
        '  final String id;',
        '  final String email;',
        '  final String? nickname;',
        '  final DateTime createdAt;',
        '',
        '  const User({required this.id, required this.email, this.nickname, required this.createdAt});',
        '}',
        '',
      ].join('\n'),
    )
  })

  it('enum 값', () => {
    expect(toDart(exampleDoc(), ['n_authfailure'])).toBe(
      ['enum AuthFailure {', '  invalidCredentials,', '  network,', '  tokenExpired,', '}', ''].join('\n'),
    )
  })

  it('UseCase: 기본값 있는 named 매개변수와 depends 주입', () => {
    const out = toDart(exampleDoc(), ['n_loginusecase'])
    expect(out).toContain('class LoginUseCase {')
    expect(out).toContain('  final AuthRepository _authRepository;')
    expect(out).toContain('  LoginUseCase(this._authRepository);')
    expect(out).toContain(
      '  Future<User> call({required String id, required String password, bool rememberMe = false}) => throw UnimplementedError();',
    )
    expect(out).not.toContain('@override')
  })

  it('전체 내보내기는 헤더 주석과 모든 노드를 포함한다', () => {
    const out = toDart(exampleDoc())
    expect(out.startsWith('// Auth 예시 — generated by Interface Canvas')).toBe(true)
    for (const name of ['AuthRepository', 'AuthRepositoryImpl', 'AuthApi', 'LoginUseCase', 'User', 'AuthFailure']) {
      expect(out).toMatch(new RegExp(`(class|enum) ${name}\\b`))
    }
  })

  it('순환 관계에서도 멈춘다', () => {
    const d = doc(
      [node('a', { name: 'A', kind: 'class' }), node('b', { name: 'B' })],
      [
        { from: 'a', to: 'b', type: 'implements' },
        { from: 'b', to: 'a', type: 'implements' },
      ],
    )
    expect(toDart(d)).toContain('class A implements B {}')
  })

  it('lowerCamel', () => {
    expect(lowerCamel('AuthApi')).toBe('authApi')
    expect(lowerCamel('HTTPClient')).toBe('httpClient')
    expect(lowerCamel('API')).toBe('api')
    expect(lowerCamel('Repository<T>')).toBe('repository')
  })
})

describe('toMermaid', () => {
  it('예시 문서 전체', () => {
    expect(toMermaid(exampleDoc())).toBe(
      [
        '---',
        'title: "Auth 예시"',
        '---',
        'classDiagram',
        '  class AuthRepository {',
        '    <<interface>>',
        '    +User? currentUser',
        '    +login(String id, String password) Future~User~',
        '    +logout() Future~void~',
        '    +authStateChanges() Stream~User?~',
        '  }',
        '  class AuthRepositoryImpl {',
        '    +login(String id, String password) Future~User~',
        '    +logout() Future~void~',
        '    +authStateChanges() Stream~User?~',
        '  }',
        '  class AuthApi {',
        '    <<interface>>',
        '    +postLogin(String id, String password) Future~Map~String, dynamic~~',
        '    +postLogout(String token) Future~void~',
        '  }',
        '  class LoginUseCase {',
        '    +call(String id, String password, bool rememberMe) Future~User~',
        '  }',
        '  class User {',
        '    <<model>>',
        '    +String id',
        '    +String email',
        '    +String? nickname',
        '    +DateTime createdAt',
        '  }',
        '  class AuthFailure {',
        '    <<enumeration>>',
        '    invalidCredentials',
        '    network',
        '    tokenExpired',
        '  }',
        '  AuthRepositoryImpl ..|> AuthRepository',
        '  AuthRepositoryImpl ..> AuthApi',
        '  LoginUseCase ..> AuthRepository',
        '  AuthRepository --> User',
        '  AuthRepositoryImpl ..> AuthFailure : «create» throws',
        '',
      ].join('\n'),
    )
  })

  it('선택 범위 밖으로 가는 관계는 제외한다', () => {
    const out = toMermaid(exampleDoc(), ['n_authrepo', 'n_user'])
    expect(out).toContain('AuthRepository --> User')
    expect(out).not.toContain('AuthRepositoryImpl')
  })

  it('관계 종류별 화살표', () => {
    const d = doc(
      [node('a', { name: 'A', kind: 'class' }), node('b', { name: 'B', kind: 'class' })],
      [
        { from: 'a', to: 'b', type: 'extends' },
        { from: 'a', to: 'b', type: 'uses', label: 'a: b' },
      ],
    )
    const out = toMermaid({ ...d, name: '' })
    expect(out).toBe(['classDiagram', '  class A', '  class B', '  A --|> B', '  A --> B : a  b', ''].join('\n'))
  })

  it('타입/이름 변환', () => {
    expect(mermaidType('Map<String, List<int>>')).toBe('Map~String, List~int~~')
    expect(mermaidName('Repository<T>')).toBe('Repository~T~')
    expect(mermaidName('My Class')).toBe('My_Class')
  })
})
