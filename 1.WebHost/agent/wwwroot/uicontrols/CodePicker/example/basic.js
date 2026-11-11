'use strict';
let $basic = {
    event: {
        btnOpen_click() {
            syn.uicontrols.$codepicker.open('chpCompanyID');
        },

        btnGetValue_click() {
            syn.$l.eventLog('btnGetValue_click', syn.uicontrols.$codepicker.getValue('chpCompanyID'));
        },

        btnSetValue_click() {
            syn.uicontrols.$codepicker.setValue('chpCompanyID', '1000');
            syn.uicontrols.$codepicker.setText('chpCompanyID', '샘플 업체');
        },

        btnClear_click() {
            syn.uicontrols.$codepicker.clear('chpCompanyID');
        },

        // 실무 코드의 실제 시그니처: (elID, inputValue, inputText, result) - elID가 첫 인자로 온다.
        chpCompanyID_change(elID, inputValue, inputText, result) {
            syn.$l.eventLog('chpCompanyID_change', JSON.stringify({ elID: elID, value: inputValue, text: inputText, result: result }));
        }
    }
}
