# DatePeriodPicker (syn.uicontrols.$dateperiodpicker)

## 이 컨트롤은 무엇인가요?

`DatePeriodPicker`는 `<syn_dateperiodpicker>` 태그 하나로 "시작일 입력창 + `~` + 종료일 입력창 + 달력 아이콘 버튼"을 만들어 주는 레거시 내부 JS UI 컨트롤입니다. 버튼을 누르면 화면 우측에 시작일용/종료일용 달력 2개와, "올해/오늘까지/오늘/전일/주간/전주/당월/이전달/전년도/전전년도/1~4분기/상반기/하반기/1~12월" 같은 자주 쓰는 기간을 한 번에 선택할 수 있는 빠른 선택 버튼 모음(팝업)이 함께 나타납니다.

내부적으로는 [Pikaday](https://github.com/Pikaday/Pikaday) 달력 라이브러리를 시작일/종료일 각각 하나씩(총 2개) 사용하며, 실제로 화면에 보이는 시작일/종료일 입력창 2개는 `syn.uicontrols.$textbox`(`editType: 'date'`) 컨트롤로 각각 초기화됩니다. 즉 DatePeriodPicker 하나는 내부적으로 텍스트박스 2개 + 공용 팝업 1개로 구성됩니다.

`syn.loader.js`가 페이지에 있는 `<syn_dateperiodpicker>` 태그를 찾아서 자동으로 다음을 처리합니다.

- `DatePeriodPicker.js` / `DatePeriodPicker.css` 등 필요한 스크립트·스타일 자동 주입
- 원래 태그를 숨김 처리(`display: none`)하고, 그 옆에 실제 보이는 시작일 입력창, `~` 구분자, 종료일 입력창, 달력 버튼을 순서대로 생성
- 페이지 안에 하나뿐인 공용 팝업(`#divPeriodPicker`)을 최초 1회 생성하고, 팝업 안 빠른 선택 버튼들에 이벤트를 연결
- `syn.uicontrols.$dateperiodpicker` 싱글턴 객체에 컨트롤 정보 등록 (`getValue` / `setValue` / `clear` 등으로 제어 가능)

이름은 `$dateperiodpicker`이지만, 페이지에서 사용하는 태그명은 `syn_dateperiodpicker`입니다. 이 문서 전체에서 "DatePeriodPicker 컨트롤"이라 하면 이 둘을 함께 가리킵니다.

> 이 컨트롤은 아직 `sample/uicontrol` 아래에 표준 데모 페이지가 없습니다. 이 문서의 API 사실 근거는 `DatePeriodPicker.js` 소스 코드 전체를 직접 읽고 확인한 내용이며, 실사용 마크업 스타일은 `qcn.groupware` 저장소의 `modules/bridal/wwwroot/bridal/view/HDS/BDL/BOD001.html` 예시(참고용)를 참고했습니다.

## 언제 사용하나요?

- 형제 컨트롤인 `DatePicker`(`syn.uicontrols.$datepicker`) 는 날짜 1개만 다룹니다.
- `DatePeriodPicker`는 처음부터 "기간(period)" 개념으로 설계되어, 시작일~종료일 한 쌍을 태그 하나로 관리합니다.
- 요약하면:
  - 날짜 1개, 단순 입력 → `DatePicker`
  - 조회 시작일/종료일처럼 기간을 하나의 값으로 다루고 싶다 → `DatePeriodPicker`
  - "최근 1주일", "이번 달", "1분기"처럼 자주 쓰는 기간을 버튼 한 번으로 선택하게 하고 싶다 → `DatePeriodPicker`(팝업에 프리셋 버튼이 내장되어 있음)

## 빠른 시작

```html
<form autocomplete="off" id="form1" syn-datafield="MainForm">
    <syn_dateperiodpicker id="dtpSearchPeriod" syn-datafield="SearchPeriod"></syn_dateperiodpicker>
</form>

<script src="/js/syn.loader.js"></script>
```

이렇게만 작성해도 `syn.loader.js`가 알아서 필요한 리소스를 불러오고, 화면에는 "시작일 입력창 ~ 종료일 입력창 + 달력 버튼"이 나타납니다. 버튼을 누르면 팝업이 열리고, 좌우 달력에서 시작일/종료일을 각각 클릭한 뒤 "확인" 버튼을 눌러야 실제 입력창에 값이 반영됩니다. 값을 지우려면 팝업의 "기간 선택 취소" 버튼을 사용합니다.

값을 코드로 다루고 싶다면 아래처럼 `syn.uicontrols.$dateperiodpicker`를 사용합니다.

```javascript
// 값 읽기 (형식: "시작일 ~ 종료일")
var value = syn.uicontrols.$dateperiodpicker.getValue('dtpSearchPeriod'); // 예: '2026-07-01 ~ 2026-07-06'

// 값 설정 (콤마로 시작일, 종료일 구분. 값이 1개면 시작일=종료일로 처리)
syn.uicontrols.$dateperiodpicker.setValue('dtpSearchPeriod', '2026-01-01,2026-01-31');

// 값 초기화
syn.uicontrols.$dateperiodpicker.clear('dtpSearchPeriod');
```

시작일/종료일을 서로 다른 데이터필드에 매핑하고, 기본값을 "오늘부터 3개월 후까지"로 지정하고 싶다면 다음처럼 사용할 수 있습니다(실사용 예: qcn.groupware의 공지 게시 기간).

```html
<syn_dateperiodpicker id="dtpAlertPeriod" syn-datafield="AlertPeriod" syn-events="['onselect']" syn-options="{
    value: 'month:3', startDataFieldID: 'AlertStartedDate', endDataFieldID: 'AlertEndedDate'
}"></syn_dateperiodpicker>
```

## 예제 실행하기

이 폴더의 `example` 하위 폴더에 있는 HTML 파일을 웹서버(예: rdy 실행 중인 wwwroot)를 통해 브라우저로 열어보세요. `file://`로 직접 열면 `syn.loader.js`가 정상 동작하지 않을 수 있으니 반드시 프로젝트를 실행한 상태에서 접속해야 합니다.

- `example/basic.html` : 가장 단순한 기간 선택 예제(팝업의 빠른 선택 버튼 포함)
- `example/shorthand.html` : `value` 축약 표기(`'day:-7'`, `'month:3'` 등)로 초기값을 지정하는 예제
- `example/events.html` : `onselect`/`onreset`/`onconfirm` 이벤트, `getValue`/`setValue`/`clear` 버튼 데모
- `example/search.html` : 목록 화면 조회 기간 실무 패턴 - 기본 기간(`month:-3`)으로 `pageLoad` 시 즉시 조회, `_StartedAt`/`_EndedAt` 문자열 비교로 시작일 > 종료일 검증

각 HTML은 같은 이름의 `.js` 파일과 짝을 이루며, 화면 하단 로그 영역에 `syn.$l.eventLog`로 동작 로그가 출력됩니다.

## 더 알아보기

- 상세 옵션·메서드·이벤트 표는 [API.md](./API.md) 문서를 참고하세요.
- 달력 팝업 자체의 세부 동작(연/월 이동 등)은 내부적으로 사용하는 Pikaday 라이브러리 문서를 참고하세요: https://github.com/Pikaday/Pikaday
- 날짜 1개만 필요하다면 형제 컨트롤 `DatePicker`(`syn.uicontrols.$datepicker`)를 확인하세요.
- 소스 위치: `uicontrols/DatePeriodPicker/DatePeriodPicker.js`, `uicontrols/DatePeriodPicker/DatePeriodPicker.css`
