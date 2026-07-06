# TreeView (syn.uicontrols.$tree)

## 이 컨트롤은 무엇인가요?

TreeView는 부모-자식 관계를 가진 계층형(트리) 데이터를 화면에 펼쳐 보여주는 컨트롤입니다.
내부적으로는 [FancyTree](https://github.com/mar10/fancytree) 라이브러리를 감싸서 `syn.uicontrols.$tree` 싱글턴 객체로 제공합니다.

조직도, 메뉴 트리, 폴더 구조처럼 "상위 항목 아래 하위 항목이 계속 붙는" 형태의 데이터를 다룰 때 사용합니다. 평평한(flat) 배열 데이터를 넣으면 컨트롤이 알아서 `parentID` 기준으로 계층 구조를 만들어 그려주고, 반대로 화면에 그려진 트리를 다시 평평한 배열로 꺼내올 수도 있습니다.

## 언제 사용하나요?

- 조직도/부서 목록, 메뉴/프로그램 목록처럼 계층 구조를 가진 데이터를 트리 형태로 보여줘야 할 때
- 트리 노드를 검색어로 필터링하거나(`filter` 확장), 체크박스로 다중 선택해서 값을 가져와야 할 때
- 노드를 우클릭했을 때 "추가/이름변경/삭제" 같은 메뉴를 띄워야 할 때 — 이 경우 TreeView 단독으로는 우클릭 메뉴를 그리지 못하므로, [ContextMenu](../ContextMenu/README.md) 컨트롤과 함께 사용합니다. `target`에 트리 컨테이너 셀렉터(`#트리ID`)를, `delegate`에 노드 타이틀 셀렉터(`span.fancytree-title`)를 지정하는 방식입니다.

## 빠른 시작

```html
<syn_tree id="tvlTreeView" syn-options="{
    itemID: 'key',
    parentItemID: 'parentID',
    childrenID: 'children',
    reduceMap: { key: 'ProgramID', title: 'ProgramName', parentID: 'ParentID', folder: 'FolderYN', icon: false }
}" syn-events="['click', 'dblclick']"></syn_tree>
```

```js
'use strict';
let $samplePage = {
    event: {
        tvlTreeView_dblclick(evt, data) {
            // data.node.data 에 원본 행 데이터가 그대로 들어 있습니다.
            syn.$l.eventLog('tvlTreeView_dblclick', data.node.data.ProgramName);
        }
    }
}
```

값을 채워 넣을 때는 `setValue`에 평평한(flat) 배열을 그대로 넘기면 됩니다. 각 항목은 `reduceMap`에 지정한 컬럼명(`ProgramID`, `ProgramName`, `ParentID`, `FolderYN`)을 가지고 있어야 합니다.

```js
syn.uicontrols.$tree.setValue('tvlTreeView', [
    { ProgramID: 'ROOT', ProgramName: '전체', ParentID: null, FolderYN: 'Y' },
    { ProgramID: 'A01', ProgramName: '인사팀', ParentID: 'ROOT', FolderYN: 'Y' },
    { ProgramID: 'A0101', ProgramName: '홍길동', ParentID: 'A01', FolderYN: 'N' }
]);
```

핵심 포인트:
- 마크업은 `<syn_tree>` 커스텀 태그로 작성하고, `syn-options`에 `itemID`/`parentItemID`/`childrenID`/`reduceMap` 등을 JSON으로 넣습니다.
- 페이지에 `<script src="/js/syn.loader.js"></script>` 한 줄만 있으면 FancyTree를 포함한 나머지 CSS/JS는 자동으로 로드됩니다. 별도의 `pageLoadFiles` 설정이 필요 없습니다.
- `getValue`/`setValue`는 항상 "평평한 배열"을 주고받습니다. 트리 안에서만 계층(중첩) 구조로 다뤄지고, 컨트롤 밖으로 나올 때는 평평한 형태로 변환됩니다.
- `checkbox: true`로 설정하면 체크박스를 통한 다중 선택이 가능해집니다.

## 예제 실행하기

`example/` 폴더의 각 HTML 파일을 handstack의 wwwroot 정적 서버(예: rdy 프로젝트) 경로 아래에 두고 브라우저로 열면 바로 동작을 확인할 수 있습니다.

- `basic.html` : 기본 트리 표시 + `getValue`/`setValue`/`clear`/`getControl` 기능 확인
- `checkbox.html` : `checkbox: true`로 다중 선택하고 선택된 노드 목록을 가져오는 예제
- `contextmenu.html` : [ContextMenu](../ContextMenu/README.md)와 결합해서 노드 우클릭 메뉴를 띄우는 예제
- `filter.html` : `filter` 확장으로 입력한 텍스트에 맞는 노드만 찾아 보여주는 예제

각 예제는 화면 하단 로그 영역(`syn.$l.eventLog` 출력)에서 이벤트 발생 순서와 전달값을 확인할 수 있습니다.

## 더 알아보기

- API 상세는 같은 폴더의 `API.md`를 참고하세요.
- 실제 소스: `wwwroot/uicontrols/TreeView/TreeView.js`, `TreeView.css`
- 기존 샘플: `wwwroot/sample/uicontrol/treeview.html`
- 실사용 예: qcn.groupware `modules/easywork/wwwroot/easywork/view/HDS/EWP/ATM020.html` (`tplDepartment` 다이얼로그의 소속조직 트리) — 검색창(`txtTreeNodeFilter`)으로 필터링하고, 더블클릭으로 노드를 선택하는 실제 화면 흐름을 참고할 수 있습니다.
- ContextMenu와 함께 쓰는 방법: `../ContextMenu/README.md`, `../ContextMenu/API.md`
- FancyTree 원본 문서: https://github.com/mar10/fancytree/wiki
