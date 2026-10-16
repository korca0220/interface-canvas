import type { Doc } from './types'

/** 첫 실행 시 불러오는 예시 문서. Flutter 클린 아키텍처의 로그인 흐름. */
export function exampleDoc(): Doc {
  return {
    version: 1,
    name: 'Auth 예시',
    memo: [
      '# Auth 모듈 설계',
      '',
      '로그인 흐름의 인터페이스 초안입니다. 노드를 선택하면 오른쪽에서 메모와 시그니처를 편집할 수 있어요.',
      '',
      '- [x] Repository 인터페이스 정의',
      '- [ ] 토큰 갱신 정책 정하기',
      '- [ ] 에러 타입 정리 (`AuthFailure`)',
    ].join('\n'),
    interfaces: [
      {
        id: 'n_authrepo',
        name: 'AuthRepository',
        kind: 'interface',
        fields: [{ name: 'currentUser', type: 'User', nullable: true }],
        methods: [
          {
            name: 'login',
            params: [
              { name: 'id', type: 'String', required: true },
              { name: 'password', type: 'String', named: true, required: true },
            ],
            returns: 'Future<User>',
            isAsync: true,
          },
          { name: 'logout', params: [], returns: 'Future<void>', isAsync: true },
          { name: 'authStateChanges', params: [], returns: 'Stream<User?>', isAsync: true },
        ],
        memo: '인증 상태의 **단일 진실 공급원**.\n\n- 토큰 저장은 구현체 책임\n- 실패 시 `AuthFailure`를 던진다',
        color: '#6366f1',
        position: { x: 0, y: 0 },
      },
      {
        id: 'n_authrepoimpl',
        name: 'AuthRepositoryImpl',
        kind: 'class',
        fields: [],
        methods: [
          {
            name: 'login',
            params: [
              { name: 'id', type: 'String', required: true },
              { name: 'password', type: 'String', named: true, required: true },
            ],
            returns: 'Future<User>',
            isAsync: true,
          },
          { name: 'logout', params: [], returns: 'Future<void>', isAsync: true },
          { name: 'authStateChanges', params: [], returns: 'Stream<User?>', isAsync: true },
        ],
        memo: '`AuthApi`로 서버와 통신하고 토큰은 secure storage에 보관.',
        color: '#0ea5e9',
        position: { x: 0, y: 340 },
      },
      {
        id: 'n_authapi',
        name: 'AuthApi',
        kind: 'interface',
        fields: [],
        methods: [
          {
            name: 'postLogin',
            params: [
              { name: 'id', type: 'String', required: true },
              { name: 'password', type: 'String', required: true },
            ],
            returns: 'Future<Map<String, dynamic>>',
            isAsync: true,
          },
          { name: 'postLogout', params: [{ name: 'token', type: 'String', required: true }], returns: 'Future<void>', isAsync: true },
        ],
        memo: 'REST 클라이언트(dio) 래퍼.',
        color: '#64748b',
        position: { x: 440, y: 340 },
      },
      {
        id: 'n_loginusecase',
        name: 'LoginUseCase',
        kind: 'class',
        fields: [],
        methods: [
          {
            name: 'call',
            params: [
              { name: 'id', type: 'String', named: true, required: true },
              { name: 'password', type: 'String', named: true, required: true },
              { name: 'rememberMe', type: 'bool', named: true, required: false, defaultValue: 'false' },
            ],
            returns: 'Future<User>',
            isAsync: true,
          },
        ],
        memo: '입력 검증 후 `AuthRepository.login` 호출.',
        color: '#10b981',
        position: { x: -440, y: 0 },
      },
      {
        id: 'n_user',
        name: 'User',
        kind: 'model',
        fields: [
          { name: 'id', type: 'String' },
          { name: 'email', type: 'String' },
          { name: 'nickname', type: 'String', nullable: true },
          { name: 'createdAt', type: 'DateTime' },
        ],
        methods: [],
        memo: '불변 모델. `freezed` 적용 예정.',
        color: '#f59e0b',
        position: { x: 440, y: 0 },
      },
      {
        id: 'n_authfailure',
        name: 'AuthFailure',
        kind: 'enum',
        fields: [
          { name: 'invalidCredentials', type: '' },
          { name: 'network', type: '' },
          { name: 'tokenExpired', type: '' },
        ],
        methods: [],
        memo: '',
        color: '#ef4444',
        position: { x: -440, y: 340 },
      },
    ],
    relations: [
      { id: 'r_impl', from: 'n_authrepoimpl', to: 'n_authrepo', type: 'implements' },
      { id: 'r_api', from: 'n_authrepoimpl', to: 'n_authapi', type: 'depends' },
      { id: 'r_uc', from: 'n_loginusecase', to: 'n_authrepo', type: 'depends' },
      { id: 'r_user', from: 'n_authrepo', to: 'n_user', type: 'uses' },
      { id: 'r_fail', from: 'n_authrepoimpl', to: 'n_authfailure', type: 'creates', label: 'throws' },
    ],
  }
}
