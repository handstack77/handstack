'use strict';
var $binding = createControlBindingExample({
    adapterName: 'calendar',
    initialValue: [
        {ScheduleEventID: 'E01', ScheduleTitle: '주간 회의', StartDate: '2026-07-06', EndDate: '2026-07-06'},
        {ScheduleEventID: 'E02', ScheduleTitle: '프로젝트 점검', StartDate: '2026-07-15', EndDate: '2026-07-15'}
    ],
    get: function () {
        return syn.uicontrols.$calendar.getEvents('calBinding').map(function (event) {
            return {
                ScheduleEventID: event.id,
                ScheduleTitle: event.title,
                StartDate: event.start.substring(0, 10),
                EndDate: (event.end || event.start).substring(0, 10)
            };
        });
    },
    set: function (value) {
        syn.uicontrols.$calendar.setValue('calBinding', value);
    },
    nextValue: function (current) {
        current.push({
            ScheduleEventID: 'E' + String(current.length + 1).padStart(2, '0'),
            ScheduleTitle: 'Proxy에서 추가한 일정',
            StartDate: '2026-07-23',
            EndDate: '2026-07-23'
        });
        return current;
    },
    events: {
        calBinding_eventDrop: null,
        calBinding_eventResize: null
    },
    business: {
        title: '팀 일정 일괄 저장',
        description: '드래그·기간 변경이 반영된 전체 일정을 서버 저장용 행 목록으로 만듭니다.',
        rules: ['일정 ID와 제목은 필수입니다.', '시작일은 종료일보다 늦을 수 없습니다.', '일정 ID는 중복될 수 없습니다.'],
        validate: function (value) {
            var ids = {};
            var invalid = (value || []).some(function (item) {
                if (!item.ScheduleEventID || !String(item.ScheduleTitle || '').trim() || item.StartDate > item.EndDate || ids[item.ScheduleEventID]) {
                    return true;
                }
                ids[item.ScheduleEventID] = true;
                return false;
            });
            return invalid ? '일정 ID/제목, 기간 순서, ID 중복을 확인하세요.' : true;
        },
        buildPayload: function (value) {
            return {transactionID: 'MD01', inputs: [{type: 'List', dataFieldID: 'TeamSchedule', rows: value}]};
        }
    }
});
