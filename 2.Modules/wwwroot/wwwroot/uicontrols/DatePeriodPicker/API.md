# DatePeriodPicker API 참조

`syn.uicontrols.$dateperiodpicker`

## 마크업

```html
<syn_dateperiodpicker id="dtpSearchPeriod" syn-datafield="SearchPeriod" syn-events="['onselect', 'onreset', 'onconfirm']" syn-options="{
    value: 'month:3',
    startDataFieldID: 'SearchStartedDate',
    endDataFieldID: 'SearchEndedDate',
    belongID: 'M01'
}"></syn_dateperiodpicker>
```

- `syn.loader.js`가 로드되면서 `controlLoad(elID, setting)`이 자동 호출되어 원래 `<syn_dateperiodpicker>` 태그는 `elID + '_hidden'`으로 숨겨지고, 그 자리에 다음 요소들이 순서대로 생성됩니다.
  - 시작일 입력창: id = `{elID}_StartedAt` (내부적으로 `syn.uicontrols.$textbox`에 `editType: 'date'`, `maskPattern: '9999-99-99'`로 등록)
  - `~` 구분 `<span>`
  - 종료일 입력창: id = `{elID}_EndedAt` (시작일 입력창과 동일한 방식으로 등록)
  - 달력 버튼: id = `{elID}_Button`
- `syn-events`에 지정한 이벤트 이름 배열은 시작일/종료일 입력창 두 곳에 그대로 복사되며, 팝업에서 발생하는 `onselect`/`onreset`/`onconfirm` 이벤트를 페이지 스크립트로 전달하는 데 사용됩니다.
- 페이지 안에서 `<syn_dateperiodpicker>`를 몇 개를 쓰더라도, 빠른 선택 버튼이 포함된 팝업(`#divPeriodPicker`)과 Pikaday 인스턴스 2개(시작일용/종료일용)는 페이지 전체에서 1세트만 공유됩니다. 버튼을 누른 컨트롤의 id가 팝업의 `elID` 속성에 기록되고, "확인"/"기간 선택 취소" 버튼 클릭 시 이 `elID`를 기준으로 어떤 컨트롤에 값을 반영할지 결정합니다.

## Options (defaultSetting)

| 옵션 | 타입/기본값 | 설명 |
| --- | --- | --- |
| `elID` | string | 컨트롤 로드시 내부적으로 자동 채워짐(직접 지정할 필요 없음) |
| `width` | string, 기본 `'100%'` | 컨트롤 전체 폭(참고용 값, 실제 폭은 생성된 입력창들의 CSS에 따름) |
| `value` | string, 기본 `''` | 초기값 축약 표기. 아래 "value 축약 표기" 표 참고 |
| `defaultDate` / `setDefaultDate` | Pikaday 옵션 그대로 전달 | 달력을 처음 열 때 표시할 기본 날짜 |
| `minDate` / `maxDate` | Date, 기본 `null` | 선택 가능한 최소/최대 날짜(Pikaday에 그대로 전달) |
| `bound` | boolean, 기본 `false` | Pikaday 옵션. 이 컨트롤은 팝업 표시/숨김을 자체 로직(`showPopup`/`hidePopup`)으로 제어하므로 기본값 `false` 사용 |
| `format` | string, 기본 `'YYYY-MM-DD'` | Pikaday에 전달되는 날짜 포맷(moment 포맷 문자열) |
| `ariaLabel` | string, 기본 `'날짜를 선택 하세요'` | 달력 접근성 라벨 |
| `i18n` | object | 월/요일 이름 등 한글 로케일 텍스트(기본값이 이미 한글로 설정되어 있어 보통 그대로 사용) |
| `showWeekNumber` | boolean, 기본 `false` | 주차 번호 표시 여부 |
| `showMonthAfterYear` | boolean, 기본 `true` | 달력 헤더에 "년도 다음에 월" 순서로 표시 |
| `showDaysInNextAndPreviousMonths` | boolean, 기본 `true` | 이전/다음 달 날짜를 회색으로 함께 표시 |
| `enableSelectionDaysInNextAndPreviousMonths` | boolean, 기본 `true` | 이전/다음 달 날짜도 선택 가능하게 할지 여부 |
| `yearSuffix` | string, 기본 `'년'` | 연도 뒤에 붙는 접미사 |
| `firstDay` | number, 기본 `0` | 한 주의 시작 요일(0=일요일) |
| `numberOfMonths` | number, 기본 `1` | 달력 하나에 동시에 표시할 월 수 |
| `startDataFieldID` | string, 기본 `''` | 생성되는 시작일 입력창의 `syn-datafield` 값. 비우면 `{elID}_StartedAt` 사용 |
| `endDataFieldID` | string, 기본 `''` | 생성되는 종료일 입력창의 `syn-datafield` 값. 비우면 `{elID}_EndedAt` 사용 |
| `startClassName` | string, 기본 `'form-control'` | 시작일 입력창에 적용할 CSS class |
| `endClassName` | string, 기본 `'form-control'` | 종료일 입력창에 적용할 CSS class |
| `dataType` | string, 기본 `'string'` | 다른 컨트롤과 동일한 관례로 정의만 되어 있으며, 이 컨트롤의 `clear()`는 값 형식과 무관하게 항상 빈 문자열로 초기화함(내부에서 별도로 참조하지 않음) |
| `belongID` | string \| array, 기본 `null` | 소속 그룹/프레임 식별자. 지정하면 생성되는 시작일/종료일 입력창의 `syn-options`에 그대로 전달됨 |
| `getter` / `setter` | boolean, 기본 `false` | 다른 컨트롤과 동일한 표준 옵션(정의되어 있으나 이 컨트롤 내부 로직에서 직접 참조하지는 않음) |
| `controlText` | string, 기본 `null` | 컨트롤 표시명(다른 컨트롤과 동일한 관례) |
| `validators` | array, 기본 `null` | 폼 전송 검증 규칙(다른 컨트롤과 동일한 관례) |
| `transactConfig` / `triggerConfig` | object, 기본 `null` | 트랜잭션/트리거 연동 설정(다른 컨트롤과 동일한 관례) |

