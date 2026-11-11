'use strict';
let $basic = {
    prop: {
        dataSet: [
            { "id": "1", "name": "김민준", "position": "시스템 아키텍트", "office": "서울", "startDate": "2019/03/02" },
            { "id": "2", "name": "이서연", "position": "회계 담당자", "office": "도쿄", "startDate": "2020/07/18" },
            { "id": "3", "name": "박도윤", "position": "주니어 개발자", "office": "부산", "startDate": "2021/01/11" },
            { "id": "4", "name": "최지우", "position": "시니어 개발자", "office": "서울", "startDate": "2018/09/25" },
            { "id": "5", "name": "정하윤", "position": "회계 담당자", "office": "도쿄", "startDate": "2017/11/03" },
            { "id": "6", "name": "강서준", "position": "통합 전문가", "office": "뉴욕", "startDate": "2022/02/14" },
            { "id": "7", "name": "윤지호", "position": "영업 보조", "office": "부산", "startDate": "2020/05/20" }
        ]
    },

    hook: {
        // GridList는 syn-options만으로 초기 데이터를 주입할 수 없으므로,
        // 화면 초기화가 모두 끝난 뒤(pageComplete) setValue로 데이터를 채웁니다.
        pageComplete() {
            syn.uicontrols.$list.setValue('lstBasic', $basic.prop.dataSet);
        }
    },

    event: {
    }
}
