# `$chart` API

## Options

| 속성 | 기본값 | 설명 |
|---|---|---|
| `option` | column 기본 옵션 | Highcharts option 전체. 기존 호환성을 위해 최상위 `chart`, `series`, `xAxis` 등도 허용 |
| `constructorType` | `'chart'` | `'chart'`, `'stockChart'`, `'mapChart'`, `'ganttChart'` |
| `modules` | `[]` | 먼저 로드할 로컬 모듈 이름 배열 |
| `callback` | `null` | Highcharts 생성자의 세 번째 callback 또는 전역 함수 경로 |
| `dataMode` | `'auto'` | `'auto'`는 기존 `[{name,data}]`를 series로 인식, `'rows'`는 항상 행 데이터로 처리 |
| `dataAdapter` | `null` | `(rows, metaColumns, currentOption, control)` → option 또는 `{option,rowIndexMap,selectionResolver}` |
| `selectionResolver` | `null` | `(point,event,rows,chart,control)` → row index 또는 `{rowIndex,row}` |
| `selectionMode` | `'single'` | `'single'`, `'multiple'`, `'native'`, `'none'` |
| `selectionKey` | `null` | point option과 원본 행의 key를 연결 |
| `clearSelectionOnBlank` | `true` | 빈 plot 영역 클릭 시 선택 해제 |
| `autoResize` | `true` | `ResizeObserver` 기반 `reflow()` |

`option`은 Highcharts 원형 옵션입니다. `option` 바깥에 선언한 Highcharts 최상위 옵션도 HandStack 설정 키만 제외하고 제한 없이 병합합니다. 따라서 `colorAxis`, `mapView`, `data`, `responsive`처럼 새로 추가되는 최상위 옵션을 별도 whitelist 수정 없이 사용할 수 있습니다.

core series와 로컬 `highcharts-more`, 3D, Stock, Maps, Gantt, annotations, boost, drilldown, exporting 및 개별 series 모듈을 제한하지 않습니다. series type, `plotOptions`, drilldown/navigator series, 기술 지표, constructor를 `renderChart`, `setValue`, `update`, `addSeries`, `updateSeries`에서 발견하면 필요한 모듈을 순서대로 지연 로드합니다. Boost는 다른 series 모듈 뒤에 로드하고 Stock Tools는 지표·주석·drag panes·fullscreen과 전용 CSS를 먼저 로드합니다.

## 공식 데모 option 적용

공식 데모의 `Highcharts.chart`, `Highcharts.stockChart`, `Highcharts.mapChart`, `Highcharts.ganttChart` 호출에서 container 인자를 제거하고 아래 descriptor로 옮깁니다.

```js
syn.uicontrols.$chart.renderChart('chtDemo', {
    constructorType: 'stockChart',
    modules: [],
    rows: gridRows,
    option: {
        rangeSelector: { selected: 1 },
        series: [{ type: 'ohlc', id: 'price', data: ohlcData },
                 { type: 'sma', linkedTo: 'price' }]
    },
    selectionResolver(point, event, rows) {
        return rows.findIndex(row => row.DATE === point.x);
    }
});
```

`renderChart`는 생성자가 달라지면 기존 인스턴스를 안전하게 파기하고 모듈을 준비한 뒤 다시 생성합니다. `rows`는 선택 Row/List의 원본이며 Highcharts에는 `option.series`를 그대로 전달합니다. 공식 데모의 비동기 `fetch` 결과도 Promise 완료 후 descriptor의 `option` 또는 `setValue`의 `dataAdapter`에서 반영할 수 있습니다.

## 데이터와 선택

`setValue`는 `{}`를 1행으로 정규화하고 `[{}]`는 그대로 복제합니다. `null`, `undefined`, `[]`는 데이터를 비우며 primitive나 객체가 아닌 배열 항목은 거부하고 현재 차트를 유지합니다.

우선순위는 `dataAdapter` → 기존 HighChart `[{name,data}]` 호환 → meta-aware 행 추론입니다. 행 추론은 첫 문자열/날짜 컬럼(없으면 첫 컬럼)을 category로, 숫자 컬럼을 series로 사용합니다.

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

range/OHLC 같은 point는 `yData`가 pointArrayMap 기반 객체가 됩니다. Sankey node처럼 원본 행이 없는 point는 `selectionResolver`에서 `null`을 반환할 수 있습니다.

`selectionMode`, `setSelection`, `clearSelection`은 HandStack이 반환할 행과 선택 이벤트만 관리합니다. 컨트롤은 `allowPointSelect`를 주입하거나 `point.select()`를 자동 호출하지 않습니다. Highcharts 네이티브 선택 효과는 개발자가 원형 option 또는 `selectPoint`/`selectSeries`로 명시적으로 구성합니다.

## Methods

