# `$echarts` API

## Options

| 속성 | 기본값 | 설명 |
|---|---|---|
| `option` | `{}` | `chart.setOption`에 전달할 ECharts 원시 option. 함수와 custom/graphic 객체를 보존 |
| `theme` / `locale` | `null` / `'KO'` | `echarts.init`의 테마와 locale |
| `initOptions` | canvas renderer | renderer, dirty rect, devicePixelRatio, width/height 등 |
| `group` | `null` | `echarts.connect`에서 사용할 chart group |
| `dataMode` / `datasetIndex` | `'dataset'` / `0` | `setValue`가 갱신할 dataset 위치 |
| `dataAdapter` | `null` | `(rows,meta,currentOption,control)` → option patch 또는 Promise |
| `selectionResolver` | `null` | `(params,rows,option,control)` → row index 또는 `{rowIndex,row}` |
| `selectionKey` | `null` | point data의 key와 원본 행의 key를 연결 |
| `rowIndexMap` | `null` | series/dataType/dataIndex를 원본 행 인덱스로 연결 |
| `selectionMode` | `'single'` | `'single'`, `'multiple'`, `'native'`, `'none'` |
| `eventQueries` | `{}` | native event별 `chart.on(event,query,handler)` query |
| `zrEvents` | `[]` | 선언적으로 연결할 ZRender 이벤트 이름 |
| `clearSelectionOnBlank` / `autoResize` | `true` / `true` | 빈 영역 선택 해제와 ResizeObserver 사용 여부 |
| `setOptionOptions` | merge, 즉시 | `notMerge`, `lazyUpdate`, `silent`, `replaceMerge` 등 |

## 데이터와 선택

```js
await $echarts.setValue('cht', { CATEGORY: 'A', VALUE: 10 });
await $echarts.setValue('cht', [{ CATEGORY: 'A', VALUE: 10 }]);
```

- `null`, `undefined`, `[]`는 빈 dataset으로 반영한다.
- primitive 및 배열 안의 비객체 값은 반영하지 않는다.
- 동기 adapter는 같은 호출 안에서 반영하고 Promise adapter는 완료 뒤 반영한다. 비동기 요청이 겹치면 가장 최근 `setValue`/`renderChart`만 유효하다.
- adapter는 option patch 자체 또는 `{ option, rowIndexMap, selectionResolver }`를 반환한다.
- adapter 실패 시 현재 차트와 원본 행을 유지하고 `error` 이벤트를 발생시킨다.

`rowIndexMap`은 series별 배열이며 graph/sankey는 `node`와 `edge`를 분리할 수 있습니다.

```js
rowIndexMap: [
  [0, 1, 2],
  { node: [0, 1, 2], edge: [3, 4] }
]
```

선택 원본 행 결정 순서는 `selectionResolver` → point의 `__handstackRowIndex` → `selectionKey` → `rowIndexMap` → `dataIndex`입니다.

```js
{
  series: { index, id, name, type },
  point: { dataIndex, dataIndexInside, dataType, name, value, data, color },
  yData,
  rowIndex,
  row
}
```

`yData`는 event value와 `series.encode.y/value`, 원본 행 순으로 해석하며 다차원 값은 배열을 유지합니다.

HandStack `selectionMode`, `setSelection`, `clearSelection`은 Row/List 반환 상태만 관리합니다. 컨트롤은 series에 `selectedMode`를 주입하거나 `select`/`unselect` action을 자동 실행하지 않습니다. 선택·강조 시각 효과는 개발자가 원형 `selectedMode`, `select` option 또는 `dispatchAction`으로 명시적으로 구성합니다.

## 공식 예제형 렌더링

```js
await $echarts.renderChart('chtDemo', {
  rows,                          // 선택 Row/List의 원본
  metaColumns,
  option: () => fetchData().then(buildOption),
  theme: 'handstack-dark',
  locale: 'KO',
  initOptions: { renderer: 'svg' },
  group: 'dashboard',
  rowIndexMap,
  selectionResolver,
  setOptionOptions: { notMerge: true }
});
```

descriptor 자체와 `option`은 객체, 함수 또는 Promise를 허용합니다. theme, locale, initOptions가 지정되면 기존 인스턴스를 안전하게 재생성하고 원본 행 연결과 runtime event 등록을 유지합니다.

## Methods

| 메서드 | 설명 |
|---|---|
| `getControl`, `getChartControl`, `getChartInstance` | HandStack wrapper / ECharts 인스턴스 |
| `getECharts` | 전역 ECharts namespace |
| `setValue` / `renderChart` | 객체 행 dataset / 공식 예제형 descriptor 반영. Promise 반환 |
| `getRawValue`, `getValue`, `getSelection`, `getSelectedRows` | 원본·선택 데이터 조회 |
| `setSelection`, `clearSelection` | index 또는 event descriptor 기반 선택 제어 |
| `setOption`, `getOption`, `dispatchAction`, `appendData` | ECharts option과 동적 action |
| `on/off`, `onZr/offZr` | runtime native/ZRender 이벤트 등록과 해제 |
| `invoke(id,'chart'|'zr',method,args)`, `invokeGlobal` | 네이티브 메서드 범용 호출 |
| `getZr`, `getDom`, `getWidth`, `getHeight`, `getDevicePixelRatio`, `getVisual`, `isDisposed` | 인스턴스 상태 조회 |
| `setGroup`, `connect`, `disconnect` | 연결 차트 구성 |
| `resize`, `setControlSize`, `convertToPixel`, `convertFromPixel`, `containPixel` | 크기와 좌표 처리 |
| `showLoading`, `hideLoading`, `getDataURL`, `getConnectedDataURL`, `toImage` | 로딩과 이미지 출력 |
| `reinitialize`, `setTheme`, `setLocale`, `clear`, `dispose` | 초기화와 수명주기 |
| `registerMap`, `getMap`, `registerTheme`, `registerLocale`, `registerTransform`, `registerCustomSeries` | ECharts 6 전역 등록 API |

## Events

`syn-events`에는 ECharts native event 이름을 그대로 선언합니다. `click`, `dblclick`, mouse event, `legendselectchanged`, `datazoom`, `brushselected`, `selectchanged`, `timelinechanged`, `georoam`, `rendered`, `finished` 등을 제한하지 않습니다.

```html
<syn_echarts id="cht" syn-events="['click','datazoom','selectionChange']"
  syn-options="{ eventQueries:{ click:{seriesIndex:0} }, zrEvents:['contextmenu'] }">
</syn_echarts>
```

- native와 합성 이벤트: `(elID, params, selections)`
- ZRender 이벤트: `cht_zrContextmenu(elID, params, selections)`
- 합성 이벤트: `initialized`, `dataBound`, `selectionChange`, `optionChanged`, `reinitialized`, `resized`, `disposed`, `error`

내부 Row/List 선택은 native handler보다 먼저 갱신되며 재초기화 후에도 runtime handler를 중복 없이 다시 연결합니다.

## 지원 범위

로컬 ECharts 6.1.0 코어의 line, bar, pie, scatter/effectScatter, radar, tree/treemap/sunburst, graph/chord, gauge, funnel, parallel, sankey, boxplot, candlestick, heatmap, lines, map, pictorialBar, themeRiver, custom 및 matrix/calendar/geo/polar/singleAxis 좌표계와 component를 원시 option으로 지원합니다.

echarts-gl, wordcloud, liquid-fill 및 외부 지도 SDK는 별도 확장이므로 자동 설치하거나 로드하지 않습니다.
