# Interface Canvas: MVP 요구사항

개인용 인터페이스 설계 도구입니다. 클래스 다이어그램처럼 인터페이스와 관계를 무한 캔버스에 배치하고,
선택한 인터페이스에 대한 메모를 오른쪽 패널에서 마크다운으로 작성합니다.
사용자는 1명(본인)이고, 로컬에서만 실행합니다. 로그인, 서버 DB, 협업, 배포 기능은 만들지 않습니다.

## 사용자 배경

- Flutter/Dart 모바일 개발자입니다. 인터페이스(abstract class, Repository, UseCase 등)를 코드 작성 전에 설계하려는 용도입니다.
- 따라서 코드 내보내기의 1순위 대상은 Dart입니다.

## 기술 스택

- Vite + React + TypeScript
- 캔버스: `@xyflow/react` (React Flow)
- 마크다운: 편집은 textarea 또는 CodeMirror, 미리보기는 `react-markdown` + `remark-gfm` (가벼운 쪽을 선택)
- 상태 관리: zustand
- 실행: `npm run dev` 한 번으로 실행되어야 합니다.

## 핵심 원칙

**화면보다 데이터 모델이 먼저입니다.** 캔버스와 메모 패널, 코드 내보내기는 모두 하나의 문서 모델을 보여주거나 변환하는 화면입니다.
React Flow의 node/edge 상태를 원본으로 삼지 말고, 문서 모델에서 파생해야 합니다.

```ts
type Doc = {
  version: 1;
  name: string;
  interfaces: InterfaceNode[];
  relations: Relation[];
};

type InterfaceNode = {
  id: string;
  name: string;                 // 예: AuthRepository
  kind: 'interface' | 'abstract' | 'class' | 'enum' | 'model';
  fields: { name: string; type: string; nullable?: boolean }[];
  methods: {
    name: string;
    params: { name: string; type: string; named?: boolean; required?: boolean }[];
    returns: string;            // 예: Future<User>
    isAsync?: boolean;
  }[];
  memo: string;                 // 마크다운
  color?: string;
  position: { x: number; y: number };
};

type Relation = {
  id: string;
  from: string;
  to: string;
  type: 'implements' | 'extends' | 'depends' | 'uses' | 'creates';
  label?: string;
};
```

## MVP 기능

### 캔버스
- 무한 캔버스, 휠/트랙패드 줌 인·아웃, 팬, 미니맵, fit view
- 노드는 UML 클래스 박스 형태로 표시합니다: 상단에 kind 배지와 이름, 그 아래 필드 목록, 그 아래 메서드 시그니처 목록
- 노드 드래그로 위치 이동, 다중 선택, Delete 키로 삭제
- 노드의 핸들을 드래그해서 다른 노드에 연결하면 관계가 생성됩니다. 관계 종류는 엣지를 선택해서 변경합니다.
- 관계 종류마다 선 스타일을 다르게 표시합니다 (implements: 점선 + 빈 삼각형, extends: 실선 + 빈 삼각형, depends/uses: 점선 화살표 등)
- 빈 곳 더블클릭 또는 툴바 버튼으로 새 인터페이스를 생성합니다.
- 줌 아웃 시에는 이름만 보이도록 상세 정보를 단계적으로 숨깁니다 (LOD).

### 오른쪽 패널 (노드를 선택했을 때)
- 이름, kind 편집
- 필드·메서드 편집: 한 줄 텍스트로 입력하면 파싱합니다. 예: `Future<User> login(String id, {required String password})`, `String? nickname`
- 마크다운 메모 편집 + 미리보기 토글
- 패널 너비는 드래그로 조절할 수 있습니다.
- 아무것도 선택하지 않았을 때는 문서 전체에 대한 메모 또는 인터페이스 목록을 표시합니다.

### 저장
- localStorage에 자동 저장합니다.
- 파일로 열기/저장: `.icanvas.json` 형식. File System Access API를 사용하고, 한 번 연 파일은 Cmd+S로 덮어씁니다. (Chrome 기준이면 충분합니다.)
- 실행 취소/다시 실행 (Cmd+Z / Cmd+Shift+Z)

### 내보내기
- 선택한 노드 또는 전체를 Dart 코드로 내보냅니다 (`abstract interface class`, `implements`/`extends` 관계 반영). 클립보드 복사 지원
- Mermaid `classDiagram` 텍스트로 내보내기
- 캔버스를 PNG로 내보내기 (선택 사항, 쉬우면 포함)

### 기타
- 검색: Cmd+K로 인터페이스 이름 검색 후 해당 노드로 이동
- 라이트/다크 테마 (시스템 설정 따름)
- 첫 실행 시 예시 문서(AuthRepository, AuthRepositoryImpl, LoginUseCase, User 등)를 불러옵니다.

## 범위 밖 (만들지 않음)

- 로그인, 클라우드 동기화, 실시간 협업
- 코드에서 다이어그램을 역으로 생성하는 기능 (이후 단계에서 검토)

## 완료 조건

- `npm install && npm run dev`로 실행되고, 위 MVP 기능이 실제로 동작해야 합니다.
- 시그니처 파서와 Dart/Mermaid 내보내기는 단위 테스트(vitest)를 작성합니다.
- `npm run build`와 타입 체크가 통과해야 합니다.
- README.md에 실행 방법, 단축키, 파일 형식을 정리합니다.
- 기능 단위로 나누어 커밋합니다.
