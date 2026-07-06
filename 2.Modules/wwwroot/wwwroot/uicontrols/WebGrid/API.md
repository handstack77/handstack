# WebGrid API 참조

`WebGrid` 폴더에는 서로 다른 4개의 그리드 엔진이 들어 있습니다. 어느 엔진을 쓰고 있는지에 따라 옵션/메서드/이벤트 이름이 완전히 다르므로, 아래 목차에서 해당 엔진 섹션을 찾아 참고하세요.

- [$grid (WebGrid.js — Handsontable 기반)](#grid-webgridjs--handsontable-기반)
- [$auigrid (AUIGrid.js — AUIGrid 기반, 실무 주력 엔진)](#auigrid-auigridjs--auigrid-기반-실무-주력-엔진)
- [$jqgrid (jqGrid.js — jQuery jqGrid 기반, 레거시)](#jqgrid-jqgridjs--jquery-jqgrid-기반-레거시)
- [$auipivot (AUIPivot.js — 피벗 테이블, 레거시)](#auipivot-auipivotjs--피벗-테이블-레거시)
- [참고](#참고)

---

## $grid (WebGrid.js — Handsontable 기반)

싱글턴 객체: `syn.uicontrols.$grid`
소스 파일: `wwwroot/uicontrols/WebGrid/WebGrid.js`, `wwwroot/uicontrols/WebGrid/WebGrid.css`
내부 라이브러리: [Handsontable](https://handsontable.com/docs/) (`licenseKey: 'non-commercial-and-evaluation'`로 기본 제공)

### 마크업

```html
<syn_grid id="grdGrid" syn-options="{
    autoColumnSize: true,
    isContainFilterHeader: true,
    dropdownMenu: true,
    autoInsertRow: true,
    keyLockedColumns: ['PersonID'],
    columns: [
        ['PersonID', '사용자ID', 200, false, 'button', false, 'center'],
        ['UserName', '사용자', 200, false, 'safehtml', false, 'left'],
        ['MaritalStatus', '혼인여부', 200, false, { columnType: 'checkbox2', isSelectAll: true }, false, 'center'],
        ['CreateDateTime', '입력일자', 200, false, 'date', false, 'left']
    ]
}" syn-events="['afterSelectionEnd', 'beforeKeyDown', 'afterCreateRow']" style="width: 960px;"></syn_grid>
```

- `id`는 페이지 내에서 유일해야 하며 `syn.uicontrols.$grid`의 각 메서드에서 `elID`로 사용됩니다.
- `controlLoad` 실행 시 원래 태그는 `{elID}_hidden`으로 이름이 바뀌고, 실제 Handsontable 인스턴스가 그려질 컨테이너가 새로 삽입됩니다.
- 첫 번째 컬럼(`Flag`)은 CRUD 상태(R/C/U/D/S)를 담는 내부 관리용 컬럼으로, 지정하지 않아도 자동으로 맨 앞에 추가되고 기본적으로 숨김 처리됩니다(`hiddenColumns.columns: [0]`).

### 컬럼 정의 튜플 (`columns` 배열의 각 원소)

인덱스 순서대로 다음 값을 가집니다.

| 인덱스 | 이름 | 설명 |
|---|---|---|
| 0 | `data` | 데이터 필드명(컬럼ID) |
| 1 | `columnName`(헤더) | 컬럼 헤더 텍스트 |
| 2 | `width` | 컬럼 너비(px) |
| 3 | `isHidden` | 컬럼 숨김 여부 |
| 4 | `columnType` | `'text'` / `'numeric'` / `'date'` / `'time'` / `'checkbox'` / `'checkbox2'` / `'safehtml'` / `'button'` / `'dropdown'` / `'codehelp'` / `'autocomplete'` 등 문자열, 또는 `{ columnType: '...', ...옵션 }` 객체 형태(드롭다운/코드헬프처럼 추가 옵션이 필요할 때는 반드시 객체 형태 사용) |
| 5 | `readOnly` | 편집 불가 여부 |
| 6 | `alignConstants` | 정렬(`'left'`/`'center'`/`'right'`) — 내부적으로 `ht{Capitalize}` 클래스로 변환 |
| 7 | `belongID` | 이 컬럼이 특정 값(코드)에서만 보이도록 제한할 때 사용하는 소속 코드(문자열 또는 배열) |
| 8 | `validators` | `['require', 'unique']`처럼 컬럼 유효성 검사 규칙 배열 |
| 9 | `options` | 그 외 세부 옵션 객체(`placeholder`, `sorting`, `dataSourceID`, `codeColumnID` 등) |

### Options (defaultHotSettings)

| 속성 | 기본값 | 설명 |
|---|---|---|
| `licenseKey` | `'non-commercial-and-evaluation'` | Handsontable 라이선스 키 |
| `data` | `[]` | 초기 데이터(보통 `setValue`/`loadData`로 채움) |
| `colWidths` | `120` | 기본 컬럼 너비 |
| `rowHeights` | `31` | 행 높이 |
| `rowHeaders` | `true` | 행 번호 헤더 표시 |
| `copyPaste` | `true` | 복사/붙여넣기 허용 (`beforePaste`는 기본적으로 붙여넣기를 막도록 재정의되어 있음에 주의) |
| `autoColumnSize` | `false` | 컬럼 너비 자동 계산 |
| `stretchH` | `'none'` | 가로 늘림 모드(`'none'`/`'last'`/`'all'`) |
| `undo` | `false` | 실행취소(Ctrl+Z) 사용 여부 |
| `manualColumnResize` | `true` | 컬럼 너비 수동 조절 |
| `manualColumnMove` | `false` | 컬럼 순서 드래그 이동 |
| `autoInsertRow` | `false` | 마지막 셀에서 Tab/Enter 시 새 행 자동 삽입 |
| `outsideClickDeselects` | `true` | 그리드 밖 클릭 시 선택 해제 |
| `selectionMode` | `'range'` | 셀 선택 모드 |
| `columnSorting` | `true` | 헤더 클릭 정렬 허용 |
| `dropdownMenu` | `false` | `true`로 두면 필터 드롭다운 메뉴 세트(`filter_by_condition` 등)가 자동 구성됨 |
| `filters` | `true` | 컬럼 필터 플러그인 사용 |
| `isContainFilterHeader` | `false` | 헤더 아래에 텍스트 필터 입력창을 추가로 표시 |
| `fillHandle` | `false` | 셀 우측 하단 드래그 채우기 핸들 |
| `contextMenu` | 컬럼 숨김/표시/선택 메뉴 포함 객체 | 우클릭 컨텍스트 메뉴 구성 |
| `hiddenColumns` | `{ columns: [0], indicators: false }` | 기본적으로 0번(Flag) 컬럼 숨김 |
| `deleteKeyColumns` | `[]` | Delete 키로 값을 지울 수 없게 제외할 컬럼 |
| `keyLockedColumns` | `[]` | 신규 행이 아닌 경우(Flag가 'C'가 아닌 경우) 편집을 막을 컬럼(PK 컬럼 등) |
| `summarys` | `[]` | 하단 합계행 구성(`renderSummary`/`refreshSummary`가 사용) |
| `exportColumns` | `[]` | CSV/엑셀 내보내기에서 제외할 컬럼 |
| `transactConfig` / `triggerConfig` | `null` | syn.uicontrols 공통 트랜잭션/트리거 연동 옵션 |

### 메서드

`syn.uicontrols.$grid.<메서드명>(...)` 형태로 호출합니다. (전체 목록은 `WebGrid.js` 참고, 아래는 실무에서 자주 쓰는 메서드 위주)

| 메서드 | 설명 |
|---|---|
| `getValue(elID, requestType, metaColumns)` | 변경분(`requestType='Row'`: 현재 행만 / `'List'`: 추가·수정·삭제된 전체 행)을 `metaColumns` 매핑에 따라 서비스 전송용 배열로 변환해서 반환 |
| `setValue(elID, value, metaColumns)` | 원본 배열 데이터를 그리드에 채움(Flag는 자동으로 `'R'`) |
| `clear(elID, isControlLoad)` | 그리드 데이터를 비움 |
| `loadData(elID, objectData, callback)` | 데이터 바인딩(내부적으로 `setValue`가 호출) |
| `getUpdateData(elID, requestType, metaColumns)` | `getValue`가 내부적으로 사용하는 원시 변경분 조회 |
| `isUpdateData(elID)` | 데이터 바인딩 이후 변경 여부(boolean) |
| `insertRow(elID, setting, callback)` | 행 추가. `setting = { index, amount, values }` |
| `removeRow(elID, focusColumnIndex, rowIndex, callback)` | 행 삭제(Soft delete: Flag를 `'D'`로 표시하거나 신규 행이면 완전 제거) |
| `getFlag(elID, row)` / `setFlag(elID, row, flagValue)` | 행의 CRUD 상태(R/C/U/D/S) 조회/설정 |
| `getDataAtCell(elID, row, col)` / `setDataAtCell(elID, row, col, value, source)` | 셀 값 조회/설정 |
| `getDataAtRow(elID, row)` / `setDataAtRow(elID, values)` | 행 전체 값 조회/설정 |
| `getDataAtCol(elID, col)` / `getSourceDataAtCol(elID, col)` | 열 데이터 조회 |
| `getSourceDataAtRow(elID, row)` | 원본(가공 전) 행 데이터 조회 |
| `getCellMeta(elID, row, col)` / `setCellMeta(elID, row, col, key, value)` | 셀 메타 정보 조회/설정 |
| `getSettings(elID)` / `updateSettings(elID, settings, isDataClear)` | 그리드 전체 설정 조회/갱신 |
| `getGridControl(elID)` | Handsontable 인스턴스 원본 반환(고급 제어 시 사용) |
| `countRows(elID, isIncludeHidden)` / `countCols(elID)` | 행/열 개수 |
| `getActiveRowIndex(elID)` / `getActiveColIndex(elID)` | 현재 선택된 행/열 인덱스 |
| `selectCell(elID, row, column, endRow, endColumn, scrollToCell, changeListener)` | 셀 선택 |
| `getSelected(elID)` | 현재 선택 범위 조회 |
| `propToCol(elID, columnName)` / `colToProp(elID, col)` | 컬럼ID ↔ 컬럼 인덱스 변환 |
| `visibleColumns(elID, columns, isShow)` / `unHiddenColumns(elID)` | 컬럼 숨김/표시 |
| `visibleRows(elID, rows, isShow)` / `unHiddenRows(elID)` | 행 숨김/표시 |
| `addCondition(elID, col, name, args)` / `removeCondition(elID, col)` / `clearConditions(elID)` | 필터 조건 추가/삭제/초기화 |
| `merge(elID, startRow, startColumn, endRow, endColumn)` / `unmerge(...)` | 셀 병합/병합 해제 |
| `exportFile(elID, options)` / `exportAsString(elID, options)` / `importFile(elID, callback)` | CSV/엑셀 내보내기·가져오기 |
| `validateColumns(elID, columns, callback)` / `validateRows(elID, rows, callback)` | 유효성 검사 |
| `checkEditValue(elID)` / `checkEmptyValueCol(elID, column, checkValue)` 등 | 검증 헬퍼 |
| `render(elID)` | 강제 리렌더링 |
| `refreshSummary(elID)` | 하단 합계행 재계산 |
| `setControlSize(elID, size)` | 그리드 크기 재조정 |

### 이벤트 (syn-events)

`$grid`는 등록 시점에 `Handsontable.hooks.getRegistered()`로 Handsontable의 모든 훅 이름을 수집해 두므로, Handsontable 훅 이름은 그대로 `syn-events`에 사용할 수 있습니다. 아래는 `$grid`가 내부적으로 항상 감시하는 기본 훅(CRUD Flag 처리에 필요)과 자주 쓰이는 훅입니다. 핸들러 이름은 `{elID}_{훅이름}` 규칙을 따릅니다.

| 이벤트명 | 발생 시점 |
|---|---|
| `afterChange` | 셀 값이 바뀐 뒤(항상 내부적으로 바인딩되어 Flag 갱신에 사용됨) |
| `afterCreateRow` | 행이 추가된 뒤 |
| `afterRemoveRow` | 행이 삭제된 뒤 |
| `afterSelectionEnd` | 셀 선택이 끝났을 때 `(row, column, row2, column2, selectionLayerLevel)` |
| `beforeKeyDown` | 키 입력 직전 |
| `beforeOnCellMouseDown` | 셀 마우스 다운 직전 |
| `afterOnCellDoubleClick` | 셀 더블클릭 시(내부적으로 더블클릭도 `afterSelectionEnd`류 처리에 합류) |
| 그 외 Handsontable 표준 훅 전체 | `afterColumnSort`, `afterGetColHeader`, `beforeColumnSort` 등 [Handsontable Hooks 문서](https://handsontable.com/docs/javascript-data-grid/api/hooks/) 참고 |

컨트롤 자체가 발생시키는 커스텀 이벤트(핸들러가 있으면 자동 호출):

| 이벤트명 | 설명 |
|---|---|
| `{elID}_applyCells(elID, row, column, prop)` | 셀 렌더링 시 커스텀 `cellProperties`를 반환할 수 있는 훅 |
| `{elID}_cellButtonClick(elID, row, column, prop, value)` | `button` 타입 컬럼 클릭 |
| `{elID}_cellRadioClick(elID, row, column, prop, value)` | 라디오 타입 컬럼 클릭 |
| `{elID}_customSummary(elID, columnID, col, columnData)` | 합계행에서 컬럼별 커스텀 요약값을 계산할 때 |
| `{elID}_selectAllCheck(elID, col, checked)` | 체크박스 컬럼 전체 선택/해제 시 |
| `{elID}_afterHiddenColumns` / `{elID}_afterUnHiddenColumns` / `{elID}_afterVisibleColumns` | 컨텍스트 메뉴로 컬럼 숨김/표시를 조작한 뒤 |

핸들러 등록 예:

```js
let $samplePage = {
    event: {
        grdGrid_afterSelectionEnd(row, column, row2, column2, selectionLayerLevel) {
            syn.$l.eventLog('grdGrid_afterSelectionEnd', '{0},{1}'.format(row, column));
        },
        grdGrid_afterCreateRow() {
            syn.uicontrols.$grid.setDataAtCell('grdGrid', arguments[0], 'UseYN', true);
        }
    }
}
```

---

## $auigrid (AUIGrid.js — AUIGrid 기반, 실무 주력 엔진)

싱글턴 객체: `syn.uicontrols.$auigrid`
소스 파일: `wwwroot/uicontrols/WebGrid/AUIGrid.js`, `wwwroot/uicontrols/WebGrid/AUIGrid.css`
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

## $jqgrid (jqGrid.js — jQuery jqGrid 기반, 레거시)

싱글턴 객체: `syn.uicontrols.$jqgrid`
소스 파일: `wwwroot/uicontrols/WebGrid/jqGrid.js`, `wwwroot/uicontrols/WebGrid/jqGrid.css`
내부 라이브러리: jQuery jqGrid(트라이랜드 jqGrid 계열). 이 저장소에는 jqGrid/jQuery UI 벤더 파일 자체가 포함되어 있지 않으므로, 별도로 확보해서 배치한 뒤 경로를 맞춰야 합니다.

`syn.loader.js`에 자동주입 케이스가 없어 마크업은 `<syn_jqgrid>` 커스텀 태그가 아니라 일반 `<table>` 요소에 `controlLoad`를 직접 호출하는 방식을 사용합니다(예제 참고).

### 마크업 / 초기화

```html
<table id="grdLegacy"></table>
```

```js
syn.uicontrols.$jqgrid.controlLoad('grdLegacy', {
    caption: '레거시 그리드',
    gridWidth: 600,
    gridHeight: '300px',
    rowNumbers: true,
    colModels: [
        { name: 'ProdID', label: '제품코드', width: 120, key: true, edittype: 'text' },
        { name: 'ProdName', label: '제품명', width: 200, edittype: 'text' }
    ]
});
```

- `controlLoad(elID, setting)`은 대상 요소를 `{elID}_hidden`으로 바꾸고, 실제 `<table id="elID">`를 새로 만든 뒤 내부적으로 `jQuery.jqGrid({...})`를 호출합니다.
- 이벤트 핸들러(`{elID}_onSelectRow` 등)가 `window[pageScript].event`에 있으면 `controlLoad` 시점에 jqGrid의 해당 콜백 옵션에 그대로 연결됩니다(별도 `syn-events` 선언 없이, 이름만 맞으면 자동 연결).

### Options (gridOptions)

| 속성 | 기본값 | 설명 |
|---|---|---|
| `caption` | `null` | 그리드 제목 |
| `autoWidth` | `true` | 컨테이너에 맞춰 너비 자동 조정 |
| `gridWidth` / `gridHeight` | `250` / `'200px'` | 그리드 크기 |
| `multiSelect` / `multiSelectWidth` | `false` / `20` | 행 다중 선택 체크박스 컬럼 |
| `dataType` | `'json'` | jqGrid 데이터 타입(내부적으로 `datatype: 'local'`, `editurl: 'clientArray'`로 동작하여 클라이언트 메모리 그리드로 사용) |
| `rowNumbers` | `true` | 행 번호 컬럼 |
| `sortAble` / `sortName` / `sortOrder` | `true` / `''` / `'asc'` | 정렬 옵션 |
| `viewRecords` | `true` | 하단 레코드 수 표시 |
| `frozenColumns` | `false` | 컬럼 고정 |
| `colModels` | 예시 3컬럼 배열 | jqGrid의 `colModel`에 대응. 각 항목은 `name`/`label`/`align`/`key`/`width`/`edittype`/`frozen`/`hidden`/`resizable`/`sortable`/`sorttype`/`dataedittype` 등을 가짐 |

### 메서드

`syn.uicontrols.$jqgrid.<메서드명>(eid, ...)` 형태로 호출합니다(다른 세 엔진과 달리 첫 인자명이 `elID`가 아니라 `eid`인 경우가 많음에 유의).

| 메서드 | 설명 |
|---|---|
| `pageBinding(eid, jsonObject, viewCount, isReadOnly)` | 페이징 데이터 바인딩 |
| `dataBinding(eid, jsonObject, isAdd, isReadOnly)` | 데이터 바인딩(전체 갱신 또는 추가) |
| `bulkBinding(eid, jsonObject, isReadOnly)` | 대량 데이터 바인딩 |
| `addRow(eid, rowData, position, srcrowid)` | 행 추가 |
| `deleteRow(eid, rowid)` / `deleteSelectedRow(eid)` | 행 삭제(개별/선택된 행) |
| `hiddenRow(eid, rowid)` / `restoreHideRow(eid, rowid)` | 행 숨김 처리/복원(소프트 삭제) |
| `editRow(eid, rowid)` / `saveRow(eid, rowid)` / `restoreRow(eid, rowid)` | 인라인 편집 시작/저장/취소 |
| `updateRow(eid, rowid, jsonObject)` | 행 값 갱신 |
| `updateRowStatus(eid, rowid, statusFlag)` / `updateRowsStatus(eid, statusFlag)` | CRUD 상태 플래그 갱신 |
| `getRowData(eid, rowid)` | 행 데이터 조회 |
| `getCellText(eid, rowid, colid)` / `getCellValue(eid, rowid, colid)` | 셀 텍스트/값 조회 |
| `setCellText(eid, rowid, colid, value)` / `setCellValue(eid, rowid, colid, value)` | 셀 값 설정 |
| `getRowID(eid, rowIndex)` / `getRowIndex(eid, rowID)` | 행ID ↔ 행 인덱스 변환 |
| `getRowCount(eid)` / `getVisibleRowCount(eid)` | 행 개수 |
| `getFocusRowID(eid)` / `focusRow(eid, rowid)` / `resetFocusRow(eid)` | 포커스 행 제어 |
| `colHidden(eid, colid, isHidden)` | 컬럼 숨김/표시 |
| `getColumnCollection(eid)` / `getColumn(eid, colid)` / `getColumnID(eid, colIndex)` | 컬럼 정보(`colModel`) 조회 |
| `setHeaderText(eid, colName, value)` | 헤더 텍스트 변경 |
| `setControlSize(eid, width, shrink, height)` / `setColumnWidth(eid, colIndex, colWidth)` | 크기 조정 |
| `dataClear(eid)` | 데이터 초기화 |
| `getUpdateDatas(eid, columns)` / `getUpdateDatasByXML(eid, columns)` / `getUpdateRowID(eid, dataClass)` / `getAllRowStatus(eid)` | 변경분 조회 |
| `gridExportJson(eid)` / `gridImportJson(eid, jsonString)` | JSON 내보내기/가져오기 |
| `setMergeHeader(eid, useColSpan, headers)` | 헤더 병합 |
| `getCellStyle` / `getRowStyle` / `setCellColor` / `setRowColor` / `setColumnsColor` | 스타일 조회/설정 |
| `clear(elID, isControlLoad)` | (공통 인터페이스) 데이터 초기화 |

### 이벤트

jqGrid는 `syn-events` 선언 배열을 사용하지 않고, `window[pageScript].event`에 정해진 이름의 함수가 존재하면 `controlLoad` 시점에 자동으로 jqGrid 콜백 옵션에 연결됩니다. 사용 가능한 이름:

| 이벤트명 | 발생 시점 |
|---|---|
| `{elID}_onSelectRow` | 행 선택 시 |
| `{elID}_onSelectAll` | 전체 선택(다중 선택 모드) 시 |
| `{elID}_ondblClickRow` | 행 더블클릭 시 |
| `{elID}_onRightClickRow` | 행 우클릭 시 |
| `{elID}_onSortCol` / `{elID}_onSortingCol` | 정렬 컬럼 클릭 전/후 |
| `{elID}_onHeaderClick` | 헤더 클릭 시 |
| `{elID}_beforeSelectRow` | 행 선택 직전 |
| `{elID}_resizeStart` / `{elID}_resizeStop` | 컬럼 리사이즈 시작/종료 |
| `{elID}_beforeNavigation` / `{elID}_afterNavigation` | 페이징 이동 전/후 |
| `{elID}_beforeUpdateRow` | 행 갱신 직전 |
| `{elID}_onCodePickerCallback` | 코드피커 포매터 콜백 응답 시 |

핸들러 등록 예:

```js
let $samplePage = {
    event: {
        grdLegacy_onSelectRow(rowid, status) {
            syn.$l.eventLog('grdLegacy_onSelectRow', rowid);
        },
        grdLegacy_ondblClickRow(rowid, iRow, iCol, e) {
            syn.$l.eventLog('grdLegacy_ondblClickRow', rowid);
        }
    }
}
```

---

## $auipivot (AUIPivot.js — 피벗 테이블, 레거시)

싱글턴 객체: `syn.uicontrols.$auipivot`
소스 파일: `wwwroot/uicontrols/WebGrid/AUIPivot.js`, `wwwroot/uicontrols/WebGrid/AUIPivot.css`
내부 라이브러리: [AUIPivot](https://www.auisoft.net/documentation/auipivot/)(AUIGrid와 같은 벤더의 피벗 전용 제품, `/lib/auigrid/dist/AUIGrid.js` 필요)

`syn.loader.js`에 자동주입 케이스가 없으므로 `pageLoadFiles` 훅으로 AUIGrid 벤더 스크립트를 직접 로드해야 합니다.

### 마크업

```html
<syn_auipivot id="pvtSales" syn-options="{
    height: 400,
    layout: {
        rowFields: ['Region', 'Model'],
        columnFields: ['DateQuarter'],
        valueFields: [{ dataField: 'Total', operation: 'SUM', formatString: '#,##0' }],
        fieldAlias: { Region: '판매 지역', Model: '상품명', Total: '매출액', DateQuarter: '분기' }
    }
}" syn-events="['cellClick', 'sorting']"></syn_auipivot>
```

- `controlLoad` 시 `layout`(`rowFields`/`columnFields`/`valueFields`/`filterFields`/`fieldAlias`/`dateTypeField`)을 읽어 `AUIPivot.setRowFields`/`setColumnFields`/`setValueFields`/`setFilterFields`/`setFieldAlias`/`setDateTypeField`를 순서대로 호출해 초기 배치를 구성합니다.
- `layout`을 지정하지 않으면 소스에 내장된 예시 레이아웃(Region/Name/Model × DateQuarter/DateMonth × Total/Count 합계)이 기본값으로 사용됩니다.

### Options (pivotOptions)

| 속성 | 기본값 | 설명 |
|---|---|---|
| `layoutType` | `'tree'` | 행 레이블 표시 방식 |
| `showFooter` | `false` | 하단 합계 영역 |
| `showGrandTotalColumn` | `true` | 총합계 열 표시 |
| `showRowNumColumn` | `true` | 행 번호 컬럼 |
| `showSummaryColumn` / `showSummaryRow` | `true` | 요약 열/행 |
| `enableSorting` / `enableMultipleSorting` | `true` | 정렬/다중 정렬 허용 |
| `enableClipboard` | `true` | 클립보드 복사 |
| `useContextMenu` / `useContextHeaderMenu` | `false` | 컨텍스트 메뉴 |
| `useHeatmap` | `false` | 히트맵 색상 표시(`defaultHeatmapColors: ['#FFFFFF', '#4374D9']`) |
| `movableFieldPanel` / `resizableFieldPanel` | `true` | 필드 패널(행/열/값/필터 배치 UI) 이동/리사이즈 허용 |
| `defaultFormatString` | `'###0.#####'` | 값 필드 기본 표시 형식 |
| `headerHeight` / `rowHeight` / `footerHeight` | `24` / `24` / `30` | 크기 |
| `width` / `height` | `NaN`(자동) | 전체 크기 |

### 메서드

`syn.uicontrols.$auipivot.<메서드명>(elID, ...)` 형태로 호출합니다.

| 메서드 | 설명 |
|---|---|
| `getValue(elID, requestType, metaColumns)` / `setValue(elID, value)` | 공통 인터페이스(원본 소스 데이터 조회/설정) |
| `clear(elID, isControlLoad)` | 피벗 초기화 |
| `setRowFields(elID, fields)` / `setColumnFields(elID, fields)` / `setValueFields(elID, fields)` / `setFilterFields(elID, fields)` | 행/열/값/필터 필드 배치 |
| `getRowFields(elID)` / `getColumnFields(elID)` / `getValueFields(elID)` / `getFilterFields(elID)` | 현재 필드 배치 조회 |
| `setFieldAlias(elID, aliasObj)` / `getFieldAlias(elID)` | 필드 표시명(별칭) |
| `setDateTypeField(elID, dateField)` | 날짜 자동 분해(년/분기/월 등) 대상 필드 지정 |
| `setDisplayOrderRules(elID, rules)` / `getDisplayOrderRules(elID)` | 필드값 표시 순서 규칙 |
| `setSorting(elID, sortingInfo, onlyLastDepthSorting)` / `clearSortingAll(elID)` | 정렬 |
| `setFilterCache(elID, cache)` / `getFilterCache(elID)` / `clearFilterAll(elID)` | 필터 상태 |
| `setGridData(elID, data)` / `getSourceData(elID)` / `getPivotData(elID)` | 원본/피벗 데이터 조회·설정 |
| `getCellDetailList(elID, rowIndex, columnIndex)` / `getDimensionValues(elID, rowIndex, columnIndex)` | 특정 셀을 구성하는 원본 행 상세 조회 |
| `getFooterData(elID)` | 합계행 데이터 조회 |
| `expandAll(elID)` / `collapseAll(elID)` / `expandAllColumns(elID)` / `collapseAllColumns(elID)` / `showItemsOnDepth(elID, depth)` | 트리 펼치기/접기 |
| `exportFile(elID, options)` | 내보내기 |
| `resize(elID, width, height)` | 크기 재조정 |
| `showPivotPanel(elID)` / `hidePivotPanel(elID)` / `createPivotPanel(elID, panelPID)` / `destroyPivotPanel(elID)` | 필드 배치 패널 표시/숨김/생성/제거 |
| `setHeatmapColors(elID, dateField, operation, colors)` / `changeHeatmapColors(elID, dateField, operation, colors)` | 히트맵 색상 지정 |
| `bind(elID, type, func)` / `unbind(elID, type)` | 이벤트 수동 바인딩/해제(원본 `AUIPivot.bind`/`unbind` 래퍼) |
| `updatePivot(elID)` | 피벗 재계산/재렌더링 |

### 이벤트 (syn-events)

`syn-events` 배열에 아래 이름을 넣으면 `AUIPivot.bind(gridID, 이벤트명, ...)`로 자동 연결됩니다. 핸들러 이름은 `{elID}_{이벤트명}` 규칙입니다.

| 이벤트명 | 핸들러 시그니처 |
|---|---|
| `cellClick` | `(elID, rowIndex, columnIndex, dataField, value, item, type, headerText)` |
| `cellDoubleClick` | `(elID, rowIndex, columnIndex, dataField, value, item, type, headerText)` |
| `columnStateChange` | `(elID, property, dataField, headerText, depth, isBranch, oldValue, currentValue, type)` |
| `contextMenu` | `(elID, target, dataField, headerText, columnIndex, rowIndex, depth, item, pageX, pageY, type)` → 반환값으로 메뉴 항목 제어 가능 |
| `footerClick` / `footerDoubleClick` | `(elID, footerIndex, footerText, footerValue, pageX, pageY, type)` |
| `headerClick` | AUIPivot 원본 이벤트 객체 기반 |
| `hScrollChange` / `vScrollChange` | 스크롤 변경 시 |
| `pivotBegin` / `pivotComplete` | 피벗 재계산 시작/완료 시 |
| `pivotPanelHide` / `pivotPanelShow` | 필드 배치 패널 숨김/표시 시 |
| `sorting` | 정렬 변경 시 |
| `treeOpenChange` | 트리 노드 펼침/접힘 상태 변경 시 |

핸들러 등록 예:

```js
let $samplePage = {
    event: {
        pvtSales_cellClick(elID, rowIndex, columnIndex, dataField, value) {
            syn.$l.eventLog('pvtSales_cellClick', '{0}:{1}'.format(dataField, value));
        }
    }
}
```

---

## 참고

### 컬럼 정의 형식 비교

| 엔진 | 컬럼 정의 방식 |
|---|---|
| `$grid` | `columns` 배열의 각 원소가 `[data, header, width, isHidden, columnType, readOnly, align, belongID, validators, options]` 튜플 |
| `$auigrid` | `columns` 배열의 각 원소가 `[dataField, header, width, isHidden, columnType, readOnly, align, belongID, options]` 튜플 (인덱스 순서가 `$grid`와 다름에 주의 — 특히 8번째가 `validators`가 아니라 `options`) |
| `$jqgrid` | `colModels` 배열에 `{ name, label, width, edittype, ... }` 형태의 객체를 나열(jqGrid 원본 `colModel` 그대로) |
| `$auipivot` | 컬럼이 아니라 `layout.rowFields`/`columnFields`/`valueFields`/`filterFields` 배열에 필드명(또는 `{ dataField, operation, formatString }` 객체)을 나열 |

`$grid`와 `$auigrid`는 겉모습이 비슷해 보이지만 컬럼 튜플의 인덱스 순서가 다르므로 그대로 복사해서 쓰면 안 됩니다. 특히 8번째 인덱스가 `$grid`는 `validators`, `$auigrid`는 `options`라는 점이 가장 흔한 실수 포인트입니다.

### 4개 엔진 공통 concept

- CRUD 상태 플래그(`Flag`): 네 엔진 모두 내부적으로 행 데이터에 `Flag` 컬럼(R=조회/C=생성/U=수정/D=삭제/S=고정)을 유지하며, `getValue`(또는 `$jqgrid`의 `getUpdateDatas`)가 이 플래그를 기준으로 "변경된 행만" 추려서 서버 전송용 배열을 만듭니다.
- `elID`(컨트롤 id)를 키로 여러 그리드 인스턴스를 관리: 각 엔진은 `gridControls` 배열에 `{ id, gridID/hot, setting }` 형태로 등록해 두고, 모든 메서드는 첫 번째 인자로 받은 `elID`로 해당 인스턴스를 찾아 동작합니다.
- `syn.uicontrols.$xxx.controlLoad(elID, setting)`: 프레임워크가 `<syn_grid>`/`<syn_auigrid>`/`<syn_auipivot>` 태그를 파싱해 자동으로 호출하거나(로더 자동주입 엔진), `$jqgrid`처럼 페이지 스크립트에서 직접 호출합니다. 원래 마크업 요소는 항상 `{elID}_hidden`으로 이름이 바뀌고 `syn-options`에 최종 설정이 JSON으로 다시 기록됩니다.
- `metaColumns`: `getValue`/`setValue`/`getUpdateData` 호출 시 넘기는 `{ 컬럼명: { fieldID, dataType } }` 형태의 매핑 객체로, 그리드 내부 컬럼명과 서버로 보낼 필드명이 다르거나 타입 검증이 필요할 때 사용합니다. `WebGrid.js`/`AUIGrid.js`/`AUIPivot.js` 모두 동일한 패턴을 사용합니다.

### 관련 문서

- [README.md](README.md) — 엔진 선택 가이드와 빠른 시작
- AUIGrid 공식 문서: https://www.auisoft.net/documentation/auigrid/
- AUIPivot 공식 문서: https://www.auisoft.net/documentation/auipivot/
- Handsontable 공식 문서: https://handsontable.com/docs/
- jqGrid(free-jqgrid 계열) 문서: https://free-jqgrid.github.io/
- [CodePicker](../CodePicker/README.md) — `$auigrid`의 `codehelp` 컬럼 타입과 함께 쓰이는 코드도움 팝업 컨트롤
- [DataSource](../DataSource/README.md) — `dropdown`/`codehelp` 컬럼의 코드 목록을 채워주는 공통 데이터 소스 컨트롤
