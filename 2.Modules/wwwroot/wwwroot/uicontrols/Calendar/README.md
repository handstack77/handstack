# Calendar (syn.uicontrols.$calendar)

## 이 컨트롤은 무엇인가요?

Calendar는 일정(이벤트)을 달력 형태로 보여주고 편집할 수 있게 해주는 컨트롤입니다.
내부적으로는 [FullCalendar](https://fullcalendar.io/) 라이브러리를 감싸서 `syn.uicontrols.$calendar` 싱글턴 객체로 제공합니다. 실제 화면 렌더링(월/주/일 뷰, 드래그&드롭, 리사이즈 등)은 모두 FullCalendar가 담당하고, `$calendar`는 그 위에서 데이터 매핑(`eventMapping`)과 변경 이력 추적(`Flag`)을 얹어주는 얇은 래퍼입니다.

## 언제 사용하나요?

- 일정 관리 화면(스케줄러, 예약 현황판, 근태/휴가 캘린더 등)처럼 날짜 축을 기준으로 여러 건의 이벤트를 보여줘야 할 때
- 사용자가 이벤트를 클릭/드래그해서 조회·이동·크기 조정을 하고, 그 변경분만 서버에 저장해야 할 때(`Flag` 기반 변경 추적 + `getterValue`)
- 월간/주간/리스트 뷰를 토글하면서 같은 데이터를 다양한 형태로 봐야 할 때

## 빠른 시작

중요: Calendar는 다른 대부분의 컨트롤(TreeView, WebGrid 등)과 달리 `syn.loader.js`가 필요한 라이브러리를 자동으로 찾아 넣어주지 않습니다. `syn.loader.js`는 `<syn_xxx>` 태그 이름을 보고 미리 정해진 CSS/JS 목록을 로드하는데, 아직 이 매핑 표에 `calendar`(→ `syn_calendar`)에 대한 항목이 등록되어 있지 않기 때문입니다. 그래서 FullCalendar 라이브러리 자체와 `Calendar.js`/`Calendar.css`까지 페이지에서 직접 `pageLoadFiles` 훅으로 등록해 줘야 합니다.

```html
<syn_calendar id="calSample" syn-options="{
    height: 500,
    initialView: 'dayGridMonth'
}" syn-events="['eventClick']"></syn_calendar>
```

```html
<script>
    function pageLoadFiles(styleFiles, jsFiles, templateFiles) {
        window.afterLoadFiles = [];
        // 1) FullCalendar 라이브러리(달력 엔진) 자체
        afterLoadFiles.push('/lib/fullcalendar/index.global.min.js');
        // 2) 한국어 로케일(요일/버튼 텍스트를 한글로)
        afterLoadFiles.push('/lib/fullcalendar/core/locales/ko.global.min.js');
        // 3) Calendar 컨트롤(syn.uicontrols.$calendar 정의)
        afterLoadFiles.push('/uicontrols/Calendar/Calendar.css');
        afterLoadFiles.push('/uicontrols/Calendar/Calendar.js');
    }
</script>
<script src="/js/syn.loader.js"></script>
```

```js
'use strict';
let $samplePage = {
    hook: {
        pageLoad() {
            syn.uicontrols.$calendar.setValue('calSample', [
                { ScheduleEventID: 1, ScheduleTitle: '킥오프 미팅', StartDate: '2026-07-06', EndDate: '2026-07-06' }
            ]);
        }
    },
    event: {
        calSample_eventClick(info) {
            syn.$l.eventLog('calSample_eventClick', info.event.title);
        }
    }
}
```

핵심 포인트:
- 마크업은 `<syn_calendar>` 커스텀 태그로 작성합니다.
- FullCalendar 라이브러리, 로케일 파일, `Calendar.js`/`Calendar.css` 4가지 전부를 `pageLoadFiles`(정확히는 `afterLoadFiles` 배열)로 직접 등록해야 합니다. 하나라도 빠뜨리면 `FullCalendar is not defined` 같은 에러가 나거나, 달력은 뜨지만 한글 대신 영어(Today, Month 등)로 표시됩니다.
- `syn-options`의 `eventMapping`을 통해 화면에 표시할 이벤트 데이터 컬럼명(예: `ScheduleEventID`, `ScheduleTitle`, `StartDate`, `EndDate`)을 실제 데이터 컬럼명에 맞게 바꿔 쓸 수 있습니다.
- 이벤트를 추가/수정/삭제하면 컨트롤이 내부적으로 `Flag`(`C`=생성, `U`=수정, `D`=삭제, `R`=변경없음)를 관리합니다. `getterValue`를 호출하면 변경된 이벤트만 뽑아낼 수 있어서, 전체 데이터를 다시 저장하지 않고 변경분만 서버로 보내는 패턴을 구현할 수 있습니다.

## 예제 실행하기

`example/` 폴더의 각 HTML 파일을 handstack의 wwwroot 정적 서버(예: rdy 프로젝트) 경로 아래에 두고 브라우저로 열면 바로 동작을 확인할 수 있습니다.

- `basic.html` : 월간 뷰에 샘플 일정을 채워 넣고, `getEvents`/`getterValue`/`gotoDate`/`changeView`/`clear`를 버튼으로 확인하는 기본 예제
- `events.html` : `eventClick`/`datesSet` 이벤트를 로그로 확인하고, `addEvent`/`updateEvent`/`removeEvent` 후 `getterValue`로 변경된 이벤트만 걸러내는 예제

각 예제는 화면 하단 로그 영역(`syn.$l.eventLog` 출력)에서 이벤트 발생 순서와 전달값을 확인할 수 있습니다.

## 더 알아보기

- API 상세는 같은 폴더의 `API.md`를 참고하세요.
- 실제 소스: `wwwroot/uicontrols/Calendar/Calendar.js`, `Calendar.css`
- FullCalendar 에셋 위치: `wwwroot/lib/fullcalendar/`(`index.global.min.js`, `core/locales/ko.global.min.js` 등)
- 실사용 예: qcn.groupware 매장 스케줄 화면의 `syn_calendar` 사용 패턴(월간 일정을 그리고, `datesSet`으로 조회 기간이 바뀔 때마다 서버에서 다시 데이터를 받아오는 흐름) — `eventMapping`으로 `ShopDailyTaskID`/`EventName`/`StartDate`/`EndDate` 등 실제 컬럼명을 매핑하고, `eventDidMount`로 이벤트 DOM을 커스터마이징합니다.
- FullCalendar 원본 문서: https://fullcalendar.io/docs