### value 축약 표기

`value` 옵션에 아래 형식의 문자열을 지정하면 컨트롤 로드 시 시작일/종료일 입력창에 초기값이 자동으로 채워집니다(오늘 날짜 기준으로 계산).

| 표기 | 의미 | 숫자가 음수일 때 | 숫자가 0 이상일 때 |
| --- | --- | --- | --- |
| `'now'` | 오늘 하루 | - | 시작일 = 종료일 = 오늘 |
| `'day:N'` | 오늘 기준 N일 | 시작일 = N일 전, 종료일 = 오늘 | 시작일 = 오늘, 종료일 = N일 후 |
| `'week:N'` | 오늘 기준 N주 | 시작일 = N주 전, 종료일 = 오늘 | 시작일 = 오늘, 종료일 = N주 후 |
| `'month:N'` | 오늘 기준 N개월 | 시작일 = N개월 전, 종료일 = 오늘 | 시작일 = 오늘, 종료일 = N개월 후 |
| `'year:N'` | 오늘 기준 N년 | 시작일 = N년 전, 종료일 = 오늘 | 시작일 = 오늘, 종료일 = N년 후 |

예: `value: 'month:3'` → 시작일 = 오늘, 종료일 = 3개월 후. `value: 'day:-7'` → 시작일 = 7일 전, 종료일 = 오늘.

이 표기는 컨트롤이 처음 로드될 때 입력창의 표시값만 채워주는 용도이며, 사용자가 팝업을 열어 직접 확인/변경할 수 있습니다.

## 메서드

| 메서드 | 매개변수 | 설명 |
| --- | --- | --- |
| `controlLoad(elID, setting)` | 요소 id, 옵션 객체 | 컨트롤 초기화(페이지 로드시 자동 호출됨) |
| `getValue(elID)` | 요소 id | `"시작일 ~ 종료일"` 형식의 문자열 반환(예: `'2026-07-01 ~ 2026-07-06'`). 값이 비어있으면 해당 부분이 빈 문자열로 채워짐 |
| `setValue(elID, value)` | 요소 id, 값 | `value`를 콤마(`,`)로 분리해 앞부분을 시작일, 뒷부분을 종료일 입력창에 채움. 콤마가 없으면 같은 값을 시작일/종료일에 동일하게 채움(단일 날짜 지정) |
| `clear(elID, isControlLoad)` | 요소 id | 시작일/종료일 입력창을 모두 빈 문자열로 초기화 |
| `getControl(elID)` | 요소 id | 내부 관리 객체 `{id, textbox1ID, textbox2ID, setting}` 반환. `textbox1ID`/`textbox2ID`로 생성된 시작일/종료일 입력창 id를 알 수 있음 |
| `showPopup(elID)` | 요소 id | 공용 팝업을 해당 컨트롤 아래에 열기(달력 버튼 클릭과 동일한 동작) |
| `hidePopup()` | - | 공용 팝업 닫기 |
| `setDateRange(startDate, endDate)` | `'YYYY-MM-DD'` 문자열 2개 | 팝업이 열려있는 상태에서 좌우 달력의 선택 날짜와 "선택기간: N일" 표시를 갱신함. 팝업 내부 상태만 바꾸며, 실제 입력창 값은 사용자가 "확인" 버튼을 눌러야 반영됨(코드로 값을 곧바로 채우고 싶다면 `setValue`를 사용) |
| `setLocale(elID, translations, control, options)` | - | 다국어 로케일 훅. 현재 구현은 빈 함수(아무 동작 없음) |

