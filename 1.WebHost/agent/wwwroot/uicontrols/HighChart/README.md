# HighChart (`syn.uicontrols.$chart`)

Highcharts 11.4.8 기반 HandStack UI 컨트롤입니다. `<syn_chart>`에 Highcharts 원형 옵션을 `option`으로 선언하고, `$chart.setValue()`에는 `$auigrid`/`$grid`와 같은 단일 객체 또는 객체 배열을 전달합니다. Highcharts 공식 데모의 Core, Stock, Maps, Gantt 생성자와 series 옵션을 같은 형태로 사용할 수 있습니다.

```html
<syn_chart id="chtSales" syn-events="['pointClick','selectionChange']"
    style="width:100%;height:360px" syn-options="{
        selectionMode: 'multiple',
        option: { chart: { type: 'column' }, title: { text: '매출' } }
    }"></syn_chart>
```

```js
syn.uicontrols.$chart.setValue('chtSales', [
    { YEAR: '2025', AMOUNT: 120, PROFIT: 30 },
    { YEAR: '2026', AMOUNT: 180, PROFIT: 48 }
]);
```

기본 추론은 첫 문자열/날짜 컬럼을 category로, 숫자 컬럼을 series로 사용합니다. Sankey, networkgraph처럼 별도 데이터 구조가 필요한 차트는 `dataAdapter`를 사용하고, 공식 데모 option을 그대로 옮길 때는 `renderChart()`에 `constructorType`, `option`, `rows`, `rowIndexMap`, `selectionResolver`를 전달합니다. 필요한 로컬 모듈은 series type, 기술 지표, 3D/polar/colorAxis/mapView 및 생성자에 따라 `/lib/highcharts/`에서 의존 순서로 지연 로드됩니다.

point를 클릭하면 원본 입력 행이 보존됩니다. `getValue(id, 'Row'|'List', metaColumns)`는 HandStack transaction 형식인 `[[{ prop, val }]]`을 반환하고, `getSelection(id)`은 series/point/yData/row 상세 정보를 반환합니다. 이 선택 계약은 Highcharts의 `selected` 상태나 포커스 스타일을 자동으로 변경하지 않습니다. 시각 효과가 필요하면 화면 코드에서 `allowPointSelect`, `point.select()`, point event 또는 `selectPoint()`를 명시적으로 사용합니다.

- 소스: `HighChart.js`, `HighChart.css` (`HighChart.js` 내부에 행·선택 공통 계약 포함)
- 예제 목차: `example/index.html`(Core, 고급 기능, 계층·관계, 특수 series, Stock, Maps, Gantt, 데이터·운영 API)
- 로더: Highcharts core → HighChart
- 상세 옵션·메서드·이벤트: `API.md`

Highcharts Maps의 실제 지도 GeoJSON, 타일 공급자 설정과 외부 플러그인은 자동 포함하지 않습니다. `registerMap`, inline `mapData` 또는 원형 Highcharts API로 명시적으로 등록합니다. 공식 데모 페이지의 Highcharts Dashboards와 Grid는 별도 제품 런타임이므로 이 `$chart` 컨트롤의 범위가 아닙니다.
