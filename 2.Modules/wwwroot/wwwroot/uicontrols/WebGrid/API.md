# WebGrid API 참조 — $grid (WebGrid.js)

이 폴더에는 Handsontable 기반의 `$grid` 엔진만 있습니다. 다른 그리드 엔진 API는 각 폴더의 `API.md`를 참고하세요.

- [$grid (WebGrid.js — Handsontable 기반)](#grid-webgridjs--handsontable-기반)
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

## 참고

- CRUD 상태 플래그(`Flag`): 행 데이터에 `Flag` 컬럼(R=조회/C=생성/U=수정/D=삭제/S=고정)을 유지하며, `getValue`가 이 플래그를 기준으로 "변경된 행만" 추려서 서버 전송용 배열을 만듭니다.
- `elID`(컨트롤 id)를 키로 여러 그리드 인스턴스를 관리: `gridControls` 배열에 `{ id, hot, setting }` 형태로 등록해 두고, 모든 메서드는 첫 번째 인자로 받은 `elID`로 해당 인스턴스를 찾아 동작합니다.
- `syn.uicontrols.$grid.controlLoad(elID, setting)`: 프레임워크가 `<syn_grid>` 태그를 파싱해 자동으로 호출합니다. 원래 마크업 요소는 항상 `{elID}_hidden`으로 이름이 바뀌고 `syn-options`에 최종 설정이 JSON으로 다시 기록됩니다.
- `metaColumns`: `getValue`/`setValue`/`getUpdateData` 호출 시 넘기는 `{ 컬럼명: { fieldID, dataType } }` 형태의 매핑 객체로, 그리드 내부 컬럼명과 서버로 보낼 필드명이 다르거나 타입 검증이 필요할 때 사용합니다. 다른 그리드 엔진(`AUIGrid.js`, `AUIPivot.js`)도 동일한 패턴을 사용합니다.

### 관련 문서

- [README.md](README.md) — 빠른 시작 가이드
- 다른 엔진 API: [AUIGrid](../AUIGrid/API.md), [AUIPivot](../AUIPivot/API.md), [JQGrid](../JQGrid/API.md)
- Handsontable 공식 문서: https://handsontable.com/docs/
- [CodePicker](../CodePicker/README.md) — 코드도움 팝업 컨트롤
- [DataSource](../DataSource/README.md) — `dropdown`/`codehelp` 컬럼의 코드 목록을 채워주는 공통 데이터 소스 컨트롤