| 메서드 | 설명 |
|---|---|
| `getControl(id)` / `getChartControl(id)` / `getChartInstance(id)` | HandStack wrapper / Highcharts 인스턴스 / Highcharts 인스턴스 |
| `setValue(id,value,meta)` / `setSeries(id,series)` | 행 데이터 또는 원형 series 반영. Promise 반환 |
| `renderChart(id,descriptor)` | 공식 데모형 원시 option, 생성자, 모듈, 원본 행을 한 번에 반영 |
| `recreate(id,constructorType,option,modules)` / `setConstructorType` | chart/stock/map/gantt 인스턴스 재생성 |
| `getRawValue(id)` / `getSeriesValue(id)` | 마지막 입력 행 / 현재 series 스냅샷 |
| `getOption(id)` / `getHighcharts()` / `get(id,highchartsID)` | 원시 option, Highcharts namespace, id 기반 객체 조회 |
| `getValue(id)` | single은 최근 선택 행 또는 `null`, multiple/native는 선택 행 배열 |
| `getValue(id,'Row'|'List',meta)` | 선택 원본 행을 HandStack transaction 형식으로 반환 |
| `getSelection(id)` / `getSelectedRows(id)` | 선택 상세 / 원본 행 조회 |
| `setSelection(id,indexOrDescriptorOrArray)` / `clearSelection(id)` | 선택 설정/해제 |
| `update` / `setOption` / `setOptions`, `redraw`, `reflow`, `setTitle`, `setCaption` | chart option과 렌더링 제어 |
| `addSeries`, `removeSeries`, `updateSeries`, `setData`, `setSeriesVisible`, `selectSeries` | series 런타임 제어 |
| `addPoint`, `updatePoint`, `removePoint`, `selectPoint` | point 런타임 제어 |
| `setExtremes`, `setCategories`, `updateAxis`, `add/removePlotLine`, `add/removePlotBand` | 축 제어 |
| `addAnnotation`, `removeAnnotation`, `addSeriesAsDrilldown`, `drillUp` | 주석과 drilldown 제어 |
| `resize`, `setControlSize`, `zoomOut`, `mapZoom`, `fitMapToBounds` | 크기·확대·Maps 제어 |
| `loadModules(id,names)` | 명시한 로컬 모듈을 Promise로 로드 |
| `getLoadedModules()` | 현재 지연 로드가 끝난 모듈 이름 조회 |
| `registerModule(name,path,dependencies,styles)` | 안전한 `/lib/highcharts/` 상대 경로와 CSS를 사용자 모듈 이름으로 등록 |
| `registerMap`, `getMap`, `addEvent`, `removeEvent`, `registerSeriesType` | Maps 및 확장 API |
| `showLoading`, `hideLoading`, `open/close/toggleFullscreen`, `sonify`, `cancelSonify` | 로딩·전체화면·오디오 제어 |
| `print`, `exportChart`, `exportChartLocal`, `getCSV`, `getTable`, `viewData`, `hideData`, `downloadCSV` | 내보내기/데이터 테이블 API |
| `getSVG`, `getDataURL`, `toImage` | exporting 모듈 지연 로드 후 SVG/PNG 생성 |
| `invoke(id,target,method,args)` | chart/series/point/axis/mapView/fullscreen/exporting의 공개 메서드 범용 호출 |
| `clear`, `dispose` | 데이터 및 수명주기 제어 |
| `setLocale(id,translations)` | Highcharts 전역 lang 반영 후 redraw |

metaColumns는 `{fieldID,dataType}`와 `{FieldID,DataType}`를 모두 허용합니다.

## Modules

명시 이름은 `more`, `3d`, `stock`, `map`, `gantt`, `styled-mode`, `indicators-all`, 접근성·주석·내보내기·데이터·Stock Tools와 `moduleDefinitions`에 공개된 모든 로컬 모듈 이름입니다. `chart.styledMode: true`는 `css/highcharts.min.css`를 자동 로드합니다. `highcharts-more`, `highcharts-3d`, `highstock`, `highmaps`, `highcharts-gantt` 별칭도 허용합니다. 그 밖의 배포 파일은 `modules/name`, `indicators/name` 형식으로 직접 로드하거나 `registerModule`로 등록할 수 있습니다. 지도 GeoJSON과 외부 플러그인은 별도 등록해야 합니다.

## Events

`syn-events`에는 다음 이벤트를 선언할 수 있습니다.

- chart: `click`, `load`, `redraw`, `render`, `zoom`, `addSeries`, `beforePrint`, `afterPrint`, `drilldown`, `drillup`, `drillupall`, `exportData`, `fullscreenOpen`, `fullscreenClose`
- series: `seriesAfterAnimate`, `seriesCheckboxClick`, `seriesClick`, `seriesShow`, `seriesHide`, `seriesLegendItemClick`, `seriesMouseOver`, `seriesMouseOut`
- point: `pointClick`, `pointHover`, `pointMouseOut`, `pointSelect`, `pointUnselect`, `pointDrag`, `pointDrop`, `pointRemove`, `pointUpdate`
- axis: `axisAfterSetExtremes`, `axisSetExtremes`, `axisPointBreak`, `axisPointInBreak`
- HandStack 합성: `initialized`, `recreated`, `dataBound`, `selectionChange`, `resized`, `disposed`, `error`

```js
chtSales_selectionChange(elID, params, selections) { }
```

핸들러 인자는 `(elID, params, selections)`입니다. `option.chart.events`, 모든 `plotOptions.<type>.events`, `series.events`, point/axis event의 원형 콜백과 반환값도 보존됩니다.

## 지원 범위

Highcharts 공식 데모 페이지 중 Highcharts Core, Stock, Maps, Gantt의 JavaScript option/series 예제를 대상으로 합니다. Highcharts Dashboards와 Grid는 별도 제품 런타임이므로 `$chart`가 아니라 해당 제품용 컨트롤과 라이브러리가 필요합니다. 타일 공급자, 외부 GeoJSON, 외부 데이터 API와 서드파티 플러그인은 애플리케이션이 직접 제공해야 합니다.
