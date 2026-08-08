# DatePicker API 참조

> 소스 근거: `uicontrols/DatePicker/DatePicker.js` (`syn.uicontrols.$datepicker`, version `v2025.10.1`)

## 마크업

```html
<syn_datepicker
    id="dtpTourDate"
    syn-datafield="TourDate"
    syn-options="{belongID: ['UD01', 'MD01']}">
</syn_datepicker>
```

- `id` : 컨트롤 식별자. 필수. 이 id로 `getValue`/`setValue`/`clear`/`getControl`을 호출합니다.
- `syn-datafield` : 폼 전송/바인딩 시 사용할 데이터 필드명. 생략 가능.
- `syn-options` : 아래 "Options" 표의 값을 JSON 형태 문자열로 지정. 생략 가능.
- `syn-events` : 내부적으로 생성되는 실제 `input` 요소에 그대로 전달됩니다(예: `['change']`). 다만 날짜 선택 관련 이벤트는 아래 "이벤트" 절의 `{elID}_onselect` 관례를 사용하는 것을 권장합니다.

로더가 처리한 뒤 실제 DOM 구조는 다음과 같이 바뀝니다.

- 원래 `<syn_datepicker id="dtpTourDate">` 태그 → `id="dtpTourDate_hidden"`으로 변경되고 `display:none` 처리(내부 설정 보관용)
- 그 자리에 실제 보이는 `<input id="dtpTourDate" type="text">` 생성 (마스크 `9999-99-99`, `editType: 'date'` 자동 적용)
- 바로 뒤에 달력 아이콘 버튼 `<button id="dtpTourDate_Button">` 생성

## Options (defaultSetting)

| 옵션 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `elID` | string | `''` | 내부적으로 자동 설정됨(직접 지정 불필요) |
| `width` | string | `'100%'` | 컨트롤 너비 |
| `value` | string | `''` | 초기값. `'now'`, `'day:N'`, `'week:N'`, `'month:N'`, `'year:N'` 형태 지정 가능(N은 양/음수). 예: `'day:-7'` → 오늘 기준 7일 전 |
| `placeholder` | string | `''` | 입력창 placeholder. 값이 없을 때(달력 닫힘 시점 기준) 자동 적용 |
| `defaultDate` | Date/null | `null` | 달력을 열었을 때 기본으로 표시할 날짜(Pikaday 옵션) |
| `setDefaultDate` | boolean | `false` | `true`면 `defaultDate`를 실제 선택값으로도 사용 |
| `minDate` | Date/null | `null` | 선택 가능한 최소 날짜 |
| `maxDate` | Date/null | `null` | 선택 가능한 최대 날짜 |
| `bound` | boolean | `true` | 입력 필드에 종속되어 포커스/클릭 시 달력을 여닫을지 여부(Pikaday 옵션) |
| `format` | string | `'YYYY-MM-DD'` | 표시 날짜 포맷(moment.js 포맷 문자열) |
| `ariaLabel` | string | `'날짜를 선택 하세요'` | 접근성 라벨 |
| `i18n` | object | 한국어 월/요일 명 세트 | 달력에 표시할 월/요일 이름(직접 바꿀 일은 거의 없음) |
| `showWeekNumber` | boolean | `false` | 주차 번호 표시 여부 |
| `showMonthAfterYear` | boolean | `true` | 헤더에서 "연도 뒤에 월" 표시 순서 |
| `showDaysInNextAndPreviousMonths` | boolean | `true` | 이전/다음 달 날짜를 회색으로 함께 표시할지 여부 |
| `enableSelectionDaysInNextAndPreviousMonths` | boolean | `true` | 이전/다음 달의 흐린 날짜도 클릭 선택 가능하게 할지 여부 |
| `yearSuffix` | string | `'년'` | 연도 뒤에 붙는 접미사 |
| `firstDay` | number | `0` | 한 주의 시작 요일(0=일요일) |
| `useRangeSelect` | boolean | `false` | `true`로 설정하면 다른 `DatePicker`와 시작일/종료일로 연동(2개 이상 짝) |
| `rangeStartControlID` | string/null | `null` | `useRangeSelect: true`일 때 시작일 컨트롤 id. 생략 시 자기 자신 id |
| `rangeEndControlID` | string/null | `null` | `useRangeSelect: true`일 때 종료일 컨트롤 id. 생략 시 자기 자신 id |
| `numberOfMonths` | number | `1` | 달력에 동시에 표시할 개월 수 |
| `dataType` | string | `'string'` | 값 데이터 타입 |
| `belongID` | string/array/null | `null` | 하위 텍스트박스 컨트롤에 전달되는 소속 그룹 식별자(예: 컨테이너/폼 그룹 연동용). 값이 있으면 배열/문자열 여부에 따라 자동으로 JSON 처리되어 내부 `input`의 `syn-options`에 전달됨 |
| `getter` | boolean | `false` | 값 조회 시 커스텀 처리 여부(프레임워크 공통 옵션) |
| `setter` | boolean | `false` | 값 설정 시 커스텀 처리 여부(프레임워크 공통 옵션) |
| `controlText` | any/null | `null` | 표시용 텍스트 커스터마이즈(프레임워크 공통 옵션) |
| `validators` | any/null | `null` | 유효성 검사 규칙(프레임워크 공통 옵션) |
| `transactConfig` | any/null | `null` | 트랜잭션 연동 설정(프레임워크 공통 옵션) |
| `triggerConfig` | any/null | `null` | 트리거 연동 설정(프레임워크 공통 옵션) |