> 팝업 안의 "올해/오늘까지/오늘/전일/주간/전주/당월/이전달/전년도/전전년도/1~4분기/상반기/하반기/월별 체크박스/기간 선택 취소/확인" 버튼들은 모두 `setDateRange`를 내부적으로 호출하는 전용 클릭 핸들러(`_DatePeriodPicker_btnXxx_click`)로 구현되어 있으며, 페이지 스크립트에서 직접 호출하도록 만들어진 공개 API는 아닙니다.

## 이벤트 (syn-events)

`syn-events`에 이벤트 이름을 배열로 지정하면, 페이지 스크립트의 `event.{elID}_{이벤트명}` 함수가 호출됩니다. DatePeriodPicker는 표준 DOM 이벤트 대신 아래 3개의 전용 이벤트를 사용합니다.

| 이벤트 | 호출 시점 | 콜백 인자 |
| --- | --- | --- |
| `onselect` | 팝업이 열린 상태에서 좌측(시작일) 또는 우측(종료일) 달력에서 날짜를 클릭할 때마다 | `(elID, which, date)` — `which`는 `'startedAt'` 또는 `'endedAt'`, `date`는 선택한 날짜의 `Date` 객체 |
| `onreset` | 팝업의 "기간 선택 취소" 버튼 클릭 시 | `(elID, startValue, endValue)` — 이 시점에는 두 값 모두 빈 문자열 |
| `onconfirm` | 팝업의 "확인" 버튼 클릭 시(입력창에 값이 실제로 반영된 직후) | `(elID, startValue, endValue)` — `'YYYY-MM-DD'` 형식 문자열 |

```html
<syn_dateperiodpicker id="dtpSearchPeriod" syn-options="{}" syn-events="['onselect', 'onreset', 'onconfirm']"></syn_dateperiodpicker>
```

```js
let $sample = {
    event: {
        dtpSearchPeriod_onselect(elID, which, date) {
            syn.$l.eventLog('dtpSearchPeriod_onselect', `${which}: ${date}`);
        },
        dtpSearchPeriod_onreset(elID, startValue, endValue) {
            syn.$l.eventLog('dtpSearchPeriod_onreset', `${startValue} ~ ${endValue}`);
        },
        dtpSearchPeriod_onconfirm(elID, startValue, endValue) {
            syn.$l.eventLog('dtpSearchPeriod_onconfirm', `${startValue} ~ ${endValue}`);
        }
    }
}
```

추가로 알아둘 점:

- "확인" 버튼 클릭 시 시작일이 종료일보다 크면 `syn.$w.alert('시작일자가 종료일자 보다 클 수 없습니다.')`가 표시되고 팝업이 닫히지 않으며, `onconfirm`도 호출되지 않습니다.
- 시작일/종료일 입력창에 키보드로 직접 값을 입력한 뒤 포커스를 벗어나면(blur), 시작일 > 종료일인 경우 자동으로 값이 서로 맞춰집니다(별도 이벤트 없음).
- 페이지에 `<syn_dateperiodpicker>`가 여러 개 있는 경우 팝업과 Pikaday 인스턴스가 공유되므로, `onselect` 콜백에 전달되는 `elID`는 내부 구현상 페이지에서 가장 먼저 로드된 컨트롤의 id로 고정됩니다(공유 팝업 생성 시점의 클로저를 그대로 사용하기 때문). 반면 `onreset`/`onconfirm`의 `elID`는 팝업을 실제로 열었던 컨트롤 id를 정확히 사용합니다. 페이지에 컨트롤이 1개뿐이라면 이 차이는 드러나지 않습니다.

## 참고

- 소스: `DatePeriodPicker.js`, `DatePeriodPicker.css`
- 이 컨트롤 전용 표준 샘플 페이지(`sample/uicontrol`)는 아직 없습니다. 위 내용은 `DatePeriodPicker.js` 전체 소스 코드를 직접 읽어 확인한 사실이며, 실제 사용 마크업 스타일(`value: 'month:3'`, `startDataFieldID`/`endDataFieldID` 등)은 `qcn.groupware` 저장소의 `modules/bridal/wwwroot/bridal/view/HDS/BDL/BOD001.html` 실사용 예시를 참고했습니다(단, 그 예시에서 사용된 `belongID: ['MD01']` 배열 표기도 소스 코드상 실제로 지원되는 것을 확인했습니다).
- 시작일/종료일 입력창 자체의 문자 입력 마스크·형식 검증 동작은 `TextBox` 컨트롤(`editType: 'date'`)과 동일합니다.
- 예제는 [example](./example) 폴더, 사용 개요는 [README.md](./README.md)를 참고하세요.
