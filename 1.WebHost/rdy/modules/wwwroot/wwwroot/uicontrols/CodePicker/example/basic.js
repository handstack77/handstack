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

        chpCompanyID_change(value, text, result) {
            syn.$l.eventLog('chpCompanyID_change', JSON.stringify({ value: value, text: text, result: result }));
        }
    }
}
