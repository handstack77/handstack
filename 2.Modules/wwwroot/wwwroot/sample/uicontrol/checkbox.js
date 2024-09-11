'use strict';
let $checkbox = {
    event: {
        btnGetValue_click() {
            syn.$l.eventLog('btnGetValue_click', JSON.stringify(syn.uicontrols.$checkbox.getValue('chkUseYN1')));
        },

        btnSetValue_click() {
            syn.uicontrols.$checkbox.setValue('chkUseYN1', true);
        },

        btnClear_click() {
            syn.uicontrols.$checkbox.clear('chkUseYN1');
        },

        btnToggleValue_click() {
            syn.uicontrols.$checkbox.toggleValue('chkUseYN2');
        },

        btnGetGroupNames_click() {
            syn.$l.eventLog('btnGetGroupNames_click', JSON.stringify(syn.uicontrols.$checkbox.getGroupNames()));
        }
    }
}
