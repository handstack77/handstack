'use strict';
let $events = {
    event: {
        dtpEvent_onselect(elID, date) {
            syn.$l.eventLog('dtpEvent_onselect', elID + ' => ' + date);
        },

        btnGetValue_click() {
            var value = syn.uicontrols.$datepicker.getValue('dtpEvent');
            syn.$l.eventLog('btnGetValue_click', JSON.stringify(value));
        },

        btnSetValue_click() {
            syn.uicontrols.$datepicker.setValue('dtpEvent', '2026-07-06');
            syn.$l.eventLog('btnSetValue_click', '2026-07-06');
        },

        btnClear_click() {
            syn.uicontrols.$datepicker.clear('dtpEvent');
            syn.$l.eventLog('btnClear_click', '');
        },

        btnGetControl_click() {
            var control = syn.uicontrols.$datepicker.getControl('dtpEvent');
            syn.$l.eventLog('btnGetControl_click', 'console 확인: control.picker (Pikaday 인스턴스)');
            console.log(control);
            // https://github.com/Pikaday/Pikaday 메서드 참조 (control.picker.getDate(), setMinDate() 등)
        }
    }
}
