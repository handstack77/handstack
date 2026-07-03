'use strict';
let $textarea = {
    event: {
        btnGetValue_click() {
            syn.$l.eventLog('btnGetValue_click', JSON.stringify(syn.uicontrols.$textarea.getValue('txtTextarea')));
        },

        btnSetValue_click() {
            syn.uicontrols.$textarea.setValue('txtTextarea', '안녕하세요');
        },

        btnClear_click() {
            syn.uicontrols.$textarea.clear('txtTextarea');
        },

        txtTextarea_blur() {
            syn.uicontrols.$textarea.setValue('txtTextarea', '안녕하세요');
        }
    }
}
