# Chart (syn.uicontrols.$chart / syn.uicontrols.$chartjs)

## 이 컨트롤은 무엇인가요?

`Chart` 폴더에는 이름이 비슷하지만 서로 완전히 다른 두 개의 차트 엔진이 들어 있습니다. 폴더 하나에 두 컨트롤이 공존하는 형태이므로, 어떤 파일을 쓰느냐에 따라 태그와 사용법이 완전히 달라집니다.

| 구분 | 소스 파일 | 싱글턴 객체 | 태그 | 내부 라이브러리 |
|---|---|---|---|---|
| 엔진 A | `Chart.js` / `Chart.css` | `syn.uicontrols.$chart` | `<syn_chart>` | [Highcharts](https://www.highcharts.com/) |
| 엔진 B | `ChartJS.js` / `ChartJS.css` | `syn.uicontrols.$chartjs` | `<syn_chartjs>` | [Chart.js](https://www.chartjs.org/) |

두 컨트롤 모두 다른 syn.uicontrols와 동일하게 `defaultSetting` / `controlLoad` / `getValue` / `setValue` / `clear` / `setLocale` 형태의 싱글턴 패턴을 따르지만, 옵션 형식과 내부 동작은 각자 사용하는 차트 라이브러리를 그대로 반영합니다. 즉 "옵션을 얼마나 아느냐"가 곧 "Highcharts를, 또는 Chart.js를 얼마나 아느냐"와 같습니다.

주의: 이 문서는 두 파일의 실제 소스 코드를 직접 읽고 확인한 내용을 바탕으로 작성되었습니다. `$chart`(Highcharts 기반)는 qcn.groupware 등에서 실사용 예시를 찾지 못해 소스 코드만으로 문서화했고, 몇 가지 미완성/버그로 보이는 부분이 있습니다. 자세한 내용은 `API.md`의 "참고" 절과 각 메서드 설명을 꼭 확인하세요.

## 언제 사용하나요?

- `$chartjs` (Chart.js 기반)를 우선 고려하세요. 실사용 샘플(`sample/uicontrol/chartjs.html`)이 있고, DB 조회 결과처럼 "행(row) 배열 + 컬럼 메타데이터" 형태의 데이터를 막대/선 그래프로 바로 그리는 `setValue(elID, value, metaColumns)` 기능이 갖춰져 있습니다. 다크모드 대응(`localStorage.isDarkMode`)도 자동으로 처리됩니다.
- `$chart` (Highcharts 기반)는 Highcharts의 다양한 차트 타입(파이, 게이지, 영역 등)이나 Highcharts 고유 옵션이 꼭 필요할 때만 사용하세요. `setValue`가 완전히 구현되어 있지 않아(아래 API.md 참고), 초기 렌더링 이후 데이터를 동적으로 갱신하는 용도로는 아직 신뢰하기 어렵습니다. 초기 옵션(`syn-options`)만으로 고정된 차트를 보여주는 용도에는 문제없이 쓸 수 있습니다.
- 두 엔진 모두 `<script src="/js/syn.loader.js"></script>` 한 줄이면 각자 필요한 CSS/JS(Highcharts 또는 Chart.js 본체 포함)가 자동으로 로드되므로, 페이지에 별도의 `<script>` 태그를 추가할 필요가 없습니다.

## 빠른 시작

### $chart (Highcharts 기반)

```html
<syn_chart id="chtSales" style="width:100%; height:320px" syn-options="{
    chart: { type: 'column' },
    title: { text: '연도별 매출' },
    xAxis: { categories: ['1분기', '2분기', '3분기', '4분기'] },
    yAxis: { title: { text: '매출(백만원)' } },
    series: [
        { name: '2024', data: [12, 35, 18, 42] },
        { name: '2025', data: [20, 15, 30, 25] }
    ]
}"></syn_chart>
```

```js
'use strict';
let $samplePage = {
    event: {
        btnGetValue_click() {
            // [{ name, data }] 형태로 각 시리즈의 값을 돌려줍니다.
            syn.$l.eventLog('btnGetValue_click', JSON.stringify(syn.uicontrols.$chart.getValue('chtSales')));
        }
    }
}
```

### $chartjs (Chart.js 기반)

```html
<syn_chartjs id="chtSales" syn-datafield="ChartDetail" style="width:100%; height:320px" syn-options="{
    type: 'bar',
    options: { scales: { y: { beginAtZero: true } } },
    labelID: 'YEAR',
    series: [
        { columnID: 'AMOUNT1', label: '1지점' },
        { columnID: 'AMOUNT2', label: '2지점' }
    ]
}"></syn_chartjs>
```

```js
'use strict';
let $samplePage = {
    prop: {
        dataSource: [
            { YEAR: 2024, AMOUNT1: 12, AMOUNT2: 20 },
            { YEAR: 2025, AMOUNT1: 35, AMOUNT2: 15 }
        ],
        metaColumns: {
            YEAR: { FieldID: 'YEAR', DataType: 'int' },
            AMOUNT1: { FieldID: 'AMOUNT1', DataType: 'int' },
            AMOUNT2: { FieldID: 'AMOUNT2', DataType: 'int' }
        }
    },
    event: {
        btnSetValue_click() {
            syn.uicontrols.$chartjs.setValue('chtSales', $this.prop.dataSource, $this.prop.metaColumns);
        },
        btnClear_click() {
            syn.uicontrols.$chartjs.clear('chtSales');
        }
    }
}
```

핵심 포인트:
- 두 태그(`<syn_chart>`, `<syn_chartjs>`) 모두 `controlLoad`가 실행되면 원래 태그는 `{id}_hidden`으로 이름이 바뀌어 숨겨지고, 같은 위치에 실제 차트가 그려질 새 `<div id="{id}">`(엔진 A) 또는 `<canvas>`를 담은 `div.chart-container`(엔진 B)가 추가됩니다.
- `$chartjs.setValue`는 "행 배열 + 컬럼 메타데이터"를 넘기면 알아서 `labels`/`datasets`를 만들어 주는 반면, `$chart.setValue`는 Highcharts 시리즈 객체 배열(`[{ name, data }, ...]`)을 그대로 기대합니다. 서로 넘기는 값의 모양이 다릅니다.
- `$chartjs`는 `labelID`가 비어 있으면 차트를 아예 그리지 않고 조용히 종료합니다(콘솔에 Debug 로그만 남음). 차트가 안 보인다면 가장 먼저 `labelID` 설정을 확인하세요.
- `$chartjs`는 `localStorage.getItem('isDarkMode')` 값에 따라 격자선/범례/툴팁 색상을 자동으로 다르게 적용합니다.

## 예제 실행하기

`example/` 폴더의 각 HTML 파일을 handstack의 wwwroot 정적 서버(예: rdy 프로젝트) 경로 아래에 두고 브라우저로 열면 바로 동작을 확인할 수 있습니다.

- `chartbasic.html` : `$chart`(Highcharts) 엔진의 기본 컬럼 차트 + `getValue`/`setValue`/`clear`/`toImage` 동작 확인 (일부는 알려진 버그로 예외가 발생하는 것까지 확인할 수 있습니다). 참고: 실무(qcn.groupware) 코드에서는 `$chart`(Highcharts) 태그가 실제로 연결되어 쓰이는 사례를 찾지 못했습니다 — 실무는 거의 전부 `$chartjs`를 사용합니다.
- `chartjsbasic.html` : `$chartjs`(Chart.js) 엔진의 기본 막대 차트 + `setValue`/`clear` 동작 확인. 기존 샘플 `sample/uicontrol/chartjs.html`을 기반으로 단순화했습니다.
- `chartjsevents.html` : `$chartjs`에서 다중 시리즈(`fill` 옵션 포함) 구성과 `getChartControl`로 Chart.js 인스턴스에 직접 접근해 옵션을 바꾸는 예제
- `griddashboard.html` : 실무 대시보드 패턴 - AUIGrid의 `getDataAtCol`로 열을 뽑아 행 배열로 재조립한 뒤 `$chartjs.setValue`에 넘기고, `scales.x/y.stacked: true`로 누적 막대 차트(근무시간 소정/연장) 구성

각 예제는 화면 하단 로그 영역(`syn.$l.eventLog` 출력)에서 이벤트 발생 순서와 전달값을 확인할 수 있습니다.

## 더 알아보기

- API 상세는 같은 폴더의 `API.md`를 참고하세요.
- 실제 소스: `wwwroot/uicontrols/Chart/Chart.js`, `Chart.css`, `ChartJS.js`, `ChartJS.css`
- 기존 샘플(엔진 B, `$chartjs`): `wwwroot/sample/uicontrol/chartjs.html`, `chartjs.js`
- 벤더 라이브러리 로딩 위치: `wwwroot/js/syn.loader.js`의 `case 'chart':`(Highcharts, `/lib/highcharts/highcharts.min.js`), `case 'chartjs':`(Chart.js, `/lib/chart.js/chart.umd.min.js`)
- Highcharts 공식 문서(옵션 전체 목록): https://api.highcharts.com/highcharts/
- Chart.js 공식 문서(옵션 전체 목록): https://www.chartjs.org/docs/latest/
