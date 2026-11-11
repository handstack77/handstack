'use strict';
let $checkbox = {
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
            syn.uicontrols.$list.setValue('lstCheckbox', $checkbox.prop.dataSet);
        }
    },

    event: {
        btnGetChecked_click() {
            // checkbox: true 옵션일 때, 체크된 행의 첫 번째(체크박스) 컬럼 값 목록을 가져옵니다.
            var checkedIds = syn.uicontrols.$list.getControl('lstCheckbox').table.column(0).checkboxes.selected().toArray();
            syn.$l.eventLog('btnGetChecked_click', '선택된 ID 목록: ' + JSON.stringify(checkedIds));
        }
    }
}
