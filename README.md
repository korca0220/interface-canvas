# Interface Canvas

인터페이스(abstract class, Repository, UseCase 등)를 코드 작성 전에 설계하는 개인용 로컬 도구입니다.
UML 클래스 다이어그램처럼 무한 캔버스에 배치하고, 오른쪽 패널에서 시그니처와 마크다운 메모를 편집하고,
Dart 코드나 Mermaid로 내보냅니다. 요구사항은 [SPEC.md](./SPEC.md)에 있습니다.

## 실행

```bash
npm install
npm run dev        # http://localhost:5173
```

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run build` | 타입 체크(`tsc -b`) + 프로덕션 빌드 |
| `npm run typecheck` | 타입 체크만 |
| `npm test` | 단위 테스트 (vitest) |

Chrome 기준입니다. 파일 덮어쓰기 저장(File System Access API)은 Chromium 계열에서만 됩니다.
다른 브라우저에서는 열기는 파일 선택, 저장은 다운로드로 대체됩니다.

## 사용법

- **노드 만들기**: 캔버스 빈 곳 더블클릭, 툴바 `+ 인터페이스`, 또는 `N`
- **관계 만들기**: 노드에 마우스를 올리면 네 변에 핸들이 보입니다. 핸들을 끌어서 다른 노드 아무 곳에나 놓으면 됩니다.
  만들어진 관계가 바로 선택되고, 패널이나 `1`–`5` 키로 종류를 바꿀 수 있습니다.
  기본 종류는 이름으로 추정합니다(`FooImpl` → `Foo`(interface)는 implements, model/enum 대상은 uses, 나머지는 depends).
- **필드·메서드 편집**: 패널의 textarea에 한 줄에 하나씩 Dart 문법으로 입력합니다.
  모든 줄이 파싱되면 바로 반영되고, 틀린 줄이 있으면 몇 번째 줄이 왜 틀렸는지 보여주고 반영하지 않습니다.
  ```
  String? nickname
  final List<User> users
  bool get isLoggedIn
  Future<User> login(String id, {required String password})
  List<Item> page(int index, [int size = 20])
  T read<T>(String key)
  void save() async          → Future<void> save() 로 정리됨
  ```
- **메모**: 마크다운(GFM: 표, 체크리스트 등). `편집`/`미리보기` 토글, 미리보기에서 더블클릭하면 편집으로 돌아갑니다.
- **아무것도 선택하지 않으면** 패널에 문서 이름, 문서 메모, 인터페이스 목록이 나옵니다(클릭하면 해당 노드로 이동).
- **줌 단계(LOD)**: 줌 55% 이상은 전체, 30–55%는 멤버 이름만, 30% 미만은 노드 이름만 보입니다.

### 관계 표기

| 종류 | 선 | 화살촉 | Dart 반영 | Mermaid |
| --- | --- | --- | --- | --- |
| implements | 점선 | 빈 삼각형 | `implements` 절 | `..\|>` |
| extends | 실선 | 빈 삼각형 | `extends` 절 | `--\|>` |
| depends | 점선 | 열린 화살표 | class면 생성자 주입 필드 | `..>` |
| uses | 실선 | 열린 화살표 | 없음 | `-->` |
| creates | 점선 + «create» | 열린 화살표 | 없음 | `..> : «create»` |

## 단축키

macOS 기준입니다(Windows/Linux는 ⌘ 대신 Ctrl).

| 단축키 | 동작 |
| --- | --- |
| ⌘Z / ⇧⌘Z (⌘Y) | 실행 취소 / 다시 실행 |
| ⌘S | 저장 (연 파일이 있으면 덮어쓰기, 없으면 다른 이름으로 저장) |
| ⇧⌘S | 다른 이름으로 저장 |
| ⌘O | 파일 열기 |
| ⌘K | 인터페이스 검색 → Enter로 이동 |
| ⌘E | 내보내기 (선택이 있으면 선택한 노드만) |
| ⌘A | 모든 노드 선택 |
| ⌘D | 선택한 노드 복제 (선택 노드 사이의 관계 포함) |
| ⌘\ | 오른쪽 패널 토글 |
| ⇧⌘P | 메모 편집/미리보기 전환 |
| N | 새 인터페이스 (화면 중앙) |
| F | 전체 보기 |
| Delete / Backspace | 선택 항목 삭제 |
| 1–5 | 선택한 관계의 종류 변경 (implements, extends, depends, uses, creates) |
| Esc | 선택 해제 / 입력창에서 빠져나오기 |
| Shift + 드래그 | 범위 선택 |
| ⌘ 또는 Shift + 클릭 | 다중 선택 |

입력창(textarea 등)에 포커스가 있을 때 ⌘Z, ⌘A, Delete 같은 키는 브라우저 기본 텍스트 편집 동작을 따릅니다.
⌘S, ⌘O, ⌘K, ⌘E는 입력 중에도 동작합니다.

## 저장

- **자동 저장**: 문서가 바뀔 때마다 localStorage(`interface-canvas:doc`)에 저장됩니다. 다시 열면 마지막 상태가 복원됩니다.
  저장된 데이터가 깨져 있으면 원본을 `interface-canvas:doc:corrupt:<시각>` 키에 백업하고 예시 문서를 엽니다.
- **파일**: `파일` 메뉴 또는 ⌘O/⌘S로 `.icanvas.json`을 열고 저장합니다. 연 파일의 핸들은 IndexedDB에 보관하므로
  새로고침 후에도 ⌘S가 같은 파일을 덮어씁니다(새로고침 후 첫 저장 때 Chrome이 쓰기 권한을 다시 물어봅니다).
- 툴바의 파일 이름 옆 `•`는 마지막 파일 저장 이후 바뀐 내용이 있다는 뜻입니다.
- 실행 취소 기록은 메모리에만 있습니다(최대 200단계, 새로고침하면 사라짐). 같은 입력란에서 1초 안에 이어진 타이핑과
  드래그 한 번은 각각 한 단계로 묶입니다.

## 파일 형식 (`.icanvas.json`)

UTF-8 JSON입니다. 앱의 문서 모델을 그대로 직렬화합니다.

```jsonc
{
  "version": 1,
  "name": "Auth 예시",
  "memo": "# 문서 메모 (마크다운, 선택)",
  "interfaces": [
    {
      "id": "n_authrepo",
      "name": "AuthRepository",
      "kind": "interface",              // interface | abstract | class | enum | model
      "fields": [
        { "name": "currentUser", "type": "User", "nullable": true }
      ],
      "methods": [
        {
          "name": "login",
          "params": [
            { "name": "id", "type": "String", "required": true },
            { "name": "password", "type": "String", "named": true, "required": true },
            { "name": "remember", "type": "bool", "named": true, "required": false, "defaultValue": "false" }
          ],
          "returns": "Future<User>",
          "isAsync": true
        }
      ],
      "memo": "마크다운 메모",
      "color": "#6366f1",
      "position": { "x": 0, "y": 0 }
    }
  ],
  "relations": [
    { "id": "r_impl", "from": "n_authrepoimpl", "to": "n_authrepo", "type": "implements", "label": "선택" }
  ]
}
```

- `fields[].type`에는 `?`를 넣지 않고 `nullable`로 표시합니다. 매개변수와 반환 타입은 `?`를 타입 문자열에 그대로 둡니다.
- 매개변수: 위치 필수 = `required: true`, 선택 위치(`[...]`) = `required: false`, 이름 있는(`{...}`) = `named: true` + `required`.
- enum의 값은 `fields`에 `type: ""`로 저장합니다.
- 읽을 때 검증합니다. `version`이 1이 아니거나 배열이 없으면 거부하고, 빠진 값은 기본값으로 채우며,
  없는 노드를 가리키는 관계와 중복 id는 버립니다.

## 내보내기

- **Dart** (⌘E 또는 노드 패널의 `Dart 코드 복사`)
  - `interface` → `abstract interface class` (필드는 추상 getter), `abstract` → `abstract class`
  - `class` → 구현체. `depends` 관계는 `final AuthApi _authApi;` + 생성자 주입이 되고, implements/extends 대상의
    멤버와 이름이 같으면 `@override`, 구현해야 하는데 빠진 멤버는 `@override ... => throw UnimplementedError();` 스텁으로 채웁니다.
  - `model` → `final` 필드 + `const` 생성자(nullable이 아니면 `required`)
  - `enum` → 값 목록
  - 메모는 `///` 문서 주석이 됩니다. 예시 문서의 결과물은 `dart analyze`에서 에러 없이 통과합니다(경고는 스텁의 미사용 필드뿐).
