'use strict';
let $basic = {
    event: {
        divClickable_click(evt) {
            syn.$l.eventLog('divClickable_click', 'value: ' + syn.uicontrols.$element.getValue('divClickable'));
        },

        btnGetValue_click() {
            syn.$l.eventLog('btnGetValue_click', JSON.stringify(syn.uicontrols.$element.getValue('divTotalAmount')));
        },

        btnSetValue_click() {
            syn.uicontrols.$element.setValue('divTotalAmount', 12345);
        },

        btnClear_click() {
            syn.uicontrols.$element.clear('divTotalAmount');
        }
    }
}
