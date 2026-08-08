# ECharts (`syn.uicontrols.$echarts`)

Apache ECharts 6.1.0 전체 번들을 HandStack의 객체 행 데이터와 연결하는 UI 컨트롤입니다. ECharts의 `option`을 그대로 전달하므로 코어에 포함된 모든 series, component, coordinate system, `custom.renderItem`, graphic 및 동적 action을 사용할 수 있습니다.

```html
<syn_echarts id="chtSales" syn-datafield="Sales" syn-events="['click','selectionChange']"
    style="width:100%;height:360px" syn-options="{
        selectionMode: 'multiple',
        option: {
            tooltip: {}, xAxis: { type: 'category' }, yAxis: {},
            series: [{ type: 'bar', encode: { x: 'YEAR', y: 'AMOUNT' } }]
        }
    }"></syn_echarts>
```

```js
await syn.uicontrols.$echarts.setValue('chtSales', [
    { YEAR: '2025', AMOUNT: 120 },
    { YEAR: '2026', AMOUNT: 180 }
]);
```

`setValue`는 `{}` 또는 `[{}]`을 `dataset.source`로 반영합니다. tree, graph, sankey처럼 중첩 데이터가 필요하면 동기 또는 Promise `dataAdapter`를 사용합니다. 다중 series나 node/edge의 원본 행은 `rowIndexMap`, `selectionKey`, `selectionResolver`로 연결합니다.

공식 예제형 원시 option은 `renderChart`로 한 번에 적용할 수 있습니다.

```js
await syn.uicontrols.$echarts.renderChart('chtDemo', {
    rows,
    option,
    rowIndexMap: [[0, 1, 2]],
    initOptions: { renderer: 'svg' }
});
```

- `getValue(id)`: single 모드는 선택 원본 행, multiple/native 모드는 행 배열
- `getValue(id, 'Row'|'List', metaColumns)`: HandStack transaction 형식 `[[{prop,val}]]`
- `getSelection(id)`: `series`, `point`, `yData`, `rowIndex`, `row`
- `getChartInstance(id)` / `getECharts()`: ECharts 인스턴스와 전역 namespace
- `invoke`, `invokeGlobal`, `on/off`, `onZr/offZr`: 네이티브 API와 이벤트 escape hatch

point 클릭은 HandStack 선택 데이터와 `selectionChange`만 갱신합니다. 컨트롤은 `selectedMode`나 `dispatchAction`을 자동 적용하지 않으므로 시각적 선택·강조가 필요하면 화면 개발자가 ECharts 원형 option과 action을 직접 작성합니다.

로더 순서는 `/lib/echarts/echarts.min.js` → `/lib/echarts/i18n/langKO.js` → `ECharts.js`입니다. 예제 목차는 `example/index.html`, 전체 계약은 `API.md`에서 확인합니다.

이번 컨트롤은 로컬 ECharts 코어를 대상으로 합니다. echarts-gl, wordcloud, liquid-fill, Google/Leaflet/Mapbox 확장은 포함하지 않으며, 추가한 확장은 `getECharts()`와 전역 등록 API로 연결할 수 있습니다.
