'use strict';
let $datepicker = {
    event: {
        btnGetValue_click() {
            syn.$l.eventLog('btnGetValue_click', JSON.stringify(syn.uicontrols.$datepicker.getValue('dtpDatePicker')));
        },

        btnSetValue_click() {
            syn.uicontrols.$datepicker.setValue('dtpDatePicker', '2020-02-28');
        },

        btnClear_click() {
            syn.uicontrols.$datepicker.clear('dtpDatePicker');
        },

        btnGetControl_click() {
            var picker = syn.uicontrols.$datepicker.getControl('dtpDatePicker');
            // https://github.com/Pikaday/Pikaday 메서드 참조
        }
    }
}
