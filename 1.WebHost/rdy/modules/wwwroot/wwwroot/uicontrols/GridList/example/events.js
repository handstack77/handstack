'use strict';
let $events = {
    prop: {
        dataSet: [
            { "id": "1", "name": "김민준", "position": "시스템 아키텍트", "office": "서울" },
            { "id": "2", "name": "이서연", "position": "회계 담당자", "office": "도쿄" },
            { "id": "3", "name": "박도윤", "position": "주니어 개발자", "office": "부산" },
            { "id": "4", "name": "최지우", "position": "시니어 개발자", "office": "서울" },
            { "id": "5", "name": "정하윤", "position": "회계 담당자", "office": "도쿄" },
            { "id": "6", "name": "강서준", "position": "통합 전문가", "office": "뉴욕" },
            { "id": "7", "name": "윤지호", "position": "영업 보조", "office": "부산" }
        ]
    },

    hook: {
        pageComplete() {
            syn.uicontrols.$list.setValue('lstEvents', $events.prop.dataSet);
        }
    },

    event: {
        btnGetValue_click() {
            syn.$l.eventLog('btnGetValue_click', JSON.stringify(syn.uicontrols.$list.getValue('lstEvents')));
        },

        btnSetValue_click() {
            syn.uicontrols.$list.setValue('lstEvents', $events.prop.dataSet);
        },

        btnClear_click() {
            syn.uicontrols.$list.clear('lstEvents');
        },

        // select 이벤트: 타입이 'row'일 때만 호출되며, 선택된 행들의 데이터가 전달됩니다.
        lstEvents_select(data, e, dt, type, indexes) {
            syn.$l.eventLog('lstEvents_select', JSON.stringify(data));
        },

        lstEvents_deselect(e, dt, type, indexes) {
            syn.$l.eventLog('lstEvents_deselect', '선택 해제됨');
        },

        // dblclick 이벤트: this는 클릭된 <tr> DOM 엘리먼트, data는 해당 행의 데이터입니다.
        lstEvents_dblclick(row, data) {
            syn.$l.eventLog('lstEvents_dblclick', JSON.stringify(data));
        }
    }
}
