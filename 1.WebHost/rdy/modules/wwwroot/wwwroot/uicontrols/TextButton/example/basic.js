'use strict';
let $basic = {
    event: {
        btnHello_click() {
            syn.$l.eventLog('btnHello_click', '버튼이 클릭되었습니다. 현재 라벨: ' + syn.uicontrols.$button.getValue('btnHello'));
        },

        btnGetValue_click() {
            syn.$l.eventLog('btnGetValue_click', JSON.stringify(syn.uicontrols.$button.getValue('btnHello')));
        },

        btnSetValue_click() {
            syn.uicontrols.$button.setValue('btnHello', '라벨이 바뀌었어요');
            syn.$l.eventLog('btnSetValue_click', 'btnHello의 value를 변경했습니다.');
        },

        btnClear_click() {
            syn.uicontrols.$button.clear('btnHello');
            syn.$l.eventLog('btnClear_click', 'btnHello의 value를 비웠습니다.');
        }
    }
}