- **Mermaid**: `classDiagram` 텍스트. 제네릭은 `~`로 바꾸고, 매개변수는 `{}` 없이 `타입 이름` 목록으로 표기합니다.
- **PNG**: `내보내기 → PNG 이미지`. 줌/팬 상태와 관계없이 모든 노드를 2배 해상도로 저장합니다.

## 구조

```
src/
  model/      문서 모델(원본): types, 검증/정규화(doc), zustand 스토어 + 히스토리(store), 시그니처 파서(signature), 예시
  canvas/     React Flow 화면: 모델에서 노드/엣지를 파생, UML 노드, 플로팅 엣지, LOD
  panel/      오른쪽 패널: 노드/관계/다중 선택/문서 개요, 멤버 편집기, 마크다운 편집기
  export/     Dart, Mermaid, PNG 변환 + 내보내기 다이얼로그
  io/         localStorage 자동 저장, 파일 열기/저장, 파일 핸들 보관(IndexedDB)
  ui/         툴바, 메뉴, 검색, 단축키, 토스트, 화면 상태(uiStore)
```

## 설계 결정

SPEC의 원칙("화면보다 데이터 모델이 먼저")에 따라 판단한 것들입니다.

1. **모델이 유일한 원본.** React Flow의 노드/엣지는 매 렌더마다 `doc`에서 파생합니다. React Flow가 주는 변경
   (위치, 선택, 삭제, 연결)은 스토어 액션으로 바꿔 모델에 반영합니다. 노드 측정 크기처럼 화면에만 필요한 값은 캔버스
   로컬 상태에 두고 모델에 넣지 않습니다. 선택 상태도 문서가 아닌 스토어의 별도 필드라서 저장/히스토리 대상이 아닙니다.
