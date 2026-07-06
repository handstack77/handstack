'use strict';
let $basic = {
    event: {
        btnGetValue_click() {
            var value = syn.uicontrols.$textarea.getValue('txtBasic');
            syn.$l.eventLog('btnGetValue_click', value);
        },

        btnSetValue_click() {
            syn.uicontrols.$textarea.setValue('txtBasic', '버튼으로 값을 변경했습니다.');
            syn.$l.eventLog('btnSetValue_click', '값 설정 완료');
        },

        btnClear_click() {
            syn.uicontrols.$textarea.clear('txtBasic');
            syn.$l.eventLog('btnClear_click', '값 초기화 완료');
        },

        btnCountLines_click() {
            var lineCount = syn.uicontrols.$textarea.countLines('txtBasic');
            syn.$l.eventLog('btnCountLines_click', lineCount + '줄');
        }
    }
}
