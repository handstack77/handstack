'use strict';
let $features = {
    method: {
        toDate(offsetDays, time) {
            let date = new Date();
            date.setDate(date.getDate() + offsetDays);
            let text = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            return time ? `${text}T${time}` : text;
        },

        samples() {
            return [
                { TaskID: 1, TaskName: '주간 회의', StartDate: $this.method.toDate(0, '10:00:00'), EndDate: $this.method.toDate(0, '11:00:00'), BackgroundColor: '#206bc4', AllDay: false },
                { TaskID: 2, TaskName: '문서 검토', StartDate: $this.method.toDate(2), EndDate: $this.method.toDate(2), BackgroundColor: '#f76707', AllDay: true },
                { TaskID: 3, TaskName: '고객 미팅', StartDate: $this.method.toDate(3, '14:00:00'), EndDate: $this.method.toDate(3, '15:30:00'), BackgroundColor: '#2fb344', AllDay: false },
                { TaskID: 4, TaskName: '워크숍', StartDate: $this.method.toDate(5), EndDate: $this.method.toDate(8), BackgroundColor: '#ae3ec9', AllDay: true },
                { TaskID: 5, TaskName: '분기 회의 준비', StartDate: $this.method.toDate(0, '15:00:00'), EndDate: $this.method.toDate(0, '16:00:00'), BackgroundColor: '#d63939', AllDay: false }
            ];
        },

        show(title, data) {
            syn.$l.get('preLog').textContent = JSON.stringify(data, null, 2);
            syn.$l.eventLog(title, `${Array.isArray(data) ? data.length + '건' : JSON.stringify(data)}`);
        }
    },

    hook: {
        pageLoad() {
            // setValue 로 채워진 이벤트는 모두 Flag: 'R'(변경없음) 상태로 시작한다.
            syn.uicontrols.$calendar.setValue('calFeatures', $this.method.samples());
        }
    },

    event: {
        calFeatures_eventClick(info) {
            syn.$l.eventLog('calFeatures_eventClick', `${info.event.title} / Flag=${info.event.extendedProps.Flag}`);
        },

        calFeatures_dateClick(info) {
            syn.$l.eventLog('calFeatures_dateClick', info.dateStr);
        },

        calFeatures_select(info) {
            syn.$l.eventLog('calFeatures_select', `${info.startStr} ~ ${info.endStr}`);
        },

        calFeatures_datesSet(dateInfo) {
            syn.$l.eventLog('calFeatures_datesSet', `${dateInfo.startStr} ~ ${dateInfo.endStr} (${dateInfo.view.type})`);
        },

        calFeatures_eventDrop(info) {
            syn.$l.eventLog('calFeatures_eventDrop', `${info.event.title} -> ${info.event.startStr}`);
        },

        calFeatures_eventResize(info) {
            syn.$l.eventLog('calFeatures_eventResize', `${info.event.title} -> ${info.event.startStr} ~ ${info.event.endStr}`);
        },

        // 이벤트 DOM 이 만들어진 직후 호출된다(툴팁 등을 붙일 때 사용).
        calFeatures_eventDidMount(info) {
            info.el.title = `${info.event.title}${info.event.extendedProps.Memo ? ' - ' + info.event.extendedProps.Memo : ''}`;
        },

        btnSetValue_click() {
            syn.uicontrols.$calendar.setValue('calFeatures', $this.method.samples());
        },

        btnAddEvent_click() {
            let taskID = Date.now();
            syn.uicontrols.$calendar.addEvent('calFeatures', {
                TaskID: taskID,
                TaskName: '신규 일정',
                StartDate: $this.method.toDate(1),
                EndDate: $this.method.toDate(1),
                BackgroundColor: '#0ca678',
                AllDay: true,
                Memo: '추가된 일정'
            });
            syn.$l.eventLog('btnAddEvent_click', `TaskID=${taskID} 추가(Flag=C)`);
        },

        btnUpdateEvent_click() {
            syn.uicontrols.$calendar.updateEvent('calFeatures', { TaskID: 1, TaskName: '주간 회의 (변경됨)', BackgroundColor: '#e8590c' });
            syn.$l.eventLog('btnUpdateEvent_click', 'TaskID=1 수정(Flag=U)');
        },

        btnRemoveEvent_click() {
            syn.uicontrols.$calendar.removeEvent('calFeatures', 5);
            syn.$l.eventLog('btnRemoveEvent_click', 'TaskID=5 삭제(저장된 일정은 숨김 처리되고 Flag=D)');
        },

        btnClear_click() {
            syn.uicontrols.$calendar.clear('calFeatures');
            syn.$l.eventLog('btnClear_click', '모든 일정을 지웠습니다.');
        },

        btnGetterValue_click() {
            $this.method.show('btnGetterValue_click', syn.uicontrols.$calendar.getterValue('calFeatures'));
        },

        btnGetEvents_click() {
            $this.method.show('btnGetEvents_click', syn.uicontrols.$calendar.getEvents('calFeatures'));
        },

        btnFindEvents_click() {
            $this.method.show('btnFindEvents_click', syn.uicontrols.$calendar.findEvents('calFeatures', { title: '회의' }));
        },

        btnGetValue_click() {
            syn.$l.eventLog('btnGetValue_click', String(syn.uicontrols.$calendar.getValue('calFeatures')));
        },

        btnGotoDate_click() {
            let date = new Date();
            date.setMonth(date.getMonth() + 1);
            syn.uicontrols.$calendar.gotoDate('calFeatures', date);
        },

        btnWeekView_click() {
            syn.uicontrols.$calendar.changeView('calFeatures', 'timeGridWeek');
        },

        btnMonthView_click() {
            syn.uicontrols.$calendar.changeView('calFeatures', 'dayGridMonth');
        },

        btnListView_click() {
            syn.uicontrols.$calendar.changeView('calFeatures', 'listWeek');
        },

        btnRefetch_click() {
            syn.uicontrols.$calendar.refetchEvents('calFeatures');
            syn.$l.eventLog('btnRefetch_click', '이벤트 소스가 함수/URL 일 때 다시 조회합니다(현재는 정적 데이터).');
        },

        btnGetCalendar_click() {
            let calendar = syn.uicontrols.$calendar.getCalendar('calFeatures');
            syn.$l.eventLog('btnGetCalendar_click', `view: ${calendar.view.type}, 일정 ${calendar.getEvents().length}건`);
        }
    }
}
