# Calendar API 참조

싱글턴 객체: `syn.uicontrols.$calendar`
소스 파일: `wwwroot/uicontrols/Calendar/Calendar.js`, `wwwroot/uicontrols/Calendar/Calendar.css`
내부 라이브러리: [FullCalendar](https://fullcalendar.io/docs) (`new FullCalendar.Calendar(el, options)`)

## 마크업

```html
<syn_calendar id="calSample" syn-options="{
    height: 'calc(100vh - 100px)',
    initialView: 'dayGridMonth',
    headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,listWeek' },
    eventMapping: {
        id: 'ScheduleEventID', title: 'ScheduleTitle', start: 'StartDate', end: 'EndDate',
        backgroundColor: 'BackgroundColor', borderColor: 'BackgroundColor', textColor: 'TextColor'
    },
    selectable: true,
    editable: true
}" syn-events="['eventClick', 'datesSet', 'eventDrop', 'eventResize']"></syn_calendar>
```

중요: `syn.loader.js`에는 `syn_calendar` 태그에 대응하는 CSS/JS 자동 로드 항목(`case 'calendar'`)이 없습니다. FullCalendar 라이브러리, 로케일 파일, `Calendar.js`/`Calendar.css`를 모두 페이지의 `pageLoadFiles` 훅(`afterLoadFiles` 배열)으로 직접 등록해야만 컨트롤이 동작합니다. 자세한 코드는 `README.md`의 "빠른 시작"과 `example/` 폴더를 참고하세요.

- `id`는 페이지 내에서 유일해야 하며, `syn.uicontrols.$calendar`의 각종 메서드에서 이 `id`(elID)를 사용합니다.
- `controlLoad` 실행 시 `new FullCalendar.Calendar(el, calendarSettings)`가 만들어지고 `calendar.render()`가 호출됩니다. 이때 `syn-options`에 지정한 값 전체가 `elID`/`syn-options` 속성으로 다시 기록되며(`el.setAttribute('syn-options', JSON.stringify(setting))`), `eventMapping`/`getter`/`setter`/`transactConfig`/`triggerConfig`/`elID`는 FullCalendar 자체 옵션에서는 제외되고 컨트롤 내부용으로만 쓰입니다.

## Options (defaultSetting)

| 속성 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `elID` | string | `''` | 내부적으로 `controlLoad` 시점에 채워지는 요소 id. 직접 지정할 필요 없음 |
| `height` | string \| number | `'auto'` | 달력 전체 높이(FullCalendar `height` 옵션 그대로 전달) |
| `expandRows` | boolean | `true` | 남는 세로 공간을 행에 맞춰 늘릴지 여부 |
| `locale` | string | `'ko'` | 표시 언어. 실제로 한글이 나오게 하려면 `/lib/fullcalendar/core/locales/ko.global.min.js`를 별도로 로드해야 합니다(README 참고) |
| `initialView` | string | `'dayGridMonth'` | 초기 화면(뷰) 종류. 그 외 `timeGridWeek`, `timeGridDay`, `listWeek` 등 FullCalendar 표준 뷰 이름 사용 가능 |
| `headerToolbar` | object | `{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek' }` | 상단 툴바 좌/중/우 버튼 구성(FullCalendar `headerToolbar` 옵션 그대로) |
| `dayMaxEvents` | boolean | `true` | 하루에 표시할 이벤트 수가 넘칠 때 "+N more" 링크로 접을지 여부 |
| `displayEventTime` | boolean | `false` | 이벤트 제목 앞에 시간을 표시할지 여부 |
| `selectable` | boolean | `false` | 날짜/시간대를 드래그로 선택할 수 있게 할지 여부(`select` 이벤트와 함께 사용) |
| `editable` | boolean | `false` | 이벤트를 드래그로 이동(`eventDrop`)하거나 크기 조정(`eventResize`)할 수 있게 할지 여부 |
| `eventMapping` | object | 아래 "eventMapping" 참고 | `setValue`/`addEvent`/`updateEvent`/`getterValue`가 FullCalendar 이벤트 필드(`id`/`title`/`start`/`end`/...)와 실제 데이터 컬럼명을 서로 바꿔치기할 때 쓰는 매핑 테이블. FullCalendar 자체에는 전달되지 않는 컨트롤 전용 옵션입니다 |
| `getter` / `setter` / `transactConfig` / `triggerConfig` | - | `false`/`null` | syn.uicontrols 공통 옵션(값 바인딩·트랜잭션 연동용). FullCalendar 옵션에서는 제외됩니다 |

이 외에도 `syn-options`에 FullCalendar가 지원하는 임의의 옵션(예: `slotMinTime`, `businessHours`, `eventContent`, `views` 등)을 그대로 추가하면 `calendarSettings`에 포함되어 `new FullCalendar.Calendar(el, calendarSettings)`에 전달됩니다. 즉 `eventMapping`/`getter`/`setter`/`transactConfig`/`triggerConfig`/`elID` 6가지만 컨트롤이 가로채고, 나머지는 전부 FullCalendar 옵션으로 그대로 흘러갑니다.

### eventMapping

| 속성 | 기본값 | 설명 |
|---|---|---|
| `id` | `'ScheduleEventID'` | 이벤트 고유 키 컬럼명 |
| `title` | `'ScheduleTitle'` | 이벤트 제목 컬럼명 |
| `start` | `'StartDate'` | 시작일시 컬럼명 |
| `end` | `'EndDate'` | 종료일시 컬럼명 |
| `backgroundColor` | `'BackgroundColor'` | 배경색 컬럼명 |
| `borderColor` | `'BackgroundColor'` | 테두리색 컬럼명(기본값이 배경색과 같은 컬럼을 가리킴에 유의) |
| `textColor` | `'TextColor'` | 글자색 컬럼명 |
| `allDay` | `'AllDay'` | 종일 이벤트 여부 컬럼명 |
| `color` | `'Color'` | 배경/테두리를 한 번에 지정하는 색상 컬럼명 |
| `classNames` | `'ClassNames'` | 이벤트 DOM에 추가할 CSS 클래스 컬럼명 |

매핑에 없는 나머지 컬럼(예: `ShopDailyTaskID`, `Memo` 등 업무 데이터 고유 컬럼)은 자동으로 FullCalendar 이벤트의 `extendedProps`에 들어갑니다. 즉 `event.extendedProps.Memo`처럼 접근합니다.

## 메서드

`syn.uicontrols.$calendar.<메서드명>(...)` 형태로 호출합니다.

| 메서드 | 설명 |
|---|---|
| `getControl(elID)` | 등록된 컨트롤 정보(`{ id, calendar, setting }`)를 반환합니다. `calendar`가 실제 FullCalendar 인스턴스입니다. |
| `getCalendar(elID)` | `getControl(elID).calendar`만 바로 반환하는 축약 메서드. FullCalendar 인스턴스의 원본 API(`updateSize()` 등)를 직접 호출할 때 사용합니다. |
| `getValue(elID, meta)` | 항상 `null`을 반환합니다. Calendar는 다른 컨트롤과 달리 `getValue`가 구현되어 있지 않습니다. 이벤트 전체 목록이 필요하면 `getEvents`를, 변경분만 필요하면 `getterValue`를 사용하세요. |
| `setValue(elID, value, meta)` | 배열(`value`)을 받아 `eventMapping` 기준으로 변환한 뒤, `{elID}_eventSource`라는 이름의 이벤트 소스로 통째로 교체합니다. 기존에 이 이벤트 소스로 들어간 이벤트는 모두 제거되고 새 데이터로 다시 그려집니다. 각 이벤트에는 `Flag: 'R'`(변경없음)이 자동으로 붙습니다. `addEvent` 등으로 별도 추가된 이벤트에는 영향을 주지 않습니다. |
| `getterValue(elID, meta)` | `Flag`가 `C`(생성)/`U`(수정)/`D`(삭제)인 이벤트만 모아 평평한 객체 배열로 반환합니다(`extendedProps` 내용도 최상위로 펼쳐짐). 변경된 부분만 서버에 저장하고 싶을 때 사용합니다. |
| `addEvent(elID, eventData)` | `eventMapping` 기준으로 변환한 새 이벤트를 추가합니다(`Flag: 'C'`). |
| `removeEvent(elID, eventID)` | 이벤트를 제거합니다. 방금 `addEvent`로 추가되어 아직 저장 전인 이벤트(`Flag === 'C'`)는 즉시 화면에서 삭제되고, 이미 서버에 저장된 이벤트(`Flag`가 `R`/`U`)는 화면에서 숨기기만 하고(`display: 'none'`) `Flag`를 `D`로 바꿔서 남겨둡니다(`getterValue`로 삭제 대상을 서버에 알리기 위함). |
| `updateEvent(elID, eventData)` | `eventMapping`의 `id` 컬럼으로 이벤트를 찾아 필드를 갱신합니다. 기존 `Flag`가 `R`(변경없음)이면 `U`로 바뀌고, 이미 `C`/`U`/`D`면 그대로 유지됩니다. 매핑되지 않은 컬럼은 `extendedProps`로 갱신됩니다. |
| `getEvents(elID)` | 현재 달력에 있는 모든 이벤트를 `event.toPlainObject()` 형태의 배열로 반환합니다(변경 여부와 무관하게 전체). |
| `findEvents(elID, filter)` | `{ 컬럼명: 값 }` 형태의 `filter` 객체와 일치하는 이벤트만 찾아 반환합니다. `title`/`id`/`start`/`end`는 이벤트 최상위 필드에서, 그 외 키는 `extendedProps`에서 비교합니다. 문자열 값은 대소문자 무시 부분일치, 그 외 값은 `!=` 비교(느슨한 비교)로 판단합니다. `filter`를 생략하면 전체 이벤트를 반환합니다. |
| `clear(elID, isControlLoad)` | `calendar.removeAllEvents()`를 호출해 이벤트 소스와 무관하게 모든 이벤트를 지웁니다(`setValue`가 지우는 범위보다 넓음). |
| `gotoDate(elID, date)` | 지정한 날짜가 보이도록 달력을 이동합니다(FullCalendar `gotoDate` 그대로 위임). |
| `changeView(elID, viewName, dateOrRange)` | 뷰를 전환합니다(예: `'dayGridMonth'` → `'timeGridWeek'`). |
| `refetchEvents(elID)` | 이벤트 소스가 함수/URL 기반일 때 다시 조회하도록 트리거합니다. |

> `controlLoad(elID, setting)`은 컨트롤이 마크업을 실제 FullCalendar 인스턴스로 초기화하는 내부 진입점으로, 프레임워크가 자동으로 호출합니다. 직접 호출할 일은 거의 없습니다.
>
> `addModuleList`는 폼 제출 시 이 컨트롤을 모듈 목록에 등록하기 위한 내부용 메서드입니다.

## 이벤트 (syn-events)

TreeView 같은 컨트롤과 달리, Calendar의 `syn-events`에 적는 이름은 프레임워크가 별도로 감싼 이름이 아니라 FullCalendar가 원래 지원하는 콜백 옵션 이름 그대로입니다. `controlLoad`가 `setting[hook] = eventHandler`처럼 훅 이름을 그대로 FullCalendar 옵션 키에 대입하기 때문입니다. 따라서 아래 표에 없어도 FullCalendar 문서에 있는 콜백 이름이면 대부분 그대로 사용할 수 있습니다.

| 이벤트명 | 발생 시점 |
|---|---|
| `eventClick` | 이벤트를 클릭했을 때 |
| `dateClick` | 빈 날짜/시간 셀을 클릭했을 때 |
| `select` | 날짜/시간대를 드래그로 선택했을 때(`selectable: true` 필요) |
| `datesSet` | 화면에 보이는 날짜 범위가 바뀌었을 때(뷰 전환, prev/next, `gotoDate` 등). 조회 기간이 바뀔 때마다 서버에서 새 일정을 받아와 `setValue`로 다시 채우는 용도로 많이 사용 |
| `eventDrop` | 이벤트를 드래그해서 다른 날짜/시간으로 이동했을 때(`editable: true` 필요) |
| `eventResize` | 이벤트 크기(기간)를 드래그로 조정했을 때(`editable: true` 필요) |
| `eventDidMount` | 이벤트의 DOM 요소가 렌더링된 직후(툴팁 부착, 스타일 커스터마이징 등에 사용) |
| `eventWillUnmount` | 이벤트의 DOM 요소가 제거되기 직전 |
| `eventMouseEnter` / `eventMouseLeave` | 이벤트 위에 마우스가 들어오거나 나갈 때 |
| `dayCellContent` | 날짜 셀의 기본 콘텐츠(날짜 숫자)를 커스터마이징할 때 |
| `viewDidMount` | 뷰가 렌더링된 직후 |

핸들러 등록 예:

```js
let $samplePage = {
    event: {
        calSample_eventClick(info) {
            // info.event._def.extendedProps 에 매핑되지 않은 원본 컬럼이 들어 있습니다.
            syn.$l.eventLog('calSample_eventClick', info.event.title);
        },
        calSample_datesSet(dateInfo) {
            var calendar = syn.uicontrols.$calendar.getControl('calSample');
            syn.$l.eventLog('calSample_datesSet', dateInfo.startStr + ' ~ ' + dateInfo.endStr);
        },
        calSample_eventDrop(info) {
            syn.$l.eventLog('calSample_eventDrop', info.event.title + ' -> ' + info.event.startStr);
        }
    }
}
```

## 참고

- 변경 이력 추적(`Flag`): 컨트롤은 각 이벤트의 `extendedProps.Flag`에 `R`(변경없음, `setValue`로 처음 채워질 때), `C`(생성, `addEvent`), `U`(수정, `updateEvent`), `D`(삭제, `removeEvent`) 중 하나를 기록합니다. 화면에서 여러 건을 추가/수정/삭제한 뒤 `getterValue(elID)`를 호출하면 `C`/`U`/`D` 상태인 이벤트만 뽑아서 반환하므로, 전체 데이터를 다시 저장하지 않고 변경분만 서버 트랜잭션으로 보내는 패턴을 만들 수 있습니다.
- `getValue`를 쓰면 안 되는 이유: `getValue`는 구현되어 있지 않고 항상 `null`을 반환합니다. 전체 이벤트가 필요하면 `getEvents(elID)`, 변경분만 필요하면 `getterValue(elID)`를 사용하세요.
- `clear` vs `setValue`의 범위 차이: `setValue`는 자신이 만든 이벤트 소스(`{elID}_eventSource`)만 교체하지만, `clear`는 `removeAllEvents()`로 이벤트 소스와 상관없이 전체를 지웁니다. `addEvent`로 추가한 이벤트까지 포함해 전부 지우고 싶다면 `clear`를 사용하세요.
- 내부적으로 FullCalendar 인스턴스를 그대로 감싼 구조이므로, 옵션/콜백의 더 자세한 원본 설명은 FullCalendar 문서를 참고하세요: https://fullcalendar.io/docs
