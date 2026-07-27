# `$chartjs` API

## Options

| 속성 | 기본값 | 설명 |
|---|---|---|
| `type` | `'line'` | Chart.js chart type |
| `data` / `options` / `plugins` | 빈 data / `{}` / `[]` | Chart.js 원형 config |
| `labelID` / `series` | `''` / `[]` | 기존 행 매핑. `series` 항목은 `columnID`, `label`과 dataset 옵션 사용 |
| `dataAdapter` | `null` | `(rows,metaColumns,currentConfig,control)` → config 또는 `{config,rowIndexMap,selectionResolver}` |
| `selectionResolver` | `null` | `(active,event,rows,chart,control)` → row index 또는 `{rowIndex,row}` |
| `selectionMode` | `'single'` | `'single'`, `'multiple'`, `'native'`, `'none'` |
| `selectionKey` | `null` | point data와 원본 행의 key를 연결 |
| `clearSelectionOnBlank` | `true` | 빈 영역 클릭 시 선택 해제 |
| `interactionMode` / `intersect` | `'nearest'` / `true` | 기본 interaction 옵션 |
| `autoResize` | `true` | `ResizeObserver` 기반 자동 resize |

`options.animation`을 지정하지 않으면 `false`(비활성)로 강제됩니다. 애니메이션이 필요하면 `setConfig`/`syn-options`에 `options.animation`을 명시적으로 전달하세요(`example/animations.html` 참고).

`scales.x.type: 'time'`을 쓰려면 번들된 moment.js용 date adapter가 필요합니다. `ChartJS.js`가 로드 시점에 Chart.js UMD와 moment.js가 모두 있으면 자체 등록하므로(별도 파일 없음), `syn.loader.js`의 `case 'chartjs'` 의존성 목록(Chart.js UMD, moment.js, `ChartJS.js` 순서)만 지키면 `<syn_chartjs>`를 쓰는 화면은 별도 조치가 필요 없습니다.

## 데이터와 선택

`setValue`는 `{}`를 1행으로 정규화합니다. `null`, `undefined`, `[]`는 데이터를 비우며 primitive나 객체가 아닌 배열 항목은 거부하고 현재 차트를 유지합니다.

우선순위는 `dataAdapter` → 기존 `labelID`/`series` 매핑 → meta-aware 추론입니다. 추론은 첫 문자열/날짜 컬럼(없으면 첫 컬럼)을 label로, 숫자 컬럼을 dataset으로 사용합니다. scatter/bubble처럼 `{x,y,r}`가 필요한 형식은 어댑터를 사용합니다.

선택 상세 구조:

```js
{
  series: { index, id, name, type },
  point: { dataIndex, dataIndexInside, dataType, name, value, data, color },
  yData,
  rowIndex,
  row
}
```

HandStack 선택 상태는 Row/List 반환과 이벤트만 관리하며 canvas에 테두리나 포커스를 그리지 않습니다. 시각적 활성 상태가 필요하면 개발자가 `setActiveElements`, 원형 hover option 또는 사용자 plugin을 명시적으로 사용합니다.

## Methods

| 메서드 | 설명 |
|---|---|
| `getControl(id)` / `getChartControl(id)` | HandStack wrapper 반환(기존 호환) |
| `getChartInstance(id)` | 실제 `Chart` 인스턴스 반환 |
| `setValue(id,value,meta)` | 객체/객체 배열을 반영. Promise 반환 |
| `getRawValue(id)` / `getChartData(id)` | 마지막 입력 행 / 현재 labels·datasets 복사본 |
| `getValue(id)` | single은 최근 선택 행 또는 `null`, multiple/native는 선택 행 배열 |
| `getValue(id,'Row'|'List',meta)` | 선택 원본 행을 HandStack transaction 형식으로 반환 |
| `getSelection(id)` / `getSelectedRows(id)` | 선택 상세 / 원본 행 조회 |
| `setSelection(id,indexOrDescriptorOrArray)` / `clearSelection(id)` | 선택 설정/해제 |
| `setConfig(id,config)` / `setData(id,data)` | type/data/options 갱신 |
| `update`, `render`, `reset`, `stop`, `setActiveElements` | Chart.js 인스턴스 제어 |
| `toggleDataVisibility`, `getDatasetMeta` | 데이터 가시성 및 dataset meta |
| `register`, `unregister` | 외부 plugin/controller/element/scale 등록 |
| `resize`, `setControlSize`, `showLoading`, `hideLoading` | 크기와 로딩 상태 |
| `clear`, `dispose`, `getDataURL`, `toImage`, `setLocale` | 수명주기·내보내기·locale |

metaColumns는 `{fieldID,dataType}`와 `{FieldID,DataType}`를 모두 허용합니다.

## Events

`syn-events`에는 `click`, `pointClick`, `pointHover`를 선언할 수 있습니다. HandStack 합성 이벤트는 `initialized`, `dataBound`, `selectionChange`, `resized`, `disposed`, `error`입니다.

```js
chtSales_selectionChange(elID, params, selections) { }
```

핸들러 인자는 `(elID, params, selections)`입니다. `options.onClick`과 `options.onHover` 원형 콜백도 함께 실행됩니다.
