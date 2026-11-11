'use strict';
let $basic = {
    prop: {
        // 기본 eventMapping(ScheduleEventID/ScheduleTitle/StartDate/EndDate)에 맞춘 샘플 데이터
        dataSet: [
            { ScheduleEventID: 1, ScheduleTitle: '주간 회의', StartDate: '2026-07-06', EndDate: '2026-07-06', BackgroundColor: '#206bc4' },
            { ScheduleEventID: 2, ScheduleTitle: '프로젝트 킥오프', StartDate: '2026-07-08', EndDate: '2026-07-09', BackgroundColor: '#2fb344' },
            { ScheduleEventID: 3, ScheduleTitle: '여름 휴가', StartDate: '2026-07-20', EndDate: '2026-07-24', BackgroundColor: '#f76707' },
            { ScheduleEventID: 4, ScheduleTitle: '크리스마스', StartDate: '2026-12-25', EndDate: '2026-12-25', BackgroundColor: '#d63939' }
        ]
    },

    hook: {
        pageLoad() {
            // 페이지가 열릴 때 초기 데이터를 채워 넣습니다.
            syn.uicontrols.$calendar.setValue('calBasic', $basic.prop.dataSet);
        }
    },

    event: {
        calBasic_eventClick(info) {
            syn.$l.eventLog('calBasic_eventClick', info.event.title + ' (' + info.event.startStr + ')');
        },

        btnSetValue_click() {
            syn.uicontrols.$calendar.setValue('calBasic', $basic.prop.dataSet);
            syn.$l.eventLog('btnSetValue_click', '샘플 일정으로 다시 채웠습니다.');
        },

        btnGetEvents_click() {
            var events = syn.uicontrols.$calendar.getEvents('calBasic');
            syn.$l.eventLog('btnGetEvents_click', JSON.stringify(events));
            document.getElementById('preLog').textContent = JSON.stringify(events, null, 2);
        },

        btnGetterValue_click() {
            // setValue로 채워진 이벤트는 Flag: 'R'(변경없음)이라 아직은 아무것도 나오지 않습니다.
            // events.html 예제에서 addEvent/updateEvent/removeEvent 이후 이 메서드로 변경분만 뽑는 모습을 확인할 수 있습니다.
            var changed = syn.uicontrols.$calendar.getterValue('calBasic');
            syn.$l.eventLog('btnGetterValue_click', JSON.stringify(changed));
            document.getElementById('preLog').textContent = JSON.stringify(changed, null, 2);
        },

        btnGotoDate_click() {
            syn.uicontrols.$calendar.gotoDate('calBasic', '2026-12-25');
            syn.$l.eventLog('btnGotoDate_click', '2026-12-25로 이동했습니다.');
        },

        btnChangeView_click() {
            syn.uicontrols.$calendar.changeView('calBasic', 'listWeek');
            syn.$l.eventLog('btnChangeView_click', 'listWeek 뷰로 전환했습니다.');
        },

        btnClear_click() {
            syn.uicontrols.$calendar.clear('calBasic');
            syn.$l.eventLog('btnClear_click', '달력의 모든 이벤트를 지웠습니다.');
        }
    }
}
