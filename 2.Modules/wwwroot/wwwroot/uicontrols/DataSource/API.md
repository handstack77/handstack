# DataSource API 참조

`syn.uicontrols.$data`

## 마크업

DataSource는 화면에 표시되지 않는 `<syn_data>` 태그 하나로 선언합니다. `controlLoad` 시점에 `el.style.display = 'none'`이 자동으로 설정됩니다.

```html
<syn_data id="srcForm" syn-options="{
    dataSourceID: 'FormStore',
    storeType: 'Form',
    columns: [
        { data: 'Name', dataType: 'string' },
        { data: 'Age', dataType: 'number' }
    ]
}"></syn_data>
```

- `id` : 페이지 내에서 이 DataSource를 가리키는 컨트롤 id(`elID`). `getValue`/`clear` 등 메서드 호출 시 이 값을 사용합니다.
- `dataSourceID` : 다른 컨트롤이 `bindingID`로 참조할 저장소 이름. `elID`와 다른 문자열이어도 됩니다.
- 값을 주고받을 화면 컨트롤(TextBox, CheckBox, Grid 등) 쪽에는 `syn-datafield="<필드명>"`과 `syn-options="{bindingID: '<dataSourceID>'}"`를 지정해야 자동으로 연결(binding)됩니다.
- 연결은 `syn.uicontrols.$data.bindingSource(elID, dataSourceID)`가 담당하며, `bindingID` 옵션이 있는 컨트롤은 자신의 `controlLoad`에서 이 함수를 자동으로 호출합니다. DataSource를 사용하는 페이지에서 이 함수를 직접 호출할 일은 거의 없습니다.

## Options (defaultSetting)

| 옵션 | 타입/기본값 | 설명 |
| --- | --- | --- |
| `dataSourceID` | string, 기본 `''` | 이 저장소를 가리키는 이름. 다른 컨트롤의 `bindingID`, Grid의 `bindingID` 등에서 참조 |
| `storeType` | string, 기본 `'Form'` | `'Form'`이면 저장소가 객체 1개(단일 레코드), 그 외(`'Grid'` 등)면 배열(레코드 목록)로 초기화됨 |
| `columns` | array, 기본 없음(직접 지정 필요) | `{ data: '필드명', dataType: 'string'\|'number'\|'numeric'\|'int'\|'bool'\|'boolean', belongID: '...' }` 형태의 배열. 필드 목록, `clear()` 시 되돌릴 기본값, Grid/List/Chart 바인딩 시 넘겨줄 메타데이터(`fieldID`, `dataType`)로 사용됨. `defaultSetting`에는 없지만 실제 동작에 필수인 옵션 |
| `dataItems` | array, 기본 `[]` | 예약 옵션(현재 `DataSource.js` 로직에서 직접 사용되지 않음). `columns`를 대신 사용할 것 |
| `dataType` | string, 기본 `'string'` | 컨트롤 자체의 데이터 타입 표기(참고용) |
| `belongID` | string, 기본 `null` | 소속 그룹/화면 식별자 |
| `getter` / `setter` | boolean, 기본 `false` | 페이지 훅(`mod.hook.controlInit`) 연동 여부 |
| `controlText` | string, 기본 `null` | 로케일 처리 대상 표시명(참고용, `setLocale`은 현재 빈 함수로 구현됨) |
| `validators` | array, 기본 `null` | 폼 전송(`transactConfig`) 검증 규칙(참고용) |
| `transactConfig` | object, 기본 `null` | 트랜잭션(서버 전송) 연동 설정. `inputs`/`outputs`에 `{ type: 'Row'\|'List'\|'Form'\|'Grid', dataFieldID: '<dataSourceID>' }` 형태로 지정해 조회/저장 버튼과 연결 |
| `triggerConfig` | object, 기본 `null` | 트리거 옵션 연동 설정(참고용) |

## 메서드

