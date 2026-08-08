# OrganizationView API 참조

싱글턴 객체: `syn.uicontrols.$organization`
소스 파일: `wwwroot/uicontrols/OrganizationView/OrganizationView.js`, `wwwroot/uicontrols/OrganizationView/OrganizationView.css`
내부 라이브러리: [dabeng/OrgChart](https://github.com/dabeng/OrgChart) (jQuery 플러그인)

## 마크업

```html
<syn_organization id="orgChartView" syn-options="{
    height: '360px',
    draggable: true,
    nodeTitle: 'name',
    nodeContent: 'title',
    pan: true,
    zoom: true,
    verticalLevel: 5,
    itemID: 'key',
    parentItemID: 'parentID',
    childrenID: 'children',
    reduceMap: { key: 'ProgramID', title: 'ProgramName', parentID: 'ParentID' },
    nodeTemplate: '$this.event.orgChartView_nodeTemplate',
    createNode: '$this.event.orgChartView_createNode'
}" syn-events="['nodedrop', 'select', 'click']"></syn_organization>
```

- `id`는 페이지 내에서 유일해야 하며, `syn.uicontrols.$organization`의 각종 메서드에서 이 `id`(elID)를 사용합니다.
- `controlLoad` 실행 시 원래 태그는 `{elID}_hidden`으로 이름이 바뀌며 `display:none` 처리되고, 같은 위치에 실제 OrgChart가 그려질 `<div id="{elID}">`를 감싼 래퍼(`div.organization-container` 또는 `className` 옵션으로 지정한 클래스)가 새로 추가됩니다.
- `width`/`height`는 마크업 요소의 인라인 `style.width`/`style.height`가 지정되어 있으면 그 값이 `syn-options`보다 우선합니다.
- `nodeTemplate`/`createNode`는 마크업에서 `'$this.event.함수명'` 형태의 문자열로 지정하면 `controlLoad` 시점에 `eval`되어 실제 함수로 바뀝니다. 페이지 스크립트의 `event` 객체에 해당 이름의 함수를 정의해 두어야 합니다.

## Options (defaultSetting)

| 속성 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `width` | string | `'100%'` | 조직도 컨테이너 너비 |
| `height` | string | `'300px'` | 조직도 컨테이너 높이(넘치면 스크롤) |
| `itemID` | string | `'id'` | 평평한(flat) 데이터에서 각 행의 고유 키 컬럼명. `getValue`/`setValue`가 조직도 ↔ flat 배열 변환 시 사용합니다. |
| `parentItemID` | string | `'parentID'` | flat 데이터에서 부모 키 컬럼명 |
| `childrenID` | string | `'children'` | 중첩(nested) 구조로 변환할 때 자식 배열을 담을 속성명 |
| `reduceMap` | object | `{ key:'id', title:'title', parentID:'parentID' }` | 조직도 내부 필드(`key`/`title`/`parentID`)와 실제 데이터 컬럼명을 매핑 |
| `nodeTitle` | string | `'name'` | 노드 상단(제목 영역)에 표시할 원본 데이터 컬럼명 |
| `nodeContent` | string | `'title'` | 노드 하단(내용 영역)에 표시할 원본 데이터 컬럼명 |
| `direction` | string | `'t2b'` | 조직도가 뻗어나가는 방향. `'t2b'`(위→아래), `'b2t'`, `'l2r'`, `'r2l'` |
| `pan` | boolean | `false` | 마우스 드래그로 조직도 전체를 이동(팬)할 수 있는지 여부 |
| `zoom` | boolean | `false` | 마우스 휠로 확대/축소할 수 있는지 여부 |
| `zoominLimit` | number | `2` | `zoom`이 켜졌을 때 최대 확대 배율 |
| `zoomoutLimit` | number | `0.8` | `zoom`이 켜졌을 때 최대 축소 배율 |
| `draggable` | boolean | `false` | 노드를 드래그해서 다른 노드 밑으로 옮길 수 있는지 여부. `true`로 하면 `nodedrop` 이벤트가 의미를 가집니다. |
| `className` | string | `'top-level'` | 조직도 최상위 래퍼(`div`)에 붙는 CSS 클래스. 지정하지 않으면 `'organization-container'`가 사용됩니다. |
| `verticalLevel` | number | `4` | 이 값 이하의 깊이까지는 세로(수직) 레이아웃 대신 OrgChart의 계층 접기 규칙을 따르는 기준 레벨(원본 OrgChart의 `verticalLevel` 옵션) |
| `nodeTemplate` | function \| string | `null` | 노드 내부 HTML을 직접 그리는 함수 `(data) => htmlString`. 마크업에서는 `'$this.event.함수명'` 문자열로 지정합니다. |
| `createNode` | function \| string | `null` | 노드 DOM이 생성된 직후 호출되는 함수 `($node, data)`. 아이콘 추가, 클릭 핸들러 부착 등 커스텀 처리에 사용합니다. 마크업에서는 `'$this.event.함수명'` 문자열로 지정합니다. |
| `dataType` | string | `'string'` | 다른 컨트롤과 형식을 맞추기 위한 공통 속성 |
| `belongID` / `getter` / `setter` / `controlText` / `validators` / `transactConfig` / `triggerConfig` | - | `null`/`false` | syn.uicontrols 공통 옵션(값 바인딩·유효성검사·트랜잭션 연동용) |

### reduceMap

`getValue`/`setValue`가 조직도 노드(`key`/`title`/`parentID`)와 원본 데이터 컬럼을 서로 바꿔치기할 때 쓰는 매핑 테이블입니다.

| 속성 | 기본값 | 설명 |
|---|---|---|
| `key` | `'id'` | 노드 고유 키에 대응하는 실제 데이터 컬럼명 |
| `title` | `'title'` | 조직도 내부에서 다루는 타이틀 값에 대응하는 컬럼명(화면 표시는 `nodeTitle`/`nodeContent`가 별도로 담당) |
| `parentID` | `'parentID'` | 부모 노드 키에 대응하는 컬럼명 |

> 주의: 화면에 실제로 보이는 텍스트는 `nodeTitle`/`nodeContent` 옵션이 가리키는 컬럼이고, `reduceMap.title`은 `getValue`/`setValue` 변환에만 관여하는 별개의 값입니다. 둘을 같은 컬럼명으로 맞추지 않으면 "표시되는 값"과 "getValue로 꺼낸 값"이 다르게 보일 수 있습니다.

## 메서드

`syn.uicontrols.$organization.<메서드명>(...)` 형태로 호출합니다.

| 메서드 | 설명 |
|---|---|
| `getControl(elID)` | 등록된 컨트롤 정보(`{ id, orgchart, config }`)를 반환. `orgchart`가 실제 OrgChart 플러그인 인스턴스입니다. |
| `getValue(elID, meta)` | 조직도 전체를 `reduceMap` 기준의 평평한(flat) 배열로 변환해서 반환합니다. |
| `setValue(elID, value, meta)` | `reduceMap` 컬럼명을 가진 평평한(flat) 배열을 받아 중첩 구조로 변환한 뒤 조직도를 다시 그립니다(`orgchart.init`). |
| `clear(elID, isControlLoad)` | 조직도 내용을 비웁니다(`orgchart.init({ data: null })`). |
| `init(elID, newOptions)` | 조직도를 새 옵션/데이터로 다시 초기화합니다(OrgChart의 `init` 그대로 위임). |
| `getHierarchy(elID, includeNodeData)` | 현재 조직도를 중첩(nested) 구조 그대로 반환합니다. `includeNodeData`가 `true`면 각 노드의 원본 데이터도 포함합니다. |
| `addParent(elID, data)` | 최상위 노드 위에 새 부모 노드를 추가합니다. |
| `addSiblings(elID, node, data)` | 주어진 `node`와 같은 레벨에 형제 노드를 추가합니다. |
| `addChildren(elID, node, data)` | 주어진 `node` 아래에 자식 노드를 추가합니다. |
| `removeNodes(elID, node)` | 주어진 `node`(와 그 하위 노드 전체)를 제거합니다. |
| `hideParent(elID, node)` / `showParent(elID, node)` | 주어진 `node`의 상위 계층을 숨기거나 다시 보여줍니다. |
| `hideSiblings(elID, node, direction)` / `showSiblings(elID, node, direction)` | 주어진 `node`의 형제 노드들을 방향(`direction`)에 따라 숨기거나 보여줍니다. |
| `showChildren(elID, node)` | 주어진 `node`의 하위 계층을 펼쳐 보여줍니다. |
| `getNodeState(elID, node, relation)` | `node`를 기준으로 `relation`(`'parent'`\|`'children'`\|`'siblings'`, 기본 `'children'`) 방향 노드들의 표시 상태(펼침/숨김 등)를 반환합니다. |
| `getRelatedNodes(elID, node, relation)` | `node`를 기준으로 `relation`(`'parent'`\|`'children'`\|`'siblings'`, 기본 `'children'`) 방향의 관련 노드(jQuery 컬렉션)를 반환합니다. 드래그로 노드를 옮긴 뒤 변경된 하위 조직을 다시 조회할 때 유용합니다. |
| `setChartScale(elID, node, newScale)` | 조직도의 확대/축소 배율을 직접 지정합니다(`zoom: true`일 때 의미가 있습니다). |
| `export(elID, fileName, fileExtension)` | 현재 조직도를 이미지/PDF 등으로 내보냅니다. `fileName`을 생략하면 임의 문자열(`syn.$l.random()`)이 사용됩니다. |
| `setLocale(elID, translations, control, options)` | 다국어 텍스트 적용 훅(OrganizationView는 별도 구현 없음, 빈 함수) |

> `controlLoad(elID, setting)`은 컨트롤이 마크업을 실제 OrgChart로 초기화하는 내부 진입점으로, 프레임워크가 자동으로 호출합니다. 직접 호출할 일은 거의 없습니다.

## 이벤트 (syn-events)

`syn-events` 배열에 이름을 넣으면 페이지 스크립트의 `event` 객체에서 `{elID}_{이벤트명}` 함수를 자동으로 연결해 줍니다.

중요: 아래 `eventHooks`(`nodedrop`/`select`/`click`) 목록에 있는 이름만 실제로 동작합니다. 목록에 없는 이름을 `syn-events`에 적어도 에러는 나지 않지만 아무 핸들러도 연결되지 않습니다.

| 이벤트명 | 발생 시점 | 핸들러 시그니처 |
|---|---|---|
| `nodedrop` | `draggable: true`인 상태에서 노드를 드래그해 다른 노드 위에 놓았을 때 | `(evt, params)` — `params.draggedNode`(옮겨진 노드), `params.dragZone`(원래 부모), `params.dropZone`(새 부모)이 모두 jQuery 객체로 전달됩니다. |
| `select` | 조직도 안의 아무 노드(`.node`)를 클릭했을 때 | `(evt, node)` — `node`는 클릭된 노드의 jQuery 객체입니다. |
| `click` | 조직도 영역(`.orgchart`) 어디든 클릭했을 때 | `(evt, focusNodes)` — `focusNodes`는 클릭 지점이 노드 위였는지를 나타내는 개수(0 또는 1 이상)입니다. |

핸들러 등록 예:

```js
let $samplePage = {
    event: {
        orgChartView_nodedrop(evt, params) {
            syn.$l.eventLog('orgChartView_nodedrop',
                params.draggedNode.children('.title').text() + ' -> ' + params.dropZone.children('.title').text());
        },
        orgChartView_select(evt, node) {
            syn.$l.eventLog('orgChartView_select', node.find('.title').text());
        },
        orgChartView_click(evt, focusNodes) {
            syn.$l.eventLog('orgChartView_click', 'focusNodes=' + focusNodes);
        }
    }
}
```

## 참고

- 내부적으로 jQuery의 `.orgchart(setting)` 호출을 그대로 감싼 구조이므로, 옵션/메서드의 더 자세한 원본 설명은 OrgChart 문서를 참고하세요: https://github.com/dabeng/OrgChart
- 노드를 우클릭했을 때 메뉴를 띄우려면 OrganizationView 자체가 아니라 [ContextMenu](../ContextMenu/API.md)를 함께 사용합니다. `target`에 조직도 컨테이너 셀렉터(`#조직도ID`)를, `delegate`에 `'div.node'`를 지정하면 노드를 우클릭했을 때 메뉴가 뜹니다.

  ```html
  <syn_organization id="orgChartView" syn-options="{...}" syn-events="['click']"></syn_organization>
  <syn_contextmenu id="ctxTreeItem" syn-options="{
      target: '#orgChartView', delegate: 'div.node', menu: [...]
  }" syn-events="['beforeOpen', 'select']"></syn_contextmenu>
  ```

  또는 `createNode` 콜백에서 노드 안에 아이콘을 추가하고, 그 아이콘 클릭 시 `syn.uicontrols.$contextmenu.open('ctxTreeItem', this)`로 메뉴를 직접 여는 방식도 자주 쓰입니다(우클릭 대신 아이콘 클릭으로 메뉴를 여는 패턴).
- `getValue`/`setValue`는 항상 flat 배열 기준입니다. 조직도 내부 계층 변환은 `syn.$l.flat2Nested` / `syn.$l.nested2Flat` 유틸리티가 담당합니다(TreeView와 동일한 유틸리티를 공유합니다).
- `draggable: true`로 노드를 옮긴 뒤에는 `nodedrop` 핸들러에서 `getRelatedNodes(elID, params.dropZone, 'children')`을 호출해 변경된 하위 조직 목록을 다시 조회하는 패턴이 자주 쓰입니다.
