# DatePicker (syn.uicontrols.$datepicker)

## 이 컨트롤은 무엇인가요?

`DatePicker`는 `<syn_datepicker>` 태그 하나로 "달력 아이콘 버튼 + 날짜 입력창"을 만들어 주는 레거시 내부 JS UI 컨트롤입니다.
실제 화면에서는 [Pikaday](https://github.com/Pikaday/Pikaday) 라이브러리를 내부적으로 사용해서 달력 팝업을 그리고, 선택한 날짜를 텍스트 입력창(`input[type=text]`)에 채워 넣습니다.

`syn.loader.js`가 페이지에 있는 `<syn_datepicker>` 태그를 찾아서 자동으로 다음을 처리합니다.

- `DatePicker.js` / `DatePicker.css` 등 필요한 스크립트·스타일 자동 주입
- 원래 태그를 숨김 처리(`display: none`)하고, 그 옆에 실제 보이는 `input`과 달력 버튼을 생성
- `syn.uicontrols.$datepicker` 싱글턴 객체에 컨트롤 정보 등록 (`getValue` / `setValue` / `clear` 등으로 제어 가능)

이름은 `$datepicker` 이지만, 페이지에서 사용하는 태그명은 `syn_datepicker` 입니다. 이 문서 전체에서 "DatePicker 컨트롤"이라 하면 이 둘을 함께 가리킵니다.

## 언제 사용하나요?

- 회원 가입일, 계약일, 마감일처럼 날짜 1개만 입력받아야 할 때 사용합니다.
- 조회 시작일/종료일처럼 날짜 2개(기간) 를 하나의 짝으로 다루어야 한다면 `DatePicker`를 2개 두고 `useRangeSelect` 옵션으로 서로 연동시키거나(아래 API.md 참고), 또는 형제 컨트롤인 `DatePeriodPicker` (`syn.uicontrols.$dateperiodpicker`) 를 사용하는 것이 더 간단합니다. `DatePeriodPicker`는 시작일~종료일을 하나의 컨트롤에서 한 번에 관리하도록 설계된 별도 컨트롤입니다.
- 요약하면:
  - 날짜 1개, 단순 입력 → `DatePicker`
  - 날짜 1개씩이지만 두 개를 서로 최소/최대로 연동하고 싶다 → `DatePicker` + `useRangeSelect`
  - 처음부터 "기간(period)" 개념으로 다루고 싶다 → `DatePeriodPicker`

## 빠른 시작

```html
<form autocomplete="off" id="form1" syn-datafield="MainForm">
    <syn_datepicker id="dtpBirthday" syn-datafield="Birthday"></syn_datepicker>
</form>

<script src="/js/syn.loader.js"></script>
```

이렇게만 작성해도 `syn.loader.js`가 알아서 필요한 리소스를 불러오고, 화면에는 텍스트 입력창과 달력 아이콘 버튼이 나타납니다. 버튼을 누르면 달력이 열리고, 날짜를 클릭하면 입력창에 값이 채워집니다.

값을 코드로 다루고 싶다면 아래처럼 `syn.uicontrols.$datepicker`를 사용합니다.

```javascript
// 값 읽기
var value = syn.uicontrols.$datepicker.getValue('dtpBirthday'); // 예: '2026-07-06'

// 값 설정
syn.uicontrols.$datepicker.setValue('dtpBirthday', '2026-01-01');

// 값 초기화
syn.uicontrols.$datepicker.clear('dtpBirthday');
```

## 예제 실행하기

이 폴더의 `example` 하위 폴더에 있는 HTML 파일을 웹서버(예: rdy 실행 중인 wwwroot)를 통해 브라우저로 열어보세요. `file://`로 직접 열면 `syn.loader.js`가 정상 동작하지 않을 수 있으니 반드시 프로젝트를 실행한 상태에서 접속해야 합니다.

- `example/basic.html` : 가장 단순한 날짜 1개 선택 예제
- `example/format.html` : `format`, `minDate`, `maxDate` 등 옵션 예제
- `example/events.html` : 선택(`onselect`) 이벤트, `getValue`/`setValue`/`clear` 버튼 데모

각 HTML은 같은 이름의 `.js` 파일과 짝을 이루며, 화면 하단 로그 영역에 `syn.$l.eventLog`로 동작 로그가 출력됩니다.

## 더 알아보기

- 상세 옵션·메서드·이벤트 표는 [API.md](./API.md) 문서를 참고하세요.
- 달력 팝업 자체의 세부 동작(연/월 이동, 다중 월 표시 등)은 내부적으로 사용하는 Pikaday 라이브러리 문서를 참고하세요: https://github.com/Pikaday/Pikaday
- 기간(시작일~종료일)을 한 번에 다루려면 형제 컨트롤 `DatePeriodPicker`(`syn.uicontrols.$dateperiodpicker`)를 확인하세요.
- 소스 위치: `uicontrols/DatePicker/DatePicker.js`, `uicontrols/DatePicker/DatePicker.css`