| 메서드 | 매개변수 | 설명 |
| --- | --- | --- |
| `controlLoad(elID, setting)` | 요소 id, 옵션 객체 | 컨트롤 초기화(내부적으로 페이지 로드 시 자동 호출됨). 저장소를 `storeType`에 맞춰 `{}` 또는 `[]`로 만들고 `storeList`에 메타 정보(`dataSourceID`, `storeType`, `columns`)를 등록 |
| `getValue(elID, isAll)` | 요소 id, 전체조회 여부(boolean, 기본 false) | 저장소 값을 반환. `isAll`이 `true`면 저장소 원본을 그대로 반환. `false`(기본)이면 배열(Grid)은 `Flag !== 'R'`인 행만 걸러서 반환하고, 객체(Form)는 값이 객체 타입인 필드만 남기므로 필드 대부분이 문자열/숫자/불린인 일반적인 Form에서는 `isAll: true`로 호출하는 것을 권장 |
| `setValue(elID, value, meta)` | 요소 id, 설정할 값, (Grid/List/Chart용) 메타(참고용, 미사용) | 저장소 값을 일괄 설정. `storeType: 'Form'`이면 `value`의 키 중 `columns`에 선언된 필드만 저장소에 대입하고(미선언 필드는 경고 로그 후 무시), `storeType`이 배열(Grid 등)이면 각 행에 `Flag`가 없을 경우 `'R'`로 채운 뒤 배열을 통째로 대입함. 대상 필드/그리드에 `bindingID`로 연결된 화면 컨트롤이 있으면 `Object.defineProperty`로 걸린 접근자(setter)가 그 컨트롤의 `setValue`를 자동 호출해 화면에도 반영됨(양방향 바인딩). 반대 방향(화면 컨트롤의 `setValue` 직접 호출 → 저장소 반영)도 동일하게 동작함 |
| `clear(elID, isControlLoad)` | 요소 id | `storeType: 'Form'`이면 `columns`에 정의된 각 필드를 `dataType`에 맞는 기본값(`string→''`, `number`/`numeric`/`int→0`, `bool`/`boolean→false`, 그 외`→null`)으로 되돌림. 배열(Grid)이면 `length = 0`으로 비움. 내부 저장소 값만 초기화하며, 이미 바인딩된 화면 컨트롤(TextBox 등)의 표시 값은 자동으로 지워지지 않음(clear 동작 중에는 바인딩 반응이 꺼져 있음) |
| `getMetaStore(elID)` | 요소 id | `storeList`에 등록된 메타 정보(`dataSourceID`, `storeType`, `columns`) 조회 |
| `bindingSource(elID, dataSourceID)` | 필드 컨트롤 id, dataSourceID | 필드 컨트롤(`syn-datafield` 지정)과 DataSource를 연결하고 `Object.defineProperty`로 getter/setter를 등록. `bindingID` 옵션이 있는 컨트롤이 자신의 `controlLoad`에서 자동 호출함 |
| `reactionGetValue` / `reactionSetValue` | (내부용) | 바인딩된 필드에 접근(get/set)할 때 실제로 연결된 컨트롤의 `getValue`/`setValue`를 호출해 주는 내부 구현. 직접 호출할 필요 없음 |
| `setLocale(elID, translations, control, options)` | - | 현재 빈 함수로 구현되어 있어 동작 없음 |

## 이벤트 (syn-events)

DataSource는 화면에 표시되지 않는 저장 노드이므로 `syn-events`로 연결할 DOM 이벤트가 없습니다. 값 변화에 반응하려면 값을 실제로 입력/변경하는 화면 컨트롤(TextBox, Grid 등) 쪽에 `syn-events`를 지정하세요.

## 참고

- Flag(R/C/U/D) 변경 추적 컨벤션: Grid처럼 `storeType`이 배열인 저장소는 각 행에 `Flag` 필드를 가집니다.
  - `R` (Read) : 조회 결과 그대로인 원본 행. `getValue(elID)`(기본, `isAll` 생략)를 호출하면 이 행들은 결과에서 제외됩니다.
  - `C` (Create) : 화면에서 새로 추가한 행(Grid의 `insertRow` 등으로 생성).
  - `U` (Update) : 원본(`R`) 행의 값을 수정하면 `R`에서 `U`로 바뀝니다.
  - `D` (Delete) : 원본/수정된 행을 삭제 표시한 경우. 실제로 배열에서 즉시 제거되지 않고 `Flag`만 `D`로 바뀌는 경우가 많아, 서버 저장 트랜잭션에서 `D` 행을 삭제 대상으로 판단합니다.
  - `Flag` 값 관리 자체는 Grid 계열 컨트롤(예: `syn.uicontrols.$grid`)이 담당하며, DataSource는 `getValue(elID)` 호출 시 `Flag !== 'R'` 조건으로 걸러주는 역할만 합니다.
- `columns`는 `defaultSetting`에 명시되어 있지 않지만 `controlLoad`, `clear`, Grid/List 바인딩 메타 변환(`reactionGetValue`/`reactionSetValue`)에서 실제로 사용되므로 반드시 지정해야 합니다.
- 실무에서 가장 흔한 두 가지 사용 패턴(`bindingID`로 화면 컨트롤과 연결하는 방식보다 더 자주 보입니다):
  1. **트랜잭션 오류(Exception) 저장소** — `storeType: 'Form'`, 화면 바인딩 없이 저장 트랜잭션의 `outputs`(`{ type: 'Form', dataFieldID: 'Exception' }`)로만 채워지고, `afterTransaction` 콜백에서 `$this.store.Exception.Error`/`Message`를 확인한 뒤 `syn.uicontrols.$data.clear('srcException')`으로 비웁니다(`exception.html` 예제).
  2. **그리드 컨트롤 없는 업무 배열 저장소** — 전자결재 결재선, 첨부파일 목록처럼 화면에는 카드/목록으로 직접 렌더링하고, `$this.store.<dataSourceID>` 배열을 그리드 없이 `push`/`splice`/`filter`로 직접 다룹니다(`worklist.html` 예제).
- 예제는 [example](./example) 폴더, 사용 개요는 [README.md](./README.md)를 참고하세요.