2. **SPEC 타입에 선택 필드 두 개를 추가했습니다.** 모두 optional이라 SPEC 형식의 파일도 그대로 읽힙니다.
   - `Doc.memo`: 아무것도 선택하지 않았을 때 보여줄 "문서 전체 메모"를 저장할 곳이 SPEC 모델에 없어서 추가했습니다.
   - `Param.defaultValue`: `[int size = 20]`, `{bool force = false}`처럼 입력한 기본값을 파싱 후 버리면 왕복할 때
     정보가 사라져서 추가했습니다. 필드 기본값(`= ...`)은 모델에 넣을 곳이 없어 버립니다.
3. **`isAsync`는 반환 타입에서 파생합니다.** `async` 키워드는 반환 타입으로 흡수합니다(`User load() async` → `Future<User> load()`).
   반환 타입이 `Future`/`FutureOr`/`Stream`이면 `isAsync: true`입니다. 추상 멤버에는 `async`를 쓸 수 없고, 스텁 본문은
   `=> throw UnimplementedError();`라서 내보낼 때 `async`가 필요 없습니다.
4. **관계 연결 지점을 모델에 저장하지 않습니다.** 엣지는 두 노드 중심을 잇는 직선이 각 노드 테두리와 만나는 점에 그립니다
   (플로팅 엣지). 그래서 `Relation`에 핸들 정보가 필요 없고, 노드를 옮겨도 선이 자연스럽게 따라갑니다. 같은 두 노드 사이의
   관계가 여러 개면 평행하게 벌려 그립니다.
5. **편집 중 파싱 실패 시 반영 보류.** 한 줄이라도 틀리면 모델을 바꾸지 않습니다. 반쯤 친 텍스트가 모델을 깨거나
   다른 멤버를 지우지 않게 하기 위해서입니다. 포커스를 잃어도 틀린 초안은 남겨 두고 에러를 계속 보여줍니다.
6. **히스토리는 문서 스냅샷 스택**입니다. 불변 업데이트라 스냅샷 비용이 작고, 구현이 단순해서 버그 여지가 적습니다.
   드래그는 시작 시점 문서를 기억했다가 끝날 때 한 칸으로 기록하고, 텍스트 입력은 같은 입력란에서 1초 안에 이어지면 합칩니다.
7. **입력창 안의 ⌘Z는 브라우저에 맡깁니다.** 입력 중에는 글자 단위 undo가 자연스럽고, 입력창 밖에서 ⌘Z를 누르면
   문서 단위 undo가 됩니다.
8. **Dart 내보내기의 class 스캐폴딩**(depends → 생성자 주입, 빠진 멤버 스텁)은 SPEC에 명시되지 않은 추가 기능입니다.
   implements만 반영하면 결과물이 컴파일되지 않아서, 바로 붙여 넣을 수 있는 코드를 목표로 넣었습니다.
   uses/creates는 코드 구조에 드러나지 않는 관계라 Dart에는 반영하지 않습니다.
9. **테마**: 기본은 시스템 설정을 따르고, 툴바 버튼으로 라이트/다크를 고정할 수도 있습니다(설정은 localStorage에 기억).
10. **마크다운 편집기는 textarea**를 썼습니다(SPEC의 "가벼운 쪽"). 미리보기(react-markdown + remark-gfm)는 처음 켤 때 따로 불러옵니다.

## 알려진 한계

- 실행 취소 기록은 새로고침하면 사라집니다.
- 노드 복사/붙여넣기(클립보드)는 없습니다. 같은 문서 안에서 복제(⌘D)만 됩니다.
- 자동 레이아웃, 스냅/정렬 가이드가 없습니다.
- 클래스 수준 제네릭(`Repository<T>`)은 이름에 직접 쓰면 Dart 선언부에는 반영되지만, 관계 대상으로 쓸 때 타입 인자는 지정할 수 없습니다.
- 시그니처 파서는 Dart 문법 전체가 아니라 인터페이스 설계에 필요한 부분(제네릭, nullable, 함수/레코드 타입,
  위치/선택/이름 있는 매개변수, 기본값, getter, `async`)만 다룹니다. 어노테이션(`@override` 외), `this.`/`super.` 매개변수,
  `operator`, setter, 생성자는 지원하지 않습니다.
- Mermaid는 `Map<K, V>`처럼 쉼표가 있는 제네릭을 공식 지원하지 않아서 렌더러에 따라 보이는 모양이 다를 수 있습니다.
- File System Access API는 Chromium 계열에서만 됩니다. 다른 브라우저는 다운로드로 저장합니다.
- 여러 탭에서 동시에 열면 localStorage 자동 저장은 마지막에 저장한 탭 내용으로 덮어씁니다.
