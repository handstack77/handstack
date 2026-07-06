'use strict';
let $events = {
    event: {
        dtpSearchPeriod_onselect(elID, which, date) {
            syn.$l.eventLog('dtpSearchPeriod_onselect', JSON.stringify({ elID: elID, which: which, date: date }));
        },

        dtpSearchPeriod_onreset(elID, startValue, endValue) {
            syn.$l.eventLog('dtpSearchPeriod_onreset', JSON.stringify({ elID: elID, startValue: startValue, endValue: endValue }));
        },

        dtpSearchPeriod_onconfirm(elID, startValue, endValue) {
            syn.$l.eventLog('dtpSearchPeriod_onconfirm', JSON.stringify({ elID: elID, startValue: startValue, endValue: endValue }));
        },

        btnGetValue_click() {
            syn.$l.eventLog('btnGetValue_click', syn.uicontrols.$dateperiodpicker.getValue('dtpSearchPeriod'));
        },

        btnSetValue_click() {
            syn.uicontrols.$dateperiodpicker.setValue('dtpSearchPeriod', '2026-01-01,2026-01-31');
        },

        btnClear_click() {
            syn.uicontrols.$dateperiodpicker.clear('dtpSearchPeriod');
        }
    }
}
