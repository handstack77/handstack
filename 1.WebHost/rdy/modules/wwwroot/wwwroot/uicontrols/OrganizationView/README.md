# OrganizationView (syn.uicontrols.$organization)

## 이 컨트롤은 무엇인가요?

OrganizationView는 부모-자식 관계를 가진 계층형 데이터를 박스와 연결선으로 이루어진 "조직도(org chart)" 형태로 그려주는 컨트롤입니다. 내부적으로는 [dabeng/OrgChart](https://github.com/dabeng/OrgChart) jQuery 플러그인을 감싸서 `syn.uicontrols.$organization` 싱글턴 객체로 제공합니다.

[TreeView](../TreeView/README.md)도 같은 "계층형 데이터"를 다루지만 둘의 쓰임새는 다릅니다.

| | TreeView | OrganizationView |
|---|---|---|
| 표현 방식 | 들여쓰기된 목록(리스트)을 펼치고 접는 형태 | 상자(노드)를 선으로 연결한 다이어그램 형태 |
| 어울리는 데이터 | 메뉴/프로그램 목록, 폴더 구조처럼 항목 수가 많은 데이터 | 부서/직위처럼 "구조 자체"를 한눈에 보여줘야 하는 데이터 |
| 드래그로 계층 변경 | 지원 안 함 | `draggable: true`로 노드를 드래그해 조직 구조를 바로 바꿀 수 있음 |
| 확대/축소, 화면 이동 | 없음 | `zoom`/`pan` 옵션으로 지원 |

즉, "이 항목이 몇 단계 아래에 있는지"보다 "누가 누구 밑에 있는지 그림으로" 보여줘야 할 때 OrganizationView를 사용합니다.

## 언제 사용하나요?

- 회사/부서 조직도, 결재라인, 보고 체계처럼 상하 관계를 시각적으로 보여줘야 할 때
- 사용자가 노드를 드래그해서 소속(상위 조직)을 직접 바꿀 수 있게 하고 싶을 때 (`draggable: true` + `nodedrop` 이벤트)
- 노드 개수가 많아 화면에 다 들어가지 않을 때 (`zoom`/`pan` 옵션으로 확대·축소·이동)
- 노드를 우클릭해서 "하위 조직 생성", "구성원 보기" 같은 메뉴를 띄워야 할 때 — OrganizationView 자체에는 우클릭 메뉴 기능이 없으므로, [ContextMenu](../ContextMenu/README.md) 컨트롤과 함께 사용합니다. `target`에 조직도 컨테이너 셀렉터(`#조직도ID`)를, `delegate`에 노드 셀렉터(`div.node`)를 지정하는 방식입니다.

## 빠른 시작

```html
<syn_organization id="orgChartView" syn-options="{
    height: '360px',
    draggable: true,
    nodeTitle: 'name',
    nodeContent: 'title',
    reduceMap: { key: 'ProgramID', title: 'ProgramName', parentID: 'ParentID' }
}" syn-events="['nodedrop', 'select', 'click']"></syn_organization>
```

```js
'use strict';
let $samplePage = {
    event: {
        orgChartView_select(evt, node) {
            // node는 클릭된 노드의 jQuery 객체입니다.
            syn.$l.eventLog('orgChartView_select', node.find('.title').text());
        }
    }
}
```

값을 채워 넣을 때는 `setValue`에 평평한(flat) 배열을 그대로 넘기면 됩니다. 각 항목은 `reduceMap`에 지정한 컬럼명(`ProgramID`, `ProgramName`, `ParentID`)을 가지고 있어야 합니다.

```js
syn.uicontrols.$organization.setValue('orgChartView', [
    { ProgramID: 'ROOT', ProgramName: '전체 조직', ParentID: null },
    { ProgramID: 'A01', ProgramName: '인사팀', ParentID: 'ROOT' },
    { ProgramID: 'A0101', ProgramName: '홍길동', ParentID: 'A01' }
]);
```

핵심 포인트:
- 마크업은 `<syn_organization>` 커스텀 태그로 작성하고, `syn-options`에 `reduceMap`/`nodeTitle`/`nodeContent`/`draggable` 등을 JSON으로 넣습니다.
- 페이지에 `<script src="/js/syn.loader.js"></script>` 한 줄만 있으면 OrgChart 플러그인을 포함한 나머지 CSS/JS는 자동으로 로드됩니다. 별도의 `pageLoadFiles` 설정이 필요 없습니다.
- `getValue`/`setValue`는 TreeView와 마찬가지로 항상 "평평한 배열"을 주고받습니다. 조직도 안에서만 계층(중첩) 구조로 다뤄지고, 컨트롤 밖으로 나올 때는 평평한 형태로 변환됩니다.
- 최상위(루트) 노드에는 기본적으로 `top-level` 클래스가 붙어 초록색으로, 그 외 노드는 파란색(`middle-level`)으로 표시됩니다(`OrganizationView.css` 참고). 원본 데이터에 `className` 컬럼을 넣어 노드별로 색을 다르게 줄 수도 있습니다.

## 예제 실행하기

`example/` 폴더의 각 HTML 파일을 handstack의 wwwroot 정적 서버(예: rdy 프로젝트) 경로 아래에 두고 브라우저로 열면 바로 동작을 확인할 수 있습니다.

- `basic.html` : 기본 조직도 표시 + `getValue`/`setValue`/`clear`/`getControl` 기능 확인
- `contextmenu.html` : [ContextMenu](../ContextMenu/README.md)와 결합해서 노드 우클릭 메뉴(하위조직 생성 등)를 띄우는 예제
- `events.html` : `nodedrop`(드래그로 조직 이동)/`select`/`click` 이벤트와 `getRelatedNodes`를 함께 확인하는 예제

각 예제는 화면 하단 로그 영역(`syn.$l.eventLog` 출력)에서 이벤트 발생 순서와 전달값을 확인할 수 있습니다.

## 더 알아보기

- API 상세는 같은 폴더의 `API.md`를 참고하세요.
- 실제 소스: `wwwroot/uicontrols/OrganizationView/OrganizationView.js`, `OrganizationView.css`
- 기존 샘플: `wwwroot/sample/uicontrol/organization.html`, `organization.js`
- 실사용 예: qcn.groupware의 조직도 화면 — `nodeTemplate`/`createNode`로 노드 안에 아이콘을 추가하고, 그 아이콘 클릭 시 `syn.uicontrols.$contextmenu.open(...)`으로 메뉴를 여는 패턴, `nodedrop` 이벤트에서 `getRelatedNodes(elID, dropZone, 'children')`로 드롭된 노드의 하위 조직을 다시 조회하는 흐름을 참고할 수 있습니다.
- ContextMenu와 함께 쓰는 방법: `../ContextMenu/README.md`, `../ContextMenu/API.md`
- OrgChart 원본 문서: https://github.com/dabeng/OrgChart
