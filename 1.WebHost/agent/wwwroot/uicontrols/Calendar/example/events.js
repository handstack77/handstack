'use strict';
let $events = {
    prop: {
        // 커스텀 eventMapping(TaskID/TaskName/StartDate/EndDate/BackgroundColor)에 맞춘 샘플 데이터
        dataSet: [
            { TaskID: 1, TaskName: '주간 회의', StartDate: '2026-07-06', EndDate: '2026-07-06', BackgroundColor: '#206bc4' },
            { TaskID: 2, TaskName: '문서 검토', StartDate: '2026-07-10', EndDate: '2026-07-10', BackgroundColor: '#f76707' }
        ]
    },

    hook: {
        pageLoad() {
            // setValue로 채워진 이벤트는 모두 Flag: 'R'(변경없음) 상태로 시작합니다.
            syn.uicontrols.$calendar.setValue('calEvents', $events.prop.dataSet);
        }
    },

    event: {
        calEvents_eventClick(info) {
            syn.$l.eventLog('calEvents_eventClick', info.event.title + ' / Flag=' + info.event.extendedProps.Flag);
        },

        calEvents_datesSet(dateInfo) {
            // 월/주 이동, 뷰 전환 등으로 화면에 보이는 날짜 범위가 바뀔 때마다 호출됩니다.
            // 실제 화면에서는 여기서 서버 재조회 후 setValue로 다시 채우는 패턴을 많이 사용합니다.
            syn.$l.eventLog('calEvents_datesSet', dateInfo.startStr + ' ~ ' + dateInfo.endStr);
        },

        calEvents_eventDrop(info) {
            // editable: true일 때 드래그로 날짜를 옮기면 Flag가 자동으로 'U'로 바뀝니다.
            syn.$l.eventLog('calEvents_eventDrop', info.event.title + ' -> ' + info.event.startStr);
        },

        calEvents_eventResize(info) {
            syn.$l.eventLog('calEvents_eventResize', info.event.title + ' -> ' + info.event.startStr + ' ~ ' + info.event.endStr);
        },

        btnAddEvent_click() {
            var newTaskID = Date.now();
            syn.uicontrols.$calendar.addEvent('calEvents', {
                TaskID: newTaskID,
                TaskName: '신규 일정',
                StartDate: '2026-07-15',
                EndDate: '2026-07-15',
                BackgroundColor: '#2fb344'
            });
            syn.$l.eventLog('btnAddEvent_click', 'TaskID=' + newTaskID + ' 추가(Flag=C)');
        },

        btnUpdateEvent_click() {
            syn.uicontrols.$calendar.updateEvent('calEvents', {
                TaskID: 1,
                TaskName: '주간 회의(시간 변경)'
            });
            syn.$l.eventLog('btnUpdateEvent_click', 'TaskID=1 제목을 변경했습니다(Flag=U).');
        },

        btnRemoveEvent_click() {
            syn.uicontrols.$calendar.removeEvent('calEvents', 2);
            syn.$l.eventLog('btnRemoveEvent_click', 'TaskID=2를 화면에서 숨기고 Flag=D로 표시했습니다.');
        },

        btnGetterValue_click() {
            // 위에서 addEvent/updateEvent/removeEvent로 만든 변경분(C/U/D)만 반환됩니다.
            var changed = syn.uicontrols.$calendar.getterValue('calEvents');
            syn.$l.eventLog('btnGetterValue_click', JSON.stringify(changed));
            document.getElementById('preLog').textContent = JSON.stringify(changed, null, 2);
        },

        btnFindEvents_click() {
            var found = syn.uicontrols.$calendar.findEvents('calEvents', { title: '회의' });
            syn.$l.eventLog('btnFindEvents_click', JSON.stringify(found));
            document.getElementById('preLog').textContent = JSON.stringify(found, null, 2);
        }
    }
}
