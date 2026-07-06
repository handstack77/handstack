'use strict';
let $events = {
    event: {
        // syn-events="['change']"로 등록해두면 라디오 선택이 바뀔 때마다 자동으로 호출됩니다.
        rdoGender1_change() {
            syn.$l.eventLog('rdoGender1_change', '남성 선택됨');
        },

        rdoGender2_change() {
            syn.$l.eventLog('rdoGender2_change', '여성 선택됨');
        },

        rdoPayment1_change() {
            syn.$l.eventLog('rdoPayment1_change', '카드 선택됨');
        },

        rdoPayment2_change() {
            syn.$l.eventLog('rdoPayment2_change', '현금 선택됨');
        },

        btnGetGroupNames_click() {
            // 화면에 존재하는 모든 라디오 그룹명을 조회합니다.
            syn.$l.eventLog('btnGetGroupNames_click', JSON.stringify(syn.uicontrols.$radio.getGroupNames()));
        },

        btnGetSelectedByValue_click() {
            syn.$l.eventLog('btnGetSelectedByValue_click', syn.uicontrols.$radio.getSelectedByValue('rdoGender'));
        },

        btnGetSelectedByText_click() {
            syn.$l.eventLog('btnGetSelectedByText_click', syn.uicontrols.$radio.getSelectedByText('rdoGender'));
        },

        btnGetSelectedByID_click() {
            syn.$l.eventLog('btnGetSelectedByID_click', syn.uicontrols.$radio.getSelectedByID('rdoGender'));
        }
    }
}
