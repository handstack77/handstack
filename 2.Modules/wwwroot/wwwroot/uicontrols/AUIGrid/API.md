# AUIGrid API 참조 — $auigrid (AUIGrid.js)

이 폴더에는 AUIGrid 기반의 `$auigrid` 엔진만 있습니다. 다른 그리드 엔진 API는 각 폴더의 `API.md`를 참고하세요.

## $auigrid (AUIGrid.js — AUIGrid 기반, 실무 주력 엔진)

싱글턴 객체: `syn.uicontrols.$auigrid`
소스 파일: `wwwroot/uicontrols/AUIGrid/AUIGrid.js`, `wwwroot/uicontrols/AUIGrid/AUIGrid.css`
내부 라이브러리: [AUIGrid](https://www.auisoft.net/documentation/auigrid/) (상용, `/lib/auigrid/dist/AUIGrid.js` + `AUIGridLicense.js`)

이 저장소의 실무 업무 화면에서 가장 많이 쓰이는 표준 그리드 엔진입니다.

### 마크업

```html
<syn_auigrid id="grdGrid1" syn-datafield="DataList1" syn-options="{
    height: 584, showInlineFilter: true, controlText: '그룹코드 목록',
    columns: [
        ['GroupCode', '그룹코드', 80, false, 'text', true, 'left', ['LD02','MD01','DD01'], {style:'bg:#e7e7e7!', maxlength:10}],
        ['GroupName', '그룹코드명', 150, false, 'text', false, 'left', 'MD01', {validators:['require','unique'], maxlength:50}],
        ['CategoryID', '분류', 100, false, 'dropdown', false, 'center', 'MD01', {dataSourceID:'CategoryID', local:true, required:false, emptyText:'선택'}]
    ]
}" syn-events="['afterSelectionEnd', 'filtering']"></syn_auigrid>
```

- `id`는 페이지 내에서 유일해야 하며 각 메서드에서 `elID`로 사용됩니다.
- `controlLoad` 실행 시 원래 태그는 `{elID}_hidden`으로 바뀌고, `AUIGrid.create('#elID', columnLayout, setting)`로 실제 그리드가 생성됩니다.
- 첫 번째 컬럼(`Flag`)을 지정하지 않아도 자동으로 추가되고 숨김(`isHidden: true`) 처리됩니다.
- `width`/`height`는 숫자로 주면 자동으로 `px`가 붙습니다(기본값 `'100%'` / `'240px'`).

### 컬럼 정의 튜플 (`columns` 배열의 각 원소)

| 인덱스 | 이름 | 설명 |
|---|---|---|
| 0 | `dataField` | 데이터 필드명(컬럼ID). 스파크라인처럼 여러 필드를 조합할 때는 `'DensityNum,WidthNum,YarnCount'`처럼 콤마로 나열 가능 |
| 1 | `headerText` | 컬럼 헤더 텍스트 |
| 2 | `width` | 컬럼 너비(px) |
| 3 | `isHidden` | 컬럼 숨김 여부(`visible`도 함께 반전 설정됨) |
| 4 | `columnType` | 문자열(`'text'`/`'numeric'`/`'date'`/`'time'`/`'checkbox'`/`'button'`/`'image'`/`'imagefallback'`/`'link'`/`'safehtml'`/`'korean'`/`'english'`/`'password'`/`'sparkline'`/`'sparkcolumn'`) 또는 `{ columnType: '...', ...옵션 }` 객체(드롭다운·코드헬프 등 추가 옵션이 필요할 때) |
| 5 | `readOnly` | 편집 불가 여부 → `editable = !readOnly` |
| 6 | `alignConstants` | 정렬(`'left'`/`'center'`/`'right'`) → AUIGrid `style: 'text:{align}!'`로 변환 |
| 7 | `belongID` | 특정 코드값에서만 보이도록 제한(문자열 또는 배열 → 콤마 결합되어 `belongID`에 저장) |
| 8 | `options` | 그 외 옵션 객체(`dataSourceID`, `storeSourceID`, `codeColumnID`, `validators`, `maxlength`, `style` 등을 자유롭게 지정) |

컬럼 타입별 대표 옵션:

| columnType | 주요 추가 옵션 | 설명 |
|---|---|---|
| `dropdown` | `dataSourceID`/`storeSourceID`, `keyField`, `valueField`, `local` | 코드값 콤보. `DropDownListRenderer`로 렌더링되며 `dataRefresh`로 코드 목록을 채움 |
| `codehelp` | `dataSourceID`, `codeColumnID`, `textColumnID`, `controlText` | 코드도움 팝업(`IconRenderer` + `InputEditRenderer`) — [CodePicker](../CodePicker/README.md)와 유사한 역할 |
| `checkbox` | `checkValue`(기본 `'1'`), `unCheckValue`(기본 `'0'`), `checkableFunction` | `CheckBoxEditRenderer` |
| `date` / `time` | `dataType: 'date'` 등 | 날짜/시간 포맷 컬럼 |
| `sparkline` / `sparkcolumn` | 콤마로 나열한 다중 `dataField` | 미니 차트 컬럼 |
| `button` | `cellButtonIcon` 등 | `cellButtonClick` 이벤트로 클릭 처리 |

### Options (gridOptions)

| 속성 | 기본값 | 설명 |
|---|---|---|
| `headerHeight` / `rowHeight` | `40` | 헤더/행 높이 |
| `showFooter` / `footerPosition` | `false` / `'bottom'` | 하단 합계 영역 |
| `enableClipboard` | `true` | 복사/붙여넣기 |
| `allowClipboardPaste` | `false` | 붙여넣기로 값 변경 허용 여부(끄면 `clipboardPaste` 이벤트로만 감지) |
| `fixedRowCount` / `fixedColumnCount` | `0` | 고정 행/열 개수 |
| `showRowNumColumn` | `true` | 행 번호 컬럼 표시 |
| `showRowCheckColumn` / `rowCheckToRadio` | `false` | 행 체크박스(또는 라디오) 컬럼 |
| `enableSorting` | `true` | 헤더 클릭 정렬 |
| `enableMovingColumn` | `false` | 컬럼 순서 드래그 이동 |
| `editable` | `true` | 그리드 전체 편집 가능 여부 |
| `selectionMode` | `'multipleCells'` | 셀 선택 모드 |
| `hoverMode` | `'singleRow'` | 마우스 오버 강조 방식 |
| `useContextMenu` | `true` | 우클릭 컨텍스트 메뉴 |
| `enableFilter` / `showInlineFilter` | `true` / `false` | 컬럼 필터 / 헤더 인라인 필터 입력창 |
| `useGroupingPanel` | `false` | 그룹핑 패널(컬럼 드래그로 그룹핑) |
| `softRemoveRowMode` | `false` | 소프트 삭제(Flag='D') 모드 |
| `applyRestPercentWidth` | `true` | 나머지 컬럼에 남은 폭을 비율대로 배분 |
| `groupingMessage` / `noDataMessage` | 안내 문구 | 그룹핑/데이터 없음 안내 메시지 |
| `transactConfig` / `triggerConfig` | `null` | syn.uicontrols 공통 트랜잭션/트리거 연동 옵션 |

### 메서드

`syn.uicontrols.$auigrid.<메서드명>(...)` 형태로 호출합니다.

| 메서드 | 설명 |
|---|---|
| `getValue(elID, requestType, metaColumns)` | 변경분(`'Row'`/`'List'`)을 `metaColumns` 매핑대로 전송용 배열로 변환 |
| `setValue(elID, value, metaColumns)` | 원본 배열을 그리드에 채움(Flag는 자동 `'R'`) |
| `clear(elID, isControlLoad)` | 데이터 초기화 |
| `getGridData(elID, options)` / `setGridData` | 원본 AUIGrid API 수준의 데이터 조회/설정 |
| `getUpdateData` 계열: `getFlag(elID, row)` / `setFlag(elID, row, flagValue)` | CRUD 상태 조회/설정 |
| `isUpdateData(elID)` | 변경 여부 조회 |
| `insertRow(elID, setting, callback)` | 행 추가. `setting = { values, index, amount }`(`index`는 숫자 또는 `'last'`/`'first'`/`'selectionUp'`/`'selectionDown'`) |
| `removeRow(elID, dataField, rowIndex, callback)` / `removeRowByRowId(elID, rowIDs)` | 행 삭제 |
| `getDataAtCell(elID, rowIndex, dataField)` / `setDataAtCell(elID, rowIndex, dataField, value)` | 셀 값 조회/설정 |
| `getCellValue` / `setCellValue` | AUIGrid 원본 셀 값 조회/설정(포맷 미적용 원시값) |
| `getSourceDataAtRow(elID, rowIndex)` / `getItemByRowIndex` / `getItemByRowID` | 행 데이터 조회 |
| `getDataAtCol(elID, dataField, total)` / `getColumnValues` | 열 데이터 조회 |
| `getRowIndexByValue(elID, dataField, value)` / `getRowIndexesByValue` / `getRowsByValue` | 값 기준 행 검색 |
| `updateRow` / `updateRows` / `updateRowsById` / `updateAllToValue` / `updateRowBlockToValue` | 다양한 단위의 값 일괄 갱신 |
| `getActiveRowIndex(elID)` / `getActiveColIndex(elID)` / `getSelectedIndex` | 현재 선택 행/열 |
| `selectCell(elID, rowIndex, dataField)` / `clearSelection(elID)` | 셀 선택/해제 |
| `getSelected(elID)` / `getSelectedItem` / `getSelectedItems` / `getSelectedText` | 선택 범위/항목 조회 |
| `propToCol(elID, dataField)` / `colToProp(elID, colIndex)` | 컬럼ID ↔ 컬럼 인덱스 변환 |
| `visibleColumns(elID, columns, isShow)` / `unHiddenColumns(elID)` / `isColumnHidden` | 컬럼 숨김/표시 |
| `addFilterCache` / `addCondition(elID, dataField, name, args, args2)` / `removeCondition` / `clearConditions` | 필터 조건 조작 |
| `addMultiCondition(elID, dataField, conditions, logic = 'OR')` | 한 컬럼에 여러 조건을 AND/OR로 결합하여 한 번에 등록 |
| `setFilter(elID, dataField, func)` | 커스텀 필터 함수 지정 |
| `setSorting(elID, sortInfos)` / `clearSorting(elID)` | 정렬 적용/해제 |
| `setCellMerge(elID, isMerged)` / `getMergeItems` / `hasMerge` | 셀 병합 |
| `setFixedColumnCount` / `setFixedRowCount` | 고정 열/행 개수 변경 |
| `setFooter(elID, footerLayout, isChangeFooter)` | 하단 합계 영역 구성 |
| `exportToObject` / `exportAsString(elID, options)` / `exportFile(elID, options)` / `importFile(elID, callback)` | 내보내기/가져오기. `exportAsString`은 `options.callback` 생략 시, `importFile`은 `callback` 생략 시 `Promise` 반환 |
| `checkEditValue(elID)` / `checkUniqueValueCol` / `checkValueCountCol` / `checkEmptyValueCol(s)` | 유효성 검사 |
| `validateGridData(elID, dataField)` | 컬럼 데이터 타입 기준 유효성 검사 |
| `getGridControl` 대응: `getGridID(elID)` | 내부 AUIGrid ID(`'#elID'`) 반환 — 이후 `AUIGrid.*` 원본 API를 직접 호출할 때 사용 |
| `setControlSize(elID, size)` / `setColumnWidth` / `setColumnWidths` / `getColumnWidth(s)` | 크기 조정 |
| `render(elID)` | 강제 리렌더링 |
| `search(elID, dataField, term, options)` / `searchAll(elID, term, options)` | 텍스트 검색/하이라이트 |

### addCondition 조건

`addCondition(elID, dataField, name, args, args2)`는 해당 컬럼의 기존 필터를 교체합니다. 다른 컬럼의 필터는 유지하며, `dataField`에 숫자를 전달하면 컬럼 인덱스로 해석합니다.

| `name` | 동작 |
|---|---|
| `begins_with` / `ends_with` | `args`로 시작 / 끝나는 문자열 |
| `contains` / `not_contains` | `args`가 부분 문자열로 포함됨 / 포함되지 않음 |
| `eq` / `neq` | `args`와 같음 / 다름 |
| `by_value` | 단일 `args`와 같음. 배열이면 목록 중 하나와 같음(빈 배열은 모두 제외) |
| `empty` / `not_empty` | `null`, `undefined`, `''`임 / 아님. `0`, `false`, 공백 문자열은 빈 값이 아님 |
| `gt` / `gte` / `lt` / `lte` | `args`보다 큼 / 크거나 같음 / 작음 / 작거나 같음 |
| `between` / `not_between` | `args <= value <= args2` / 두 경계 밖. 경계값은 `between`에 포함 |

- 문자열 조건은 숫자·불리언을 문자열로 변환하며 대소문자를 구분합니다. 셀 값 또는 `args`가 `null`/`undefined`이면 `not_contains`도 일치하지 않습니다. 빈 검색어는 모든 문자열에 포함됩니다.
- `eq`, `neq`, `by_value`는 기존 호환성을 위해 JavaScript의 `==`/`!=` 비교를 유지합니다(예: `1`과 `'1'`은 같음). 미정의 조건 이름도 기존처럼 동등 비교합니다.
- 순서·범위 조건은 빈 셀 값이나 빈 경계(`null`, `undefined`, `''`)를 제외합니다. 범위는 양쪽 경계와 비교할 수 있는 값만 포함하며, `NaN` 등 비교 불가 값은 `not_between`에서도 제외합니다. 경계는 작은 값, 큰 값 순서로 전달합니다.
- 순서 비교는 JavaScript 비교 규칙을 유지합니다. 수치 비교는 경계를 숫자로 전달하고, 날짜 문자열은 동일한 ISO 형식(예: `yyyy-MM-dd`)으로 맞춥니다. 문자열끼리는 사전순으로 비교합니다.

#### 배열 인수

- `args`는 단일 값 또는 1차원 배열입니다. `eq`, `by_value`, `begins_with`, `ends_with`, `contains`, `gt`, `gte`, `lt`, `lte`는 하나라도 일치하면 통과(OR)합니다. `neq`, `not_contains`는 모든 값에 대한 제외 조건이 참이어야 통과(AND)합니다. 미정의 조건 이름의 동등 비교도 OR로 처리합니다.
- `between`/`not_between`은 `args`와 `args2` 모두 배열을 지원하며, `args[i]`와 `args2[i]`를 하나의 범위로 묶습니다. 한쪽만 단일 값이면 모든 범위에 공통 적용합니다. 배열끼리의 모든 조합으로 범위를 만들지는 않습니다.
- `between`은 범위 중 하나에 포함되면 통과하고, `not_between`은 모든 범위 밖일 때 통과합니다. 두 배열의 길이가 다르면 경고를 기록하고 해당 호출을 적용하지 않아 기존 필터를 유지합니다. 길이 1인 배열도 다른 배열과 길이가 같아야 합니다.
- 빈 배열은 포함 조건에서 불일치, 제외 조건에서 일치로 처리합니다. 단, `not_contains`의 `null`/`undefined` 셀 제외와 `not_between`의 빈 셀·`NaN` 제외는 그대로 적용합니다. 문자열 조건의 `null`/`undefined` 검색어와 범위 조건의 빈 경계·비교 불가 경계는 불일치하므로, 해당 제외 조건에서도 통과하지 않습니다.
- `empty`/`not_empty`는 인수를 사용하지 않습니다. 범위 조건 외에는 `args2`를 무시합니다.

```js
syn.uicontrols.$auigrid.addCondition('grdProduct', 'ProductName', 'contains', '이어폰');
syn.uicontrols.$auigrid.addCondition('grdProduct', 'ProductName', 'contains', ['이어폰', '배터리']);
syn.uicontrols.$auigrid.addCondition('grdProduct', 'ProductName', 'not_contains', ['이어폰', '배터리']);
syn.uicontrols.$auigrid.addCondition('grdProduct', 'CategoryID', 'by_value', ['ELE', 'HOM']);
syn.uicontrols.$auigrid.addCondition('grdProduct', 'Price', 'between', 0, 50000);
// 0~20000 또는 80000~100000 (양쪽 경계 포함)
syn.uicontrols.$auigrid.addCondition('grdProduct', 'Price', 'between', [0, 80000], [20000, 100000]);
// 0~20000, 0~50000에 공통 하한 0 적용
syn.uicontrols.$auigrid.addCondition('grdProduct', 'Price', 'between', 0, [20000, 50000]);
syn.uicontrols.$auigrid.addCondition('grdProduct', 'Memo', 'empty');
```

### addMultiCondition 조건

`addMultiCondition(elID, dataField, conditions, logic = 'OR')`는 하나의 컬럼에 `[{ name, args, args2, logic }]` 조건 목록을 적용합니다. 각 조건의 `logic`은 선택 사항입니다. 내부적으로 모든 조건을 검증하고 공통 판정 함수를 조합한 뒤 `AUIGrid.setFilter`를 한 번만 호출합니다.

- 마지막 인수 `logic`은 기본 결합 방식이며 생략하면 OR입니다. 두 번째 조건부터 각 조건의 `logic`이 있으면 이를 우선하여 앞까지 계산한 결과와 현재 조건을 연결합니다. 해당 값이 생략되거나 `undefined`이면 기본 결합 방식을 적용합니다. 각 조건 내부의 배열 결합은 위 `addCondition` 규칙을 유지합니다.
- 첫 번째 조건은 시작값이므로 해당 조건의 `logic`을 사용하지 않습니다. 이후에는 항상 왼쪽부터 순서대로 결합합니다. 예를 들어 A, B(`logic: 'OR'`), C(`logic: 'AND'`)는 `(A OR B) AND C`입니다. 모든 조건의 `logic`이 생략되면 기존처럼 마지막 인수로 전체 조건을 결합합니다.
- 기본 `logic`과 두 번째 이후 조건의 `logic`은 대소문자를 구분하지 않으며 AND/OR만 허용합니다. 두 번째 이후 조건에 `null`, 빈 문자열 또는 다른 값을 전달하면 경고를 기록하고 전체 호출을 적용하지 않아 기존 필터를 유지합니다.
- `name`은 위 표에 있는 조건 이름이어야 합니다. `empty`/`not_empty` 외에는 `args` 키가 필요하며, `between`/`not_between`은 `args2` 키도 필요합니다. 명시적으로 전달한 `null`/`undefined` 등의 값은 `addCondition`의 비교 규칙을 따릅니다.
- 조건 목록·항목·이름·필수 키·결합 방식이 잘못되거나 범위 배열 길이가 다르면 경고를 기록하고 전체 호출을 적용하지 않습니다. 기존 컬럼 필터는 유지합니다. `addCondition`의 미정의 이름에 대한 동등 비교는 기존 호환 동작으로 유지하지만, 새 함수는 미정의 이름을 거부합니다.
- 빈 조건 목록 `[]`는 해당 컬럼의 필터를 해제합니다. 조건 안의 `args: []`는 조건 목록 `[]`와 다르며, 기존의 빈 배열 비교 규칙을 따릅니다.
- 같은 컬럼에 재호출하면 기존 필터를 새 조건 목록으로 교체합니다. `addCondition`과도 서로 교체하며, 다른 컬럼의 필터는 유지합니다. `dataField`에는 컬럼 ID 또는 숫자 인덱스를 전달할 수 있습니다.
- `removeCondition(elID, dataField)`는 해당 컬럼의 다중 조건 전체를 삭제합니다. `clearConditions(elID)`는 전체 컬럼 필터를 해제합니다. 개별 조건 하나를 바꾸거나 삭제하려면 수정한 조건 목록으로 다시 호출합니다.

```js
// (이어폰 또는 배터리 포함) AND (중고와 불량 모두 미포함)
syn.uicontrols.$auigrid.addMultiCondition('grdProduct', 'ProductName', [
    { name: 'contains', args: ['이어폰', '배터리'] },
    { name: 'not_contains', args: ['중고', '불량'] }
], 'AND');

// (0~20000 또는 80000~100000) OR (판매가가 50000)
syn.uicontrols.$auigrid.addMultiCondition('grdProduct', 'Price', [
    { name: 'between', args: [0, 80000], args2: [20000, 100000] },
    { name: 'eq', args: 50000 }
], 'OR');

// 조건별 OR가 명시한 AND보다 우선:
// (홍 또는 김 포함) OR (테스트와 임시 모두 미포함)
syn.uicontrols.$auigrid.addMultiCondition('grdGrid', 'Name', [
    { name: 'contains', args: ['홍', '김'] },
    { name: 'not_contains', args: ['테스트', '임시'], logic: 'OR' }
], 'AND');

syn.uicontrols.$auigrid.removeCondition('grdProduct', 'ProductName');
// 빈 목록으로도 동일하게 해당 컬럼 필터 해제
syn.uicontrols.$auigrid.addMultiCondition('grdProduct', 'Price', []);
```

### 이벤트 (syn-events)

[AUIGrid Events 공식 문서](https://www.auisoft.net/documentation/auigrid/DataGrid/Events.html)에 정의된 이벤트명을 그대로 `syn-events`에 적으면 `AUIGrid.bind(gridID, 이벤트명, ...)`로 자동 연결됩니다. 핸들러 이름은 `{elID}_{이벤트명}` 규칙입니다. 아래는 실무에서 자주 쓰는 이벤트와, `$auigrid`가 내부적으로 이름을 바꿔 매핑해 주는 특수 케이스입니다.

| syn-events에 적는 이름 | 실제 동작 | 핸들러 시그니처 |
|---|---|---|
| `afterSelectionEnd` | 내부적으로 AUIGrid의 `selectionChange` 이벤트에 연결됨(TreeView 등 다른 컨트롤과 이름을 통일하기 위한 배려) | `(elID, rowIndex, columnIndex, dataField, value, editable, item)` |
| `cellEditEndBefore` | 항상 자동으로 바인딩됨(드롭다운/코드헬프 컬럼의 연동 로직이 내부에 포함) — 반환값이 있으면 그 값이 최종 입력값이 됨 | `(elID, evt)` → 반환값(선택) |
| `cellEditEnd` | 항상 자동으로 바인딩됨. 이 이벤트가 있으면 `afterChange(elID, rowIndex, columnIndex, dataField, oldValue, newValue, item)`도 함께 호출됨 | `(elID, evt)` |
| `afterChange` | `cellEditEnd` 발생 시 함께 호출(별도 bind 불필요, `syn-events`에 `afterChange`만 추가하면 됨) | `(elID, rowIndex, columnIndex, dataField, oldValue, newValue, item)` |
| `clipboardPaste` | `syn-events`에 있으면 `pasteBegin`에 자동 연결되어, 반환값으로 붙여넣기 데이터를 가공하거나 취소(`false`) 가능 | `(elID, clipboardData)` → 가공된 배열 또는 `false` |
| `cellEditBegin` | `button` 타입 컬럼의 아이콘 클릭 허용 여부를 결정 | `(evt)` → boolean |
| `cellButtonClick` | `button` 타입 컬럼 아이콘 클릭 시 | `(elID, rowIndex, columnIndex, dataField, item)` |
| `contextMenu` | 그리드 우클릭 시 | AUIGrid 원본 이벤트 객체 |
| `vScrollChange` / `hScrollChange` | 스크롤 변경 시 | AUIGrid 원본 이벤트 객체 |
| 그 외 모든 AUIGrid 이벤트(`sorting`, `rowExpand`, `rowCollapse`, `filtering`, `columnResize` 등) | `syn-events`에 이름만 추가하면 그대로 `AUIGrid.bind`로 연결됨 | AUIGrid 공식 문서의 콜백 시그니처 그대로 |

핸들러 등록 예:

```js
let $samplePage = {
    event: {
        grdGrid1_afterSelectionEnd(elID, rowIndex, columnIndex, dataField, value) {
            syn.$l.eventLog('grdGrid1_afterSelectionEnd', '{0},{1},{2}'.format(rowIndex, columnIndex, dataField));
        },
        grdGrid1_cellEditEnd(elID, evt) {
            syn.$l.eventLog('grdGrid1_cellEditEnd', JSON.stringify(evt.item));
        }
    }
}
```

---

## 참고

- 컬럼 정의 방식: `columns` 배열의 각 원소가 `[dataField, header, width, isHidden, columnType, readOnly, align, belongID, options]` 튜플입니다. [WebGrid의 `$grid`](../WebGrid/API.md)와 겉모습이 비슷해 보이지만 인덱스 순서가 다르므로(특히 8번째가 `validators`가 아니라 `options`) 그대로 복사해서 쓰면 안 됩니다.
- CRUD 상태 플래그(`Flag`): 행 데이터에 `Flag` 컬럼(R=조회/C=생성/U=수정/D=삭제/S=고정)을 유지하며, `getValue`가 이 플래그를 기준으로 "변경된 행만" 추려서 서버 전송용 배열을 만듭니다.
- `metaColumns`: `getValue`/`setValue`/`getUpdateData` 호출 시 넘기는 `{ 컬럼명: { fieldID, dataType } }` 형태의 매핑 객체입니다.

### 관련 문서

- [README.md](README.md) — 빠른 시작 가이드
- 다른 엔진 API: [WebGrid ($grid)](../WebGrid/API.md), [AUIPivot](../AUIPivot/API.md)
- AUIGrid 공식 문서: https://www.auisoft.net/documentation/auigrid/
- [CodePicker](../CodePicker/README.md) — `$auigrid`의 `codehelp` 컬럼 타입과 함께 쓰이는 코드도움 팝업 컨트롤
- [DataSource](../DataSource/README.md) — `dropdown`/`codehelp` 컬럼의 코드 목록을 채워주는 공통 데이터 소스 컨트롤