> `useRangeSelect` 사용 예:
> ```html
> <syn_datepicker id="dtpStart" syn-options="{useRangeSelect: true, rangeEndControlID: 'dtpEnd'}"></syn_datepicker>
> <syn_datepicker id="dtpEnd" syn-options="{useRangeSelect: true, rangeStartControlID: 'dtpStart'}"></syn_datepicker>
> ```
> 시작일을 선택하면 종료일의 `minDate`가 자동으로 갱신되고, 종료일을 선택하면 시작일의 `maxDate`가 자동으로 갱신됩니다.

## 메서드

| 메서드 | 시그니처 | 설명 |
|---|---|---|
| `getValue` | `getValue(elID, meta)` | 입력창(실제 `input`)에 표시된 현재 값을 문자열로 반환 |
| `setValue` | `setValue(elID, value, meta)` | 지정한 값으로 날짜를 설정(Pikaday `setDate` 사용). `value`는 `Date` 객체 또는 파싱 가능한 날짜 문자열 |
| `clear` | `clear(elID, isControlLoad)` | 선택값을 초기화(Pikaday `clear` 사용) |
| `getControl` | `getControl(elID)` | `{ id, picker, setting }` 형태의 내부 컨트롤 객체 반환. `picker`는 Pikaday 인스턴스([Pikaday 메서드 문서](https://github.com/Pikaday/Pikaday) 참고: `getDate()`, `setDate()`, `show()`, `hide()`, `setMinDate()`, `setMaxDate()` 등) |
| `updateRangeDate` | `updateRangeDate(elID, date)` | `useRangeSelect` 연동 컨트롤 간 날짜 갱신(내부용, 직접 호출할 일 거의 없음) |
| `setLocale` | `setLocale(elID, translations, control, options)` | 로케일 훅(현재 구현은 비어 있음 — 다국어 전환 시 확장 지점) |

## 이벤트 (syn-events)

DatePicker는 다른 컨트롤처럼 `syn-events` 속성에 이벤트 이름을 나열하는 방식이 아니라, 페이지 스크립트의 `event` 객체에 `{elID}_onselect` 함수를 정의해두면 자동으로 호출되는 관례를 사용합니다.

| 이벤트(관례 함수명) | 호출 시점 | 콜백 인자 |
|---|---|---|
| `{elID}_onselect(elID, date)` | 달력이 열릴 때(`onOpen`), 닫힐 때(`onClose`), 날짜를 클릭해 선택할 때(`onSelect`) 모두 동일하게 호출됨 | `elID` : 컨트롤 id(string), `date` : 현재 Pikaday `getDate()` 결과(Date 객체, 선택 안 됐으면 `null`일 수 있음) |

예:

```javascript
let $mypage = {
    event: {
        dtpTourDate_onselect(elID, date) {
            syn.$l.eventLog('dtpTourDate_onselect', elID + ' => ' + date);
        }
    }
}
```

이 외에 실제 생성되는 `input` 요소는 텍스트박스 컨트롤(`syn.uicontrols.$textbox`)의 표준 이벤트(`change` 등)도 `syn-events` 속성을 통해 그대로 사용할 수 있습니다.

## 참고

- 내부적으로 [Pikaday](https://github.com/Pikaday/Pikaday)와 [moment.js](https://momentjs.com/)를 사용합니다.
- 기간(시작~종료) 개념 자체를 컨트롤 하나로 다루려면 형제 컨트롤 `DatePeriodPicker`(`syn.uicontrols.$dateperiodpicker`)를 사용하세요.
- 예제: `example/basic.html`, `example/format.html`, `example/events.html`
