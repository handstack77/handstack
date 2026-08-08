'use strict';
let $validation = {
    event: {
        btnGetMaxlength_click() {
            var value = syn.uicontrols.$textarea.getValue('txtMaxlength');
            syn.$l.eventLog('btnGetMaxlength_click', value + ' (문자 수: ' + value.length + ')');
        },

        btnGetMaxlengthB_click() {
            var value = syn.uicontrols.$textarea.getValue('txtMaxlengthB');
            syn.$l.eventLog('btnGetMaxlengthB_click', value);
        }
    }
}
