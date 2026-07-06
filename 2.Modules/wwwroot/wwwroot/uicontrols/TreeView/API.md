# TreeView API 참조

싱글턴 객체: `syn.uicontrols.$tree`
소스 파일: `wwwroot/uicontrols/TreeView/TreeView.js`, `wwwroot/uicontrols/TreeView/TreeView.css`
내부 라이브러리: [FancyTree](https://github.com/mar10/fancytree/wiki) (jQuery 플러그인)

## 마크업

```html
<syn_tree id="tvlTreeView" syn-options="{
    checkbox: false,
    itemID: 'key',
    parentItemID: 'parentID',
    childrenID: 'children',
    reduceMap: { key: 'ProgramID', title: 'ProgramName', parentID: 'ParentID', folder: 'FolderYN', icon: false },
    height: '334px',
    extensions: ['filter']
}" syn-events="['dblclick', 'select']"></syn_tree>
```

- `id`는 페이지 내에서 유일해야 하며, `syn.uicontrols.$tree`의 각종 메서드에서 이 `id`(elID)를 사용합니다.
- `controlLoad` 실행 시 원래 태그는 `{elID}_hidden`으로 이름이 바뀌며 `display:none` 처리되고, 같은 위치에 실제 FancyTree가 그려질 `<div id="{elID}">`를 감싼 래퍼(`div.tree-container`)가 새로 추가됩니다.
- `width`/`height`는 마크업 요소의 인라인 `style.width`/`style.height`가 지정되어 있으면 그 값이 `syn-options`보다 우선합니다.

## Options (defaultSetting)

| 속성 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `width` | string | `'100%'` | 트리 컨테이너 너비 |
| `height` | string | `'300px'` | 트리 컨테이너 높이(넘치면 스크롤) |
| `itemID` | string | `'id'` | 평평한(flat) 데이터에서 각 행의 고유 키가 되는 컬럼명. `getValue`/`setValue`가 트리 ↔ flat 배열 변환 시 사용합니다. |
| `parentItemID` | string | `'parentID'` | flat 데이터에서 부모 키 컬럼명 |
| `childrenID` | string | `'children'` | 중첩(nested) 구조로 변환할 때 자식 배열을 담을 속성명 |
| `reduceMap` | object | 아래 "reduceMap" 참고 | 트리 내부 필드(`key`/`title`/`parentID`/`folder`/`icon`)와 실제 데이터 컬럼명을 매핑 |
| `toggleEffect` | boolean | `false` | 노드 확장/축소 시 애니메이션 효과 여부 (FancyTree `toggleEffect` 옵션) |
| `checkbox` | boolean | `false` | 노드마다 체크박스를 표시할지 여부. `true`로 하면 체크박스 클릭으로 다중 선택이 가능해집니다. |
| `extensions` | array | `['persist', 'filter']` | 사용할 FancyTree 확장 목록. ([확장 전체 목록](https://github.com/mar10/fancytree/wiki/ExtensionIndex)) |
| `persist` | object \| false | 아래 "persist" 참고 | 세션 저장(확장/포커스/선택 상태 유지) 확장 옵션. 주의: `controlLoad`가 실행될 때 내부에서 무조건 `false`로 재설정되므로, `syn-options`에서 직접 `persist: {...}` 객체를 명시해야만 실제로 동작합니다. 기본값만 믿고 켜두면 동작하지 않습니다. |
| `multi` | object \| false | `{ mode: 'sameParent' }` | 다중 선택 확장 옵션. `persist`와 동일한 이유로 `controlLoad` 시점에 무조건 `false`로 재설정됩니다. 다중 선택을 쓰려면 `extensions`에 `'multi'`를 추가하고 `syn-options`에서 `multi: {...}` 를 직접 지정하세요. |
| `filter` | object | 아래 "filter" 참고 | 필터 확장(`extensions`에 `'filter'`가 있을 때) 옵션 |
| `source` | array | `[]` | FancyTree 초기 데이터. 보통 직접 지정하지 않고 `setValue`가 내부적으로 채웁니다. |
| `dataType` | string | `'string'` | 다른 컨트롤과 형식을 맞추기 위한 공통 속성 |
| `belongID` / `getter` / `setter` / `controlText` / `validators` / `transactConfig` / `triggerConfig` | - | `null`/`false` | syn.uicontrols 공통 옵션(값 바인딩·유효성검사·트랜잭션 연동용) |

### reduceMap

`getValue`/`setValue`가 트리 노드(`key`/`title`/`parentID`/`folder`/`icon`)와 원본 데이터 컬럼을 서로 바꿔치기할 때 쓰는 매핑 테이블입니다.

| 속성 | 기본값 | 설명 |
|---|---|---|
| `key` | `'key'` | 노드 고유 키에 대응하는 실제 데이터 컬럼명 |
| `title` | `'title'` | 노드에 표시할 텍스트에 대응하는 컬럼명 |
| `parentID` | `'parentID'` | 부모 노드 키에 대응하는 컬럼명 |
| `folder` | `'folder'` | 폴더(하위 노드를 가질 수 있는 노드) 여부 컬럼명. 값은 `$string.toBoolean()`으로 boolean 변환됩니다. |
| `icon` | `false` | 노드 아이콘. `false`면 아이콘을 표시하지 않습니다. |

### persist

| 속성 | 기본값 | 설명 |
|---|---|---|
| `expandLazy` | `false` | 지연 로딩(lazy) 노드까지 확장 상태를 복원할지 여부 |
| `expandOpts.noAnimation` | `false` | 복원 시 애니메이션 생략 여부 |
| `expandOpts.noEvents` | `false` | 복원 시 이벤트 발생 생략 여부 |
| `overrideSource` | `true` | 저장된 상태로 `source`를 덮어쓸지 여부 |
| `store` | `'session'` | 저장소 종류(`'session'` = sessionStorage, `'local'` = localStorage) |
| `types` | `'active expanded focus selected'` | 저장할 상태 종류(공백 구분 문자열) |

### multi

| 속성 | 기본값 | 설명 |
|---|---|---|
| `mode` | `'sameParent'` | 다중 선택 시 같은 부모를 가진 노드끼리만 선택 가능하도록 제한 |

### filter

| 속성 | 기본값 | 설명 |
|---|---|---|
| `counter` | `false` | 필터링된 자식 노드 개수를 배지로 표시할지 여부 |
| `mode` | `'hide'` | 필터에 걸리지 않는 노드 처리 방식(`'hide'` = 숨김, `'dimm'` = 흐리게 표시) |

## 메서드

`syn.uicontrols.$tree.<메서드명>(...)` 형태로 호출합니다.

| 메서드 | 설명 |
|---|---|
| `getControl(elID)` | 등록된 컨트롤 정보(`{ id, element, tree, config }`)를 반환. `tree`가 실제 FancyTree 인스턴스입니다. |
| `getValue(elID, meta)` | 트리 전체를 `reduceMap` 기준의 평평한(flat) 배열로 변환해서 반환합니다. |
| `setValue(elID, value, meta)` | `reduceMap` 컬럼명을 가진 평평한(flat) 배열을 받아 중첩 구조로 변환한 뒤 트리를 다시 그립니다(`tree.reload`). |
| `clear(elID, isControlLoad)` | 트리 내용을 비웁니다(빈 배열로 `reload`). |
| `getActiveNode(elID)` | 현재 활성(activate)된 노드를 반환합니다. |
| `toogleEnabled(elID)` | 트리 활성/비활성 상태를 토글하고, 토글 후 활성화 여부(boolean)를 반환합니다. (메서드명 오타이지만 실제 API명이 `toogleEnabled`입니다) |
| `getRootNodeID(elID)` | 루트 노드의 키를 반환합니다(내부적으로 FancyTree가 붙이는 `'root_'` 접두어는 제거해서 반환). |
| `activateKey(elID, key)` | 지정한 `key`를 가진 노드를 활성화(선택 포커스 이동)합니다. |
| `expendLevel(elID, level)` | 지정한 깊이(`level`, 기본 1)보다 얕은 노드까지 모두 펼칩니다. (메서드명 오타이지만 실제 API명이 `expendLevel`입니다) |
| `collapseLevel(elID, level)` | 지정한 깊이(`level`, 기본 1)보다 얕은 노드까지 모두 접습니다. |
| `expandAll(elID)` | 모든 노드를 펼칩니다. |
| `collapseAll(elID)` | 모든 노드를 접습니다. |
| `getSelectedNodes(elID)` | (체크박스/다중 선택 시) 선택된 노드 배열을 반환합니다. |
| `filterNodes(elID, filter)` | 텍스트(또는 필터 함수)와 일치하는 노드만 남기고 나머지는 `filter.mode`에 따라 숨기거나 흐리게 표시합니다. 일치 노드까지 자동으로 펼칩니다(`autoExpand: true`). `extensions`에 `'filter'`가 있어야 동작합니다. |
| `filterBranches(elID, filter)` | `filterNodes`와 유사하지만, 일치하는 노드가 속한 가지(branch) 전체를 남깁니다(`leavesOnly: true`). |
| `clearFilter(elID)` | 적용된 필터를 해제합니다. |
| `setNodeSelectedAll(elID, node)` | 주어진 `node`의 현재 선택 상태를 그 하위 노드 전체에 그대로 적용합니다. |
| `selectedAll(elID, isSelected)` | 트리의 모든 노드를 한 번에 선택(`true`)/선택 해제(`false`)합니다. |
| `setLocale(elID, translations, control, options)` | 다국어 텍스트 적용 훅(TreeView는 별도 구현 없음, 빈 함수) |

> `controlLoad(elID, setting)`은 컨트롤이 마크업을 실제 FancyTree로 초기화하는 내부 진입점으로, 프레임워크가 자동으로 호출합니다. 직접 호출할 일은 거의 없습니다.

## 이벤트 (syn-events)

`syn-events` 배열에 이름을 넣으면 페이지 스크립트의 `event` 객체에서 `{elID}_{이벤트명}` 함수를 자동으로 연결해 줍니다. (핸들러 함수 시그니처는 FancyTree 콜백 그대로 `(evt, data)`이며, 대부분의 경우 `data.node`로 대상 노드에 접근합니다.)

중요: 아래 `eventHooks` 목록에 있는 이름만 실제로 동작합니다. 목록에 없는 이름(예: `'select'`)을 `syn-events`에 적어도 에러는 나지 않지만 아무 핸들러도 연결되지 않습니다. 체크박스로 선택 상태가 바뀌는 것을 감지하려면 `select`가 아니라 `click`(체크박스 클릭 시) 이벤트에서 `data.node.isSelected()`를 직접 확인하는 방식을 사용하세요.

| 이벤트명 | 발생 시점 |
|---|---|
| `blurTree` | 트리 전체가 포커스를 잃을 때 |
| `focusTree` | 트리 전체가 포커스를 얻을 때 |
| `activate` | 노드가 활성화(선택)되었을 때 |
| `beforeActivate` | 노드가 활성화되기 직전(취소 가능) |
| `beforeExpand` | 노드가 펼쳐지기 직전(취소 가능) |
| `beforeSelect` | 노드의 체크박스 선택 상태가 바뀌기 직전(취소 가능) |
| `blur` | 개별 노드가 포커스를 잃을 때 |
| `click` | 노드를 클릭했을 때 |
| `collapse` | 노드가 접힐 때 |
| `createNode` | 노드 DOM 요소가 생성되었을 때(노드별 커스텀 렌더링에 활용) |
| `dblclick` | 노드를 더블클릭했을 때 |
| `expand` | 노드가 펼쳐질 때 |
| `focus` | 개별 노드가 포커스를 얻을 때 |
| `keydown` | 트리에 포커스가 있는 상태에서 키를 눌렀을 때 |
| `keypress` | 트리에 포커스가 있는 상태에서 키를 입력했을 때 |

핸들러 등록 예:

```js
let $samplePage = {
    event: {
        tvlTreeView_click(evt, data) {
            syn.$l.eventLog('tvlTreeView_click', data.node.title);
        },
        tvlTreeView_dblclick(evt, data) {
            syn.$l.eventLog('tvlTreeView_dblclick', data.node.data);
        },
        tvlTreeView_activate(evt, data) {
            syn.$l.eventLog('tvlTreeView_activate', data.node.key);
        }
    }
}
```

## 참고

- 내부적으로 jQuery의 `.fancytree(setting)` 호출을 그대로 감싼 구조이므로, 옵션/콜백의 더 자세한 원본 설명은 FancyTree 문서를 참고하세요: https://github.com/mar10/fancytree/wiki
- 노드를 우클릭했을 때 메뉴를 띄우려면 TreeView 자체가 아니라 [ContextMenu](../ContextMenu/API.md)를 함께 사용합니다. `target`에 트리 컨테이너 셀렉터(`#트리ID`)를, `delegate`에 `'span.fancytree-title'`을 지정하면 노드 타이틀을 우클릭했을 때 메뉴가 뜹니다.

  ```html
  <syn_tree id="tvlTreeView" syn-options="{...}" syn-events="['click']"></syn_tree>
  <syn_contextmenu id="ctxTreeItem" syn-options="{
      target: '#tvlTreeView', delegate: 'span.fancytree-title', menu: [...]
  }" syn-events="['beforeOpen', 'select']"></syn_contextmenu>
  ```

  이때 `ctxTreeItem_beforeOpen(evt, ui)`에서 `$.ui.fancytree.getNode(ui.target)`(또는 `syn.uicontrols.$tree.getControl(elID).tree.getActiveNode()`)로 우클릭된 노드를 얻어 메뉴 항목을 동적으로 켜고 끌 수 있습니다.
- `getValue`/`setValue`는 항상 flat 배열 기준입니다. 트리 내부 계층 변환은 `syn.$l.flat2Nested` / `syn.$l.nested2Flat` 유틸리티가 담당합니다.
- 체크박스 다중 선택 결과를 가져오려면 `getSelectedNodes(elID)`를 사용하세요(전체 트리 데이터를 가져오는 `getValue`와는 다릅니다).
