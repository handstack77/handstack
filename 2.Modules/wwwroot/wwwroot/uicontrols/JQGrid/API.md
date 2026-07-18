# JQGrid API 참조 — $jqgrid (jqGrid.js)

이 폴더에는 jQuery jqGrid 기반의 `$jqgrid` 엔진만 있습니다. 다른 그리드 엔진 API는 각 폴더의 `API.md`를 참고하세요.

## $jqgrid (jqGrid.js — jQuery jqGrid 기반, 레거시)

싱글턴 객체: `syn.uicontrols.$jqgrid`
소스 파일: `wwwroot/uicontrols/JQGrid/jqGrid.js`, `wwwroot/uicontrols/JQGrid/jqGrid.css`
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

`syn.uicontrols.$jqgrid.<메서드명>(eid, ...)` 형태로 호출합니다(다른 엔진과 달리 첫 인자명이 `elID`가 아니라 `eid`인 경우가 많음에 유의).

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

## 참고

- 컬럼 정의 방식: `colModels` 배열에 `{ name, label, width, edittype, ... }` 형태의 객체를 나열합니다(jqGrid 원본 `colModel` 그대로).
- CRUD 상태 플래그: `getUpdateDatas`가 상태 플래그를 기준으로 "변경된 행만" 추려서 서버 전송용 배열을 만듭니다.

### 관련 문서

- [README.md](README.md) — 빠른 시작 가이드
- 다른 엔진 API: [WebGrid ($grid)](../WebGrid/API.md), [AUIGrid](../AUIGrid/API.md), [AUIPivot](../AUIPivot/API.md)
- jqGrid(free-jqgrid 계열) 문서: https://free-jqgrid.github.io/
