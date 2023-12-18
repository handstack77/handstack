'use strict';
let $helloworld2 = {
    // 공통 기능 상속 선언
    extends: [
    ],

    // 화면 구성에 필요한 환경설정
    config: {
    },

    // 화면내 전역변수 선언
    prop: {
    },

    // life cycle, 외부 이벤트 hook 선언
    hook: {
    },

    // 사용자 이벤트 핸들러 선언
    event: {
        btnHelloWorld_click() {
            alert('반갑습니다 !');
        }
    },

    // 데이터 원본 모델 선언
    model: {
    },

    // 거래 메서드 선언
    transaction: {
    },

    // 기능 메서드 선언
    method: {
    },

    // 외부 이벤트, 콜백 메서드 선언
    message: {
    }
};
