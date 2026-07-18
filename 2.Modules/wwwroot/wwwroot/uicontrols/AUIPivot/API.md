# AUIPivot API 참조 — $auipivot (AUIPivot.js)

이 폴더에는 AUIGrid 기반 피벗 테이블 `$auipivot` 엔진만 있습니다. 다른 그리드 엔진 API는 각 폴더의 `API.md`를 참고하세요.

## $auipivot (AUIPivot.js — 피벗 테이블, 레거시)

싱글턴 객체: `syn.uicontrols.$auipivot`
소스 파일: `wwwroot/uicontrols/AUIPivot/AUIPivot.js`, `wwwroot/uicontrols/AUIPivot/AUIPivot.css`
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

- 컬럼(필드) 정의 방식: 컬럼이 아니라 `layout.rowFields`/`columnFields`/`valueFields`/`filterFields` 배열에 필드명(또는 `{ dataField, operation, formatString }` 객체)을 나열합니다. [AUIGrid](../AUIGrid/API.md)/[WebGrid](../WebGrid/API.md)의 컬럼 튜플 방식과는 다릅니다.
- CRUD 상태 플래그(`Flag`): 다른 엔진과 동일하게 내부적으로 행 데이터에 `Flag` 컬럼을 유지합니다.

### 관련 문서

- [README.md](README.md) — 빠른 시작 가이드
- 다른 엔진 API: [WebGrid ($grid)](../WebGrid/API.md), [AUIGrid](../AUIGrid/API.md), [JQGrid](../JQGrid/API.md)
- AUIPivot 공식 문서: https://www.auisoft.net/documentation/auipivot/
