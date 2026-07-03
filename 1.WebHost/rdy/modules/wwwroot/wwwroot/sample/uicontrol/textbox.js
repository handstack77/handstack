'use strict';
let $textbox = {
    event: {
        btnGetValue_click() {
            syn.$l.eventLog('btnGetValue_click', JSON.stringify(syn.uicontrols.$textbox.getValue('txtApplicationID')));
        },

        btnSetValue_click() {
            syn.uicontrols.$textbox.setValue('txtApplicationID', '안녕하세요');
        },

        btnClear_click() {
            syn.uicontrols.$textbox.clear('txtApplicationID');
        }
    },
}
