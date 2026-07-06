# Chart API 참조

이 폴더에는 서로 다른 두 컨트롤이 들어 있습니다. 섹션을 혼동하지 마세요.

- [`$chart`](#chart-chartjs-파일--highcharts-기반-실제-확인) : 소스 파일 `Chart.js`/`Chart.css`, 싱글턴 `syn.uicontrols.$chart`, 태그 `<syn_chart>`, 내부 라이브러리 [Highcharts](https://www.highcharts.com/)
- [`$chartjs`](#chartjs-chartjsjs-파일--chartjs-라이브러리-기반) : 소스 파일 `ChartJS.js`/`ChartJS.css`, 싱글턴 `syn.uicontrols.$chartjs`, 태그 `<syn_chartjs>`, 내부 라이브러리 [Chart.js](https://www.chartjs.org/)

두 파일 모두 `chartControls`라는 배열에 `{ id, chart, ... }` 형태로 컨트롤 인스턴스를 등록해 두고, `getChartControl(elID)`로 조회하는 구조는 같습니다. 다만 `getChartControl`이 반환하는 값의 모양이 서로 다릅니다 (아래 각 섹션 참고). 이 문서의 모든 내용은 두 소스 파일을 직접 읽고 확인한 사실입니다(추측 없음).

---

## $chart (Chart.js 파일 — Highcharts 기반, 실제 확인)

싱글턴 객체: `syn.uicontrols.$chart`
소스 파일: `wwwroot/uicontrols/Chart/Chart.js`, `wwwroot/uicontrols/Chart/Chart.css`
버전(소스 내 표기): `v2025.3.1`
내부 라이브러리: [Highcharts](https://www.highcharts.com/) (`Highcharts.chart(elID, setting)` 호출)
CSS 클래스: `.syn-chart`

### 마크업

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

- `syn-options`에 넣는 값은 Highcharts 설정 객체 그대로입니다(`chart`/`title`/`xAxis`/`yAxis`/`series` 등). `defaultSetting`과 병합(`syn.$w.argumentsExtend`)된 뒤 `Highcharts.chart(elID, setting)`에 그대로 전달됩니다.
- `controlLoad` 실행 시 원래 태그는 `{id}_hidden`으로 이름이 바뀌고 `display:none` 처리되며, 같은 위치에 실제 Highcharts가 그려질 `<div id="{id}">`가 새로 추가됩니다.
- `width`/`height`는 마크업 요소의 인라인 `style.width`/`style.height`가 있으면 그 값을, 없으면 각각 `320`/`240`을 사용합니다(단위 없는 숫자 그대로 들어가므로, 명시적으로 `style="width:100%; height:320px"`처럼 지정하는 것을 권장합니다).

### Options (defaultSetting)

| 속성 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `chart.type` | string | `'column'` | Highcharts 차트 종류(`column`, `line`, `pie`, `bar` 등 Highcharts가 지원하는 모든 타입) |
| `title.text` | string | `''` | 차트 제목 |
| `xAxis.categories` | array | `['A', 'B', 'C']` | X축 카테고리 라벨 |
| `yAxis.title.text` | string | `'Values'` | Y축 제목 |
| `series` | array | 예시 2개 시리즈(`Series 1`, `Series 2`) | Highcharts 시리즈 배열(`{ name, data }`) |
| `dataType` | string | `'string'` | 다른 컨트롤과 형식을 맞추기 위한 공통 속성 |
| `belongID` / `controlText` / `validators` / `transactConfig` / `triggerConfig` | - | `null` | syn.uicontrols 공통 옵션(값 바인딩·유효성검사·트랜잭션 연동용). ⚠ `$chartjs`에 있는 `getter`/`setter`는 이쪽 `defaultSetting`에는 없습니다. |
| `width` / `height` | - | 요소 인라인 스타일 또는 `320`/`240` | `controlLoad` 실행 시 자동으로 채워짐(직접 지정할 필요 없음) |

이 외에 Highcharts가 지원하는 모든 옵션(`legend`, `plotOptions`, `tooltip`, `exporting` 등)을 `syn-options`에 그대로 추가할 수 있습니다. 전체 목록은 [Highcharts 옵션 문서](https://api.highcharts.com/highcharts/)를 참고하세요.

### 메서드

`syn.uicontrols.$chart.<메서드명>(...)` 형태로 호출합니다.

| 메서드 | 설명 |
|---|---|
| `getChartControl(elID)` | 등록된 Highcharts 차트 인스턴스 자체를 반환합니다(`$chartjs`와 달리 래퍼 객체가 아니라 `Highcharts.Chart` 인스턴스를 바로 반환). 없으면 `null`. |
| `getValue(elID, meta)` | 각 시리즈의 `{ name, data }`(`data`는 `serie.yData`) 배열을 반환합니다. 차트가 없으면 `null`. |
| `setValue(elID, value, meta)` | ⚠ 미완성/버그 있음 — 아래 "알려진 이슈" 참고 |
| `clear(elID, isControlLoad)` | 차트의 모든 시리즈를 제거합니다(`series[0].remove(true)` 반복). ⚠ `getChartControl`이 `null`을 반환하는 상황(차트 미등록)을 확인하지 않으므로, 존재하지 않는 `elID`로 호출하면 `TypeError`가 발생합니다. |
| `toImage(elID, fileID)` | 차트를 PNG로 내보냅니다(`chart.toBase64Image()`). ⚠ 아래 "알려진 이슈" 참고 |
| `randomScalingFactor(min, max)` / `rand(min, max)` | 테스트/데모용 난수 생성 유틸리티(시드 기반 의사난수). 실제 통계적 난수가 아닙니다. |
| `setLocale(elID, translations, control, options)` | 다국어 적용 훅. 본문이 비어 있는 빈 함수이므로 호출해도 아무 효과가 없습니다. |

> `controlLoad(elID, setting)`은 프레임워크가 자동으로 호출하는 내부 진입점입니다. 직접 호출할 일은 거의 없습니다.

### 알려진 이슈 (소스 코드로 확인됨)

- `setValue`가 완전히 구현되어 있지 않습니다. 실제 소스:

  ```js
  setValue: function (elID, value, meta) {
      var chart = $chart.getChartControl(elID);
      if (chart) {
          var seriesLength = chart.series.length;
          for (var i = seriesLength - 1; i > -1; i--) {
              chart.series[i].remove();
          }
      }

      var length = value.length;
      for (var i = 0; i < length; i++) {
          var item = value[i];
          chart.addSeries(item);   // value는 Highcharts 시리즈 객체 배열([{ name, data }, ...])이어야 함
      }

      var columnKeys = [];
      for (var key in item) {
          if (control.config.labelID != key) {   // ← control 변수가 이 함수 어디에도 선언되어 있지 않음
              columnKeys.push(key);
          }
      }
      // (이하 컬럼 매핑 로직은 전부 주석 처리되어 있음, 미완성 상태)
  },
  ```

  - `value`에 담긴 시리즈는 실제로 차트에 반영됩니다(`chart.addSeries(item)`까지는 정상 동작).
  - 하지만 바로 다음에 나오는 `control.config.labelID` 코드에서 `control`이라는 변수가 함수 안 어디에도 선언되어 있지 않아 `ReferenceError: control is not defined`가 발생합니다. 즉 `setValue`를 호출하면 시리즈 교체 자체는 적용되지만, 그 직후 항상 예외가 던져집니다.
  - `value`가 빈 배열이면 `addSeries` 루프를 안 도므로 `item`이 `undefined`가 되고, 이어지는 `for (var key in item)`은 그냥 통과하지만 `control`이 없다는 문제는 여전히 남습니다.
  - 결론: `$chart.setValue`를 호출할 때는 `try/catch`로 감싸서 예외를 흡수하거나, 아예 `getChartControl(elID)`로 Highcharts 인스턴스를 직접 얻어 `chart.addSeries(...)`/`chart.update(...)`를 호출하는 방식을 권장합니다.

- `toImage`가 정의되지 않은 전역 `download`를 참조합니다.

  ```js
  if (download) {
      download(base64Image, fileName, 'image/png');
  }
  ```

  이 저장소 어디에도 `download`라는 전역 함수/라이브러리가 포함되어 있지 않습니다(레거시로 함께 쓰이던 [download.js](https://github.com/rndme/download) 라이브러리를 전제로 한 코드로 보이며, 현재 번들에는 빠져 있습니다). 따라서 `toImage(elID)`를 그대로 호출하면 `ReferenceError: download is not defined`가 발생할 수 있습니다. 필요하다면 `getChartControl(elID).toBase64Image()`로 base64 이미지를 직접 얻은 뒤, `<a download>` 방식(같은 함수의 `else` 분기 코드)으로 직접 다운로드를 트리거하세요.

- `clear`/`toImage`/`setValue` 모두 `getChartControl(elID)`가 `null`을 반환하는 경우(차트가 없거나 아직 로드되지 않은 경우)를 방어하지 않습니다. 항상 차트가 실제로 로드된 뒤에 호출하세요.

- 커스텀 클릭 이벤트가 사실상 동작하지 않습니다. `controlLoad` 안에서 `syn.$l.addEvent(..., 'click', function (evt) {...})`를 등록하지만, 내부 로직 전체가 주석 처리되어 있어 클릭해도 아무 일도 일어나지 않습니다. 클릭 반응이 필요하면 Highcharts 자체의 `plotOptions.series.point.events.click` 옵션을 `syn-options`에 직접 넣어 사용하세요.

### 이벤트 (syn-events)

`$chart`는 다른 syn.uicontrols처럼 `syn-events`로 이벤트를 등록해도 실제로 연결되는 핸들러가 없습니다(위 "알려진 이슈"에서 설명한 대로 내부 클릭 리스너 로직이 전부 주석 처리됨). Highcharts 자체의 콜백 옵션(`plotOptions`, `chart.events` 등)을 `syn-options`에 직접 작성하는 방식을 사용하세요.

```html
<syn_chart id="chtSales" syn-options="{
    chart: {
        type: 'column',
        events: { load: function () { console.log('차트 로드 완료'); } }
    },
    plotOptions: {
        series: { point: { events: { click: function () { console.log('포인트 클릭: ' + this.category); } } } }
    },
    series: [{ name: '2024', data: [12, 35, 18, 42] }]
}"></syn_chart>
```

---

## $chartjs (ChartJS.js 파일 — Chart.js 라이브러리 기반)

싱글턴 객체: `syn.uicontrols.$chartjs`
소스 파일: `wwwroot/uicontrols/Chart/ChartJS.js`, `wwwroot/uicontrols/Chart/ChartJS.css`
버전(소스 내 표기): `v2025.12.26`
내부 라이브러리: [Chart.js](https://www.chartjs.org/) v4 계열(`Chart.defaults.font`/`Chart.defaults.plugins.legend` API 사용, `new Chart(elID, setting)` 호출)
CSS 클래스: `.syn-chartjs`

### 마크업

```html
<syn_chartjs id="chtChart" syn-datafield="ChartDetail" style="width:100%; height:320px" syn-options="{
    type: 'bar',
    options: {
        scales: { y: { beginAtZero: true } }
    },
    labelID: 'YEAR',
    series: [
        { columnID: '4Y020', label: '문화산업경영학과', dataType: 'int' },
        { columnID: '4Y030', label: '정보경영학과', dataType: 'int' }
    ]
}"></syn_chartjs>
```

- `syn-options`은 `defaultSetting`과 병합된 뒤 Chart.js 생성자 설정 객체(`{ type, data, options }` 형태)로 그대로 쓰입니다.
- `controlLoad` 실행 시 원래 태그는 `{id}_hidden`으로 이름이 바뀌어 숨겨지고, 같은 위치에 `<div class="chart-container">` 래퍼가 추가되며 그 안에 실제 `<canvas id="{id}">`가 그려집니다.
- `labelID`가 비어 있으면 차트를 그리지 않습니다. `controlLoad` 안에서 `$string.isNullOrEmpty(setting.labelID) == true`이면 `syn.$l.eventLog(..., 'Debug')`만 남기고 `return`하므로, 화면에 아무것도 나타나지 않습니다. 차트가 안 보인다면 가장 먼저 확인할 부분입니다.
- 다크모드(`localStorage.getItem('isDarkMode') == 'true'`) 여부에 따라 격자선/범례/툴팁 색상 세트가 자동으로 다르게 병합됩니다. `type`이 `line`/`bar`/`bubble`/`scatter`인 경우에는 `scales.x`/`scales.y`(다크모드는 `grid.color`/`ticks.color`, 라이트모드는 `beginAtZero`)도 자동으로 추가됩니다. `syn-options.options`에 같은 키를 직접 지정하면 그 값이 우선 병합됩니다.

### Options (defaultSetting)

| 속성 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `labelID` | string | `''` | X축 라벨(카테고리)로 쓸 데이터 컬럼명. 필수(비어 있으면 렌더링 자체를 하지 않음) |
| `series` | array | `[]` | 데이터 컬럼 → 데이터셋 매핑 목록. 각 항목은 `{ columnID, label, fill, dataType }`. 비어 있으면 `setValue`가 `labelID`를 제외한 모든 컬럼을 컬럼명 그대로 라벨로 써서 자동으로 데이터셋을 만듭니다. |
| `type` | string | `'line'` | Chart.js 차트 타입(`line`, `bar`, `pie`, `doughnut`, `radar` 등 Chart.js가 지원하는 모든 타입) |
| `data` | object | `{}` | Chart.js `data` 객체(보통 직접 채우지 않고 `setValue`가 `labels`/`datasets`를 채움) |
| `options` | object | `null` | Chart.js `options` 객체. `controlLoad`가 다크모드 대응 기본값과 병합합니다. |
| `dataType` | string | `'string'` | 다른 컨트롤과 형식을 맞추기 위한 공통 속성 |
| `belongID` / `getter` / `setter` / `controlText` / `validators` / `transactConfig` / `triggerConfig` | - | `null`/`false` | syn.uicontrols 공통 옵션(값 바인딩·유효성검사·트랜잭션 연동용) |
| `width` / `height` | - | 요소 인라인 스타일 또는 `320`/`240` | `controlLoad` 실행 시 자동으로 채워짐 |

### series 항목

| 속성 | 설명 |
|---|---|
| `columnID` | 데이터 행 객체에서 이 데이터셋 값으로 쓸 컬럼명 |
| `label` | 데이터셋 라벨(범례에 표시). 생략하면 `columnID`를 그대로 사용 |
| `fill` | Chart.js 데이터셋의 `fill` 옵션(영역 채우기 여부) 그대로 전달 |
| `dataType` | 표시용 메타 정보. `setValue` 자체는 이 값이 아니라 인자로 넘기는 `metaColumns`의 `DataType`으로 타입을 검증합니다(아래 참고). |

### 메서드

`syn.uicontrols.$chartjs.<메서드명>(...)` 형태로 호출합니다.

| 메서드 | 설명 |
|---|---|
| `getChartControl(elID)` | 등록된 컨트롤 래퍼 객체(`{ id, chart, config, value }`)를 반환합니다. `chart`가 실제 Chart.js 인스턴스, `config`가 병합된 setting 객체입니다. ⚠ `$chart.getChartControl`(Highcharts 쪽)은 래퍼가 아니라 차트 인스턴스를 바로 반환하므로 두 메서드의 반환 모양이 다릅니다. |
| `getValue(elID, meta)` | ⚠ 항상 빈 문자열(`''`)을 반환합니다. 실제 구현이 되어 있지 않은 스텁(stub) 메서드입니다. 현재 표시 중인 데이터를 읽어오려면 `setValue`에 넘겼던 원본 데이터를 페이지 쪽에서 직접 보관하거나, `getChartControl(elID).chart.data`로 Chart.js 내부 데이터를 직접 읽으세요. |
| `setValue(elID, value, metaColumns)` | DB 조회 결과처럼 "행 배열"과 "컬럼 메타데이터"를 받아 `labels`/`datasets`를 자동으로 구성하고 `chart.update()`를 호출합니다. 아래 "setValue 동작 방식" 참고 |
| `clear(elID, isControlLoad)` | `data.labels`/`data.datasets`를 비우고 `chart.update()`를 호출합니다(차트 인스턴스 자체는 유지). |
| `toImage(elID, fileID)` | 차트를 PNG로 내보냅니다. `$chart.toImage`와 동일하게 정의되지 않은 전역 `download`를 참조하므로 `ReferenceError`가 발생할 수 있습니다(아래 "알려진 이슈" 참고). |
| `randomScalingFactor(min, max)` / `rand(min, max)` | 테스트/데모용 난수 생성 유틸리티(시드 기반 의사난수) |
| `setLocale(elID, translations, control, options)` | 다국어 적용 훅. 본문이 비어 있는 빈 함수이므로 호출해도 아무 효과가 없습니다. |

> `controlLoad(elID, setting)`은 프레임워크가 자동으로 호출하는 내부 진입점입니다. 직접 호출할 일은 거의 없습니다.

### setValue 동작 방식

```js
syn.uicontrols.$chartjs.setValue('chtChart', dataSource, metaColumns);
```

- `dataSource`: 행 객체 배열. 예) `[{ YEAR: 2024, AMOUNT: 12 }, { YEAR: 2025, AMOUNT: 35 }]`
- `metaColumns`: 컬럼명을 키로 하는 메타 객체. 각 값은 `{ FieldID, DataType }` 형태이며 `DataType`은 `'string'`/`'bool'`/`'number'`/`'int'`/`'date'` 중 하나여야 합니다. 예) `{ YEAR: { FieldID: 'YEAR', DataType: 'int' }, AMOUNT: { FieldID: 'AMOUNT', DataType: 'int' } }`
- 동작 순서:
  1. 기존 `labels`/`datasets`를 비웁니다.
  2. `dataSource`의 첫 번째 행을 기준으로 각 컬럼 값이 `metaColumns[컬럼명].DataType`과 맞는지 검사합니다(예: `DataType: 'int'`인데 값이 숫자도 숫자 문자열도 아니면 타입 불일치). `metaColumns`에 없는 컬럼은 검사를 건너뜁니다(`continue`).
  3. 타입이 하나라도 불일치하면 `syn.$l.eventLog(..., 'Debug')`로 에러만 남기고 데이터 반영을 하지 않습니다(단, 이미 비워둔 상태로 `chart.update()`는 호출됩니다 → 결과적으로 차트가 빈 화면이 됨).
  4. 타입 검사를 통과하면 `config.labelID` 컬럼 값을 `data.labels`로 사용합니다.
  5. `config.series`가 있으면 그 안에 정의된 `columnID`만 데이터셋으로 만들고(`label`/`fill` 반영), 없으면 `labelID`를 제외한 나머지 모든 컬럼을 컬럼명 그대로 라벨로 써서 데이터셋을 만듭니다.
  6. `chart.update()`를 호출해 화면을 갱신합니다.

### 알려진 이슈 (소스 코드로 확인됨)

- `getValue`는 항상 `''`을 반환하는 미구현 스텁입니다. 화면에 그려진 데이터를 다시 읽어야 한다면 `setValue`에 넘긴 원본 배열을 페이지 스크립트의 `prop`에 함께 보관해 두거나, `getChartControl(elID).chart.data`를 직접 읽으세요.
- `toImage`가 `$chart`와 동일하게 정의되지 않은 전역 `download`를 참조합니다. 이 저장소에는 `download`라는 전역 함수가 포함되어 있지 않으므로, 호출 시 `ReferenceError`가 발생할 수 있습니다. `getChartControl(elID).chart.toBase64Image()`로 base64 이미지를 직접 얻어 다운로드 링크(`<a download>`)를 만드는 방식을 권장합니다.
- `clear`/`setValue`/`toImage` 모두 `getChartControl(elID)`가 `null`인 경우(차트 미등록)를 방어하지 않는 부분이 있습니다. 특히 `labelID`를 비운 채로 로드하면 `controlLoad`가 중간에 `return`해 컨트롤이 아예 등록되지 않으므로, 이후 어떤 메서드를 호출해도 조용히 아무 일도 일어나지 않거나 예외가 발생합니다.
- 클릭 시 내부적으로 `console.log`만 남깁니다. `controlLoad`에서 클릭한 지점의 라벨/값을 `chart.getElementsAtEventForMode(...)`로 찾아 `console.log(label + ": " + value)`로 출력하는 코드가 있지만, 이 값을 페이지 스크립트의 `event` 객체로 전달하는 경로는 없습니다. 즉 `syn-events="['click']"`를 지정해도 이 값에는 접근할 수 없습니다. 클릭 시 페이지 로직을 실행하려면 Chart.js 자체의 `options.onClick` 콜백을 `syn-options.options`에 직접 넣으세요.

  ```html
  <syn_chartjs id="chtChart" syn-options="{
      type: 'bar',
      labelID: 'YEAR',
      options: {
          onClick(evt, elements, chart) {
              if (elements.length > 0) {
                  var idx = elements[0].index;
                  console.log(chart.data.labels[idx], chart.data.datasets[0].data[idx]);
              }
          }
      }
  }"></syn_chartjs>
  ```

### 이벤트 (syn-events)

`$chartjs`도 `$chart`와 마찬가지로, 페이지 스크립트의 `event` 객체와 실질적으로 연결되는 기본 제공 이벤트가 없습니다(위 "알려진 이슈"의 클릭 로그 참고). 데이터 포인트 클릭, 범례 클릭 등 상호작용이 필요하면 Chart.js의 콜백 옵션(`options.onClick`, `options.plugins.legend.onClick` 등)을 `syn-options`에 직접 작성해서 사용하세요.

---

## 참고

- Highcharts 옵션 전체 목록: https://api.highcharts.com/highcharts/
- Chart.js 옵션/차트 타입 전체 목록: https://www.chartjs.org/docs/latest/
- 벤더 라이브러리 로딩 경로(`wwwroot/js/syn.loader.js`):
  - `case 'chart':` → CSS `/uicontrols/Chart/Chart.css`, JS `/lib/highcharts/highcharts.min.js` + `/uicontrols/Chart/Chart.js`
  - `case 'chartjs':` → CSS `/uicontrols/Chart/ChartJS.css`, JS `/lib/chart.js/chart.umd.min.js` + `/uicontrols/Chart/ChartJS.js`
- 기존 샘플(엔진 B 전용): `wwwroot/sample/uicontrol/chartjs.html`, `wwwroot/sample/uicontrol/chartjs.js`
- 엔진 A(`$chart`, Highcharts)는 이 저장소 안에서 실사용 샘플/화면을 찾지 못했습니다. 이 문서의 엔진 A 관련 설명은 `Chart.js` 소스 코드 정독만으로 작성되었으므로, 실제 프로젝트에 적용하기 전 반드시 `example/chart-basic.html`로 직접 동작을 확인하세요.
