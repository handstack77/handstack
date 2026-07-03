'use strict';
let $checkbox = {
    event: {
        btnGetValue_click() {
            syn.$l.eventLog('btnGetValue_click', JSON.stringify(syn.uicontrols.$checkbox.getValue('chkEnabledYN1')));
        },

        btnSetValue_click() {
            syn.uicontrols.$checkbox.setValue('chkEnabledYN1', true);
        },

        btnClear_click() {
            syn.uicontrols.$checkbox.clear('chkEnabledYN1');
        },

        btnToggleValue_click() {
            syn.uicontrols.$checkbox.toggleValue('chkEnabledYN2');
        },

        btnGetGroupNames_click() {
            syn.$l.eventLog('btnGetGroupNames_click', JSON.stringify(syn.uicontrols.$checkbox.getGroupNames()));
        }
    }
}
