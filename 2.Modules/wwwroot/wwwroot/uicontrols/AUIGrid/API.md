# AUIGrid API 참조 — $auigrid (AUIGrid.js)

이 폴더에는 AUIGrid 기반의 `$auigrid` 엔진만 있습니다. 다른 그리드 엔진 API는 각 폴더의 `API.md`를 참고하세요.

## $auigrid (AUIGrid.js — AUIGrid 기반, 실무 주력 엔진)

싱글턴 객체: `syn.uicontrols.$auigrid`
소스 파일: `wwwroot/uicontrols/AUIGrid/AUIGrid.js`, `wwwroot/uicontrols/AUIGrid/AUIGrid.css`
내부 라이브러리: [AUIGrid](https://www.auisoft.net/documentation/auigrid/) (상용, `/lib/auigrid/dist/AUIGrid.js` + `AUIGridLicense.js`)

qcn.groupware 실사용 기준 300회 이상 쓰이는, 이 저장소의 실무 표준 그리드 엔진입니다.

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
| `setFilter(elID, dataField, func)` | 커스텀 필터 함수 지정 |
| `setSorting(elID, sortInfos)` / `clearSorting(elID)` | 정렬 적용/해제 |
| `setCellMerge(elID, isMerged)` / `getMergeItems` / `hasMerge` | 셀 병합 |
| `setFixedColumnCount` / `setFixedRowCount` | 고정 열/행 개수 변경 |
| `setFooter(elID, footerLayout, isChangeFooter)` | 하단 합계 영역 구성 |
| `exportToObject` / `exportAsString(elID, options)` / `exportFile(elID, options)` / `importFile(elID, callback)` | 내보내기/가져오기 |
| `checkEditValue(elID)` / `checkUniqueValueCol` / `checkValueCountCol` / `checkEmptyValueCol(s)` | 유효성 검사 |
| `validateGridData(elID, dataField)` | 컬럼 데이터 타입 기준 유효성 검사 |
| `getGridControl` 대응: `getGridID(elID)` | 내부 AUIGrid ID(`'#elID'`) 반환 — 이후 `AUIGrid.*` 원본 API를 직접 호출할 때 사용 |
| `setControlSize(elID, size)` / `setColumnWidth` / `setColumnWidths` / `getColumnWidth(s)` | 크기 조정 |
| `render(elID)` | 강제 리렌더링 |
| `search(elID, dataField, term, options)` / `searchAll(elID, term, options)` | 텍스트 검색/하이라이트 |

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
- 다른 엔진 API: [WebGrid ($grid)](../WebGrid/API.md), [AUIPivot](../AUIPivot/API.md), [JQGrid](../JQGrid/API.md)
- AUIGrid 공식 문서: https://www.auisoft.net/documentation/auigrid/
- [CodePicker](../CodePicker/README.md) — `$auigrid`의 `codehelp` 컬럼 타입과 함께 쓰이는 코드도움 팝업 컨트롤
- [DataSource](../DataSource/README.md) — `dropdown`/`codehelp` 컬럼의 코드 목록을 채워주는 공통 데이터 소스 컨트롤
