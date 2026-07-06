'use strict';
let $events = {
    event: {
        chkNotify_change(evt) {
            var value = syn.uicontrols.$checkbox.getValue('chkNotify');
            syn.$l.eventLog('chkNotify_change', 'value: ' + value);
        },

        btnGetValue_click() {
            var value = syn.uicontrols.$checkbox.getValue('chkNotify');
            syn.$l.eventLog('btnGetValue_click', value);
        },

        btnSetValueTrue_click() {
            syn.uicontrols.$checkbox.setValue('chkNotify', true);
            syn.$l.eventLog('btnSetValueTrue_click', 'chkNotify: true');
        },

        btnSetValueFalse_click() {
            syn.uicontrols.$checkbox.setValue('chkNotify', false);
            syn.$l.eventLog('btnSetValueFalse_click', 'chkNotify: false');
        },

        btnToggleValue_click() {
            syn.uicontrols.$checkbox.toggleValue('chkNotify');
            syn.$l.eventLog('btnToggleValue_click', 'toggled');
        },

        btnClear_click() {
            syn.uicontrols.$checkbox.clear('chkNotify');
            syn.$l.eventLog('btnClear_click', 'cleared');
        }
    }
}
