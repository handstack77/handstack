# ChartJS (`syn.uicontrols.$chartjs`)

Chart.js 4.4.1 UMD 번들 기반 HandStack UI 컨트롤입니다. `<syn_chartjs>`에 Chart.js 원형 `type`, `data`, `options`, `plugins`를 선언하고 `$chartjs.setValue()`에는 단일 객체 또는 객체 배열을 전달합니다.

```html
<syn_chartjs id="chtSales" syn-events="['pointClick','selectionChange']"
    style="width:100%;height:360px" syn-options="{
        type: 'bar', selectionMode: 'multiple',
        options: { scales: { y: { beginAtZero: true } } }
    }"></syn_chartjs>
```

```js
syn.uicontrols.$chartjs.setValue('chtSales', [
    { YEAR: '2025', AMOUNT: 120, PROFIT: 30 },
    { YEAR: '2026', AMOUNT: 180, PROFIT: 48 }
]);
```

기본 추론은 첫 문자열/날짜 컬럼을 label로, 숫자 컬럼을 dataset으로 사용합니다. 기존 `labelID`/`series` 매핑도 유지합니다. scatter, bubble, pie 등 특수 데이터 형태는 `dataAdapter`로 Chart.js config를 반환합니다.

클릭한 point는 원본 행과 연결됩니다. `getValue(id, 'Row'|'List', metaColumns)`는 HandStack transaction 형식인 `[[{ prop, val }]]`을, `getSelection(id)`은 series/point/yData/row 상세 정보를 반환합니다. 컨트롤은 선택 강조선을 자동으로 그리지 않으며, 포커스가 필요하면 화면 코드에서 `setActiveElements`나 사용자 plugin을 명시적으로 사용합니다.

- 소스: `ChartJS.js`, `ChartJS.css` (`ChartJS.js` 내부에 행·선택 공통 계약 포함)
- 예제(HandStack 데이터 바인딩): `example/chartjsbasic.html`, `example/chartjsevents.html`, `example/griddashboard.html`, `example/chartjsadapter.html`
- 예제(Chart.js 공식 샘플 갤러리, [chartjs.org/docs/latest/samples](https://www.chartjs.org/docs/latest/samples/information.html) 75종 전체를 카테고리별로 재구성): `example/bar.html`, `example/line.html`, `example/other-charts.html`, `example/area.html`, `example/scales.html`, `example/scale-options.html`, `example/legend.html`, `example/title-subtitle.html`, `example/tooltip.html`, `example/scriptable.html`, `example/animations.html`, `example/advanced.html`, `example/plugins.html`
- 로더: Chart.js UMD → moment.js → ChartJS (`syn.loader.js`의 `case 'chartjs'`가 순서대로 로드, date adapter는 `ChartJS.js`에 포함)
- 상세 옵션·메서드·이벤트: `API.md`

UMD 번들에 포함된 기본 controller/element/scale/plugin을 모두 사용할 수 있습니다. 외부 Chart.js 플러그인과 사용자 controller는 자동 포함하지 않으며 `register`/`unregister`로 등록합니다(`example/advanced.html`이 `Chart.LinearScale`/`Chart.BarController`를 상속한 커스텀 축·차트 타입 등록 예시입니다).

`scales: { x: { type: 'time' } }`(Chart.js v4 필수, npm `chartjs-adapter-moment` 미사용)는 `ChartJS.js`가 번들된 `moment-with-locales.min.js`에 대해 `Chart._adapters._date.override(...)`를 직접 구현해 지원합니다. CDN이나 외부 패키지를 내려받지 않고 로컬 자산만으로 time scale까지 지원하기 위한 자체 제작 어댑터이며, 별도 파일 없이 `ChartJS.js`에 포함되어 있습니다.

`ChartJS.js`는 옵션이 명시되지 않으면 `animation: false`로 시작합니다(성능 우선 기본값). Chart.js 애니메이션 샘플을 재현하려면 `setConfig`/`syn-options`의 `options.animation`을 직접 지정해야 합니다(`example/animations.html` 참고).
